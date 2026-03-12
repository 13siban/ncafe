# 버그 수정 요청: AI 채팅 SSE 스트리밍이 정상 동작하도록 수정

## 절대 금지 사항 (반드시 지킬 것)
- **기존 CSS, 디자인, 레이아웃을 절대 수정하지 마세요**
- **기존에 동작하는 코드를 삭제하거나 재작성하지 마세요**
- **파일 전체를 다시 작성하지 마세요. 기존 코드에서 문제가 되는 부분만 수정하세요**
- 스타일(CSS/module.css), 컴포넌트 구조, HTML 마크업은 일절 건드리지 마세요
- 채팅 패널의 UI, 버튼, 입력창 등 기존 디자인에 영향을 주는 변경을 하지 마세요

## 목표
AI 채팅에서 메시지를 보내면 AI 응답이 **글자 단위로 실시간 스트리밍**되어야 한다.
응답이 한꺼번에 나오거나, 한참 뒤에 나오거나, 텍스트가 깨지면 안 된다.

## 전체 데이터 흐름 (이 순서대로 점검)
```
브라우저 (ChatPanel.tsx)
  ↕ AsyncGenerator (aiAgent.ts)
    ↕ SSE over HTTP
      ↕ Next.js BFF 프록시 (route.ts)   ← 여기서 버퍼링 문제가 가장 많이 발생
        ↕ Node.js http 모듈
          ↕ Agent Server / FastAPI (chat.py)
            ↕ SSE (sse-starlette)
              ↕ Gemini Python SDK (gemini.py)
                ↕ Gemini API
```

## 점검할 파일 목록 (이 파일들만 확인하고 수정하세요)

---

### 1. `agent-server/app/services/gemini.py` — Gemini API 호출 확인

**확인할 것:** 비동기 클라이언트를 사용하고 있는가?

```python
# ❌ 잘못된 코드 — 동기 클라이언트는 이벤트 루프를 블로킹함
client = genai.Client(api_key=GEMINI_API_KEY)

async def chat_stream(messages):
    response = client.models.generate_content_stream(  # 동기 호출
        model=MODEL_NAME, contents=messages
    )
    for chunk in response:  # 동기 순회
        yield chunk.text
```

**위와 같은 코드가 있다면 아래처럼 수정:**

```python
# ✅ 올바른 코드 — 비동기 클라이언트 + aio 메서드
async_client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options={'api_version': 'v1alpha'}
)

async def chat_stream(messages):
    response = await async_client.aio.models.generate_content_stream(
        model=MODEL_NAME, contents=messages
    )
    async for chunk in response:  # 비동기 순회
        if chunk.text:
            yield chunk.text
```

**체크 포인트:**
- [ ] `genai.Client`에 `http_options={'api_version': 'v1alpha'}`가 있는가?
- [ ] `aio.models.generate_content_stream`을 사용하는가? (`aio`가 빠지면 안 됨)
- [ ] `async for`를 사용하는가? (`for`가 아닌 `async for`)

---

### 2. `agent-server/app/routers/chat.py` — SSE 이벤트 변환 확인

**확인할 것:** `sse-starlette`의 `EventSourceResponse`를 사용하고, 청크를 즉시 yield하는가?

```python
from sse_starlette.sse import EventSourceResponse

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # ... 히스토리 처리 ...

    async def event_generator():
        async for chunk in gemini.chat_stream(history, system_prompt=system_prompt):
            if chunk:
                yield {
                    "data": json.dumps({"content": chunk}, ensure_ascii=False)
                }
        yield {"data": "[DONE]"}

    return EventSourceResponse(event_generator())
```

**체크 포인트:**
- [ ] `sse-starlette` 패키지가 `requirements.txt`에 있는가?
- [ ] `EventSourceResponse`를 사용하는가?
- [ ] yield 형식이 `{"data": json.dumps(...)}`인가?
- [ ] 마지막에 `{"data": "[DONE]"}`을 yield하는가?

---

### 3. `frontend/app/api/agent/chat/route.ts` — BFF 프록시 (가장 중요)

**이 파일이 스트리밍 문제의 가장 흔한 원인이다.**

**확인할 것:** `fetch` 대신 Node.js `http` 모듈을 사용하는가?

```typescript
// ❌ 잘못된 코드 — fetch(undici)가 SSE 응답을 내부 버퍼링함
const response = await fetch(`${AGENT_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});
return new NextResponse(response.body, {
    headers: { 'Content-Type': 'text/event-stream' },
});
```

**위와 같이 `fetch`로 Agent Server에 요청하고 있다면, 아래처럼 `http` 모듈로 교체:**

```typescript
// ✅ 올바른 코드 — Node.js http 모듈로 버퍼링 없이 전달
import { NextRequest, NextResponse } from 'next/server';
import http from 'http';

