# AI 채팅 서버 프로젝트 생성 프롬프트
아래 명세에 따라 Python FastAPI 기반 AI 채팅 서버 프로젝트를 생성하라.
## 기술 스택
- Python 3.11+
- FastAPI
- Google Gemini API (`google-genai` SDK)
- SSE 스트리밍 (`sse-starlette`)
- 환경변수 관리 (`python-dotenv`)
## 프로젝트 구조
```
ai-agent/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── routers/
│   │   ├── __init__.py
│   │   └── chat.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── gemini.py
│   └── models/
│       ├── __init__.py
│       └── schemas.py
├── .env
├── .env.example
├── .gitignore
└── requirements.txt
```
## 파일별 명세
### requirements.txt
```
fastapi
uvicorn
google-genai
python-dotenv
sse-starlette
```
### .env.example
```
GEMINI_API_KEY=your-api-key-here
```
### .gitignore
```
.venv/
__pycache__/
.env
```
### app/config.py
- `dotenv`로 `.env` 로드
- `GEMINI_API_KEY`: 환경변수에서 읽기
### app/models/schemas.py
- `Message`: `role` (str), `content` (str)
- `ChatRequest`: `messages` (list[Message]), `stream` (bool, 기본값 True)
### app/services/gemini.py
- `google.genai.Client`를 `GEMINI_API_KEY`로 초기화
- 모델: `gemini-2.0-flash`
- `chat(messages) -> str`: 동기 응답. `client.models.generate_content()` 사용
- `chat_stream(messages) -> Generator[str]`: 스트리밍 응답. `client.models.generate_content_stream()` 사용. 각 chunk의 `.text`를 yield
- `messages` 파라미터 형식: `[{"role": "user"|"model", "parts": [{"text": "..."}]}]`
### app/routers/chat.py
- `POST /chat`
- 요청 바디: `ChatRequest`
- `to_gemini_messages(messages)` 헬퍼: `Message` 리스트를 Gemini 형식으로 변환
  - `{"role": m.role, "parts": [{"text": m.content}]}`
- `stream=false`: `chat()` 호출 → `{"content": "..."}` 반환
- `stream=true`: `chat_stream()` 호출 → SSE 응답
  - 각 토큰: `data: {"content": "토큰"}`
  - 완료: `data: [DONE]`
- SSE 응답은 `sse_starlette.sse.EventSourceResponse` 사용
### app/main.py
- `FastAPI(title="AI Chat Server")`
- CORS 미들웨어: 모든 origin 허용
- `chat.router` 등록
- `GET /health` → `{"status": "ok"}`
## 실행 방법
```bash
uvicorn app.main:app --reload --port 8000
```
## API 테스트 예시
### 동기 응답
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "파이썬이 뭐야?"}], "stream": false}'
```
### 스트리밍 응답
```bash
curl -N -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "파이썬이 뭐야?"}], "stream": true}'
```
### 멀티턴 대화
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [
    {"role": "user", "content": "나는 홍길동이야"},
    {"role": "model", "content": "안녕하세요, 홍길동님!"},
    {"role": "user", "content": "내 이름이 뭐라고?"}
  ], "stream": false}'
```
## 제약 조건
- 대화 히스토리는 서버에 저장하지 않는다. 클라이언트가 매 요청에 전체 히스토리를 포함해서 보낸다.
- Gemini의 role은 `user`와 `model`만 사용한다 (`assistant` 아님).
- `__init__.py`는 빈 파일로 생성한다.
- 불필요한 주석, docstring, 타입 힌트 외의 설명을 넣지 않는다.