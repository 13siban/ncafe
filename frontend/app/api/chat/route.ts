import { NextRequest, NextResponse } from 'next/server';
import http from 'http';

/**
 * 세션별 대화 히스토리를 메모리에 저장
 */
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

const chatHistories = new Map<string, ChatMessage[]>();

// 히스토리 최대 보관 수 (메모리 관리)
const MAX_HISTORY = 50;

const chatServerUrl = process.env.CHAT_SERVER_URL || 'http://localhost:8000';

/**
 * SSE 텍스트에서 응답 content만 추출한다.
 */
function extractReplyFromSSE(sseText: string): string {
    let fullReply = '';
    const lines = sseText.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') || trimmed.startsWith('data:')) {
            const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
            if (data === '[DONE]') continue;
            try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                    fullReply += parsed.content;
                }
            } catch {
                // 불완전한 JSON은 무시
            }
        }
    }
    return fullReply;
}

export async function POST(request: NextRequest) {
    try {
        const { message, sessionId, stream, userId, cartSummary } = await request.json();

        if (!message || !sessionId) {
            return NextResponse.json(
                { error: '메시지와 세션 ID가 필요합니다.' },
                { status: 400 },
            );
        }

        // 기존 히스토리 가져오기 (없으면 빈 배열, 직접 수정 안함)
        const oldHistory = chatHistories.get(sessionId) || [];
        
        // 새 유저 메시지를 포함한 새로운 히스토리 배열
        let history: ChatMessage[] = [
            ...oldHistory,
            {
                role: 'user' as const,
                content: message,
                timestamp: Date.now(),
            }
        ];

        const agentPayload = JSON.stringify({
            messages: history.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                content: m.content,
            })),
            stream: !!stream,
            userId: userId || null,
            cartSummary: cartSummary || null,
        });

        // === SSE 스트리밍 모드 ===
        if (stream) {
            const sseStream = await requestStreamFromAgent(agentPayload);

            // tee() 대신 수동으로 chunk를 복제하여 backpressure deadlock 방지
            const historyChunks: Uint8Array[] = [];
            
            const passThrough = new TransformStream<Uint8Array, Uint8Array>({
                transform(chunk, controller) {
                    // 클라이언트에 즉시 전달
                    controller.enqueue(chunk);
                    // 히스토리용으로 복사본 저장
                    historyChunks.push(new Uint8Array(chunk));
                },
                flush() {
                    // 스트림 완료 후 히스토리 저장
                    const decoder = new TextDecoder();
                    const text = historyChunks.map(c => decoder.decode(c, { stream: true })).join('') + decoder.decode();
                    const fullReply = extractReplyFromSSE(text);
                    if (fullReply) {
                        history.push({
                            role: 'assistant',
                            content: fullReply,
                            timestamp: Date.now(),
                        });
                        if (history.length > MAX_HISTORY) {
                            history = history.slice(-MAX_HISTORY);
                        }
                        chatHistories.set(sessionId, history);
                    }
                }
            });

            const clientStream = sseStream.pipeThrough(passThrough);

            return new NextResponse(clientStream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no',
                },
            });
        }

        // === 일반 JSON 모드 ===
        const agentResponse = await fetch(`${chatServerUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: agentPayload,
        });

        if (!agentResponse.ok) {
            const errorText = await agentResponse.text();
            console.error('Agent server error:', errorText);
            throw new Error(`Agent server error: ${agentResponse.status}`);
        }

        const agentData = await agentResponse.json();
        const reply = agentData.content;

        // 어시스턴트 응답 추가
        history.push({
            role: 'assistant',
            content: reply,
            timestamp: Date.now(),
        });

        // 히스토리가 너무 길어지면 오래된 메시지 제거
        if (history.length > MAX_HISTORY) {
            history = history.slice(-MAX_HISTORY);
        }

        // 히스토리 저장
        chatHistories.set(sessionId, history);

        return NextResponse.json({
            reply,
            timestamp: Date.now(),
        });
    } catch {
        return NextResponse.json(
            { error: '채팅 처리 중 오류가 발생했습니다.' },
            { status: 500 },
        );
    }
}

/**
 * Node.js http 모듈을 사용하여 Agent Server의 SSE 응답을 버퍼링 없이 전달한다.
 * Next.js의 fetch(undici)는 SSE 응답을 내부 버퍼링하기 때문에 http 모듈을 사용.
 */
function requestStreamFromAgent(payload: string): Promise<ReadableStream<Uint8Array>> {
    const url = new URL(`${chatServerUrl}/chat`);

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

export async function DELETE(request: NextRequest) {
    const { sessionId } = await request.json();
    if (sessionId) {
        chatHistories.delete(sessionId);
    }
    return NextResponse.json({ success: true });
}