const AGENT_BASE = process.env.AGENT_BASE_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const payload = JSON.stringify(body);

    if (body.stream) {
        const stream = await requestStreamFromAgent(payload);
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no',
            },
        });
    }

    // 일반 JSON 요청 (스트리밍이 아닌 경우)
    const response = await fetch(`${AGENT_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
    });
    return NextResponse.json(await response.json());
}

function requestStreamFromAgent(payload: string): Promise<ReadableStream<Uint8Array>> {
    const url = new URL(`${AGENT_BASE}/chat`);

    return new Promise((resolve, reject) => {
        const httpReq = http.request(
            {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                },
            },
            (res) => {
                if (res.statusCode && res.statusCode >= 400) {
                    reject(new Error(`Agent Server responded with status: ${res.statusCode}`));
                    return;
                }

                const stream = new ReadableStream<Uint8Array>({
                    start(controller) {
                        res.on('data', (chunk: Buffer) => {
                            controller.enqueue(new Uint8Array(chunk));
                        });
                        res.on('end', () => {
                            controller.close();
                        });
                        res.on('error', (err) => {
                            controller.error(err);
                        });
                    },
                    cancel() {
                        res.destroy();
                    },
                });

                resolve(stream);
            }
        );

        httpReq.on('error', reject);
        httpReq.write(payload);
        httpReq.end();
    });
}
```

**왜 fetch가 안 되는가:**
Next.js의 `fetch`는 내부적으로 undici를 사용하는데, undici가 SSE 응답을 내부 버퍼에 모아두기 때문에 `response.body`를 `NextResponse`에 전달해도 실시간 스트리밍이 안 된다.
Node.js `http` 모듈은 `res.on('data')`로 원시 청크를 즉시 받아서 전달할 수 있다.

**체크 포인트:**
- [ ] `import http from 'http'`가 있는가?
- [ ] 스트리밍 요청에서 `fetch` 대신 `http.request`를 사용하는가?
- [ ] 응답 헤더에 `'X-Accel-Buffering': 'no'`가 있는가?

---

### 4. `frontend/app/lib/aiAgent.ts` — SSE 파서 확인

**확인할 것 3가지:**

**(a) `TextDecoder`에 `stream: true`가 있는가?**

```typescript
// ❌ 잘못된 코드 — 한글이 깨질 수 있음
const decoder = new TextDecoder();
const text = decoder.decode(value);
```

```typescript
// ✅ 올바른 코드
const decoder = new TextDecoder('utf-8', { fatal: false });
buffer += decoder.decode(value, { stream: true });
```

**(b) 불완전한 SSE 라인을 버퍼에 유지하는가?**

```typescript
// ❌ 잘못된 코드 — 청크 경계에서 잘린 데이터가 유실됨
const lines = chunk.split('\n');
for (const line of lines) {
    // ... 파싱 ...
}
```

```typescript
// ✅ 올바른 코드 — 불완전한 마지막 라인은 버퍼에 유지
const lines = buffer.split('\n');
buffer = lines.pop() || '';  // ← 핵심: 마지막 요소를 버퍼에 보관

for (const line of lines) {
    // ... 파싱 ...
}
```

**(c) 전체 올바른 패턴:**

```typescript
export async function* sendMessageStream(
    sessionId: string,
    userMessage: string,
): AsyncGenerator<string, void, unknown> {
    const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session_id: sessionId,
            message: userMessage,
            stream: true,
        }),
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    if (!response.body) {
        throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6);
                if (data === '[DONE]') return;

                try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                        yield parsed.content;
                    }
                } catch {
                    // 불완전한 JSON은 무시
                }
            }
        }
    }
}
```

**체크 포인트:**
- [ ] `decoder.decode(value, { stream: true })`에 `stream: true`가 있는가?
- [ ] `buffer = lines.pop() || ''`로 불완전한 라인을 보관하는가?
- [ ] `data === '[DONE]'`일 때 `return`하는가?

---

### 5. `frontend/app/(public)/_components/AIAgent/ChatPanel.tsx` — UI 스트리밍 렌더링 확인

**확인할 것:** `for await` 루프에서 청크를 받을 때마다 메시지 content에 누적 추가하는가?

```typescript
for await (const chunk of sendMessageStream(sessionId, messageText)) {
    if (typeof chunk === 'string') {
        setMessages(prev =>
            prev.map(msg =>
                msg.id === aiMessageId
                    ? { ...msg, content: msg.content + chunk }
                    : msg
            )
        );
    }
}
```

**체크 포인트:**
- [ ] `for await`를 사용하는가? (일반 `for`가 아닌 `for await`)
- [ ] `msg.content + chunk`로 **누적 추가**하는가? (덮어쓰기가 아닌 이어붙이기)
- [ ] 스트리밍 시작 전에 빈 AI 메시지를 미리 추가해두는가?

---

## 최종 체크리스트

수정 후 아래를 모두 확인하세요:
- [ ] 채팅 패널의 디자인이 변경 전과 동일한가?
- [ ] 기존 페이지들의 디자인이 변경 전과 동일한가?
- [ ] 채팅에서 메시지를 보내면 AI 응답이 글자 단위로 실시간으로 나타나는가?
- [ ] 한글이 깨지지 않는가?
- [ ] 응답이 한꺼번에 나오지 않고 점진적으로 나오는가?

## 다시 한번 강조
**기존 CSS, 스타일, 마크업, 컴포넌트 구조를 절대 수정하지 마세요.**
**스트리밍 로직에서 문제가 되는 부분만 찾아서 수정하세요.**
