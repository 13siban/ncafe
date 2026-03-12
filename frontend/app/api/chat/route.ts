import { NextRequest, NextResponse } from 'next/server';

/**
 * 세션별 대화 히스토리를 메모리에 저장
 * Phase 2에서 Gemini API로 교체 시, 이 히스토리를 Gemini에 전달합니다.
 */
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

const chatHistories = new Map<string, ChatMessage[]>();

// 히스토리 최대 보관 수 (메모리 관리)
const MAX_HISTORY = 50;



export async function POST(request: NextRequest) {
    try {
        const { message, sessionId } = await request.json();

        if (!message || !sessionId) {
            return NextResponse.json(
                { error: '메시지와 세션 ID가 필요합니다.' },
                { status: 400 },
            );
        }

        // 기존 히스토리 가져오기 (없으면 빈 배열)
        let history = chatHistories.get(sessionId) || [];

        // 유저 메시지 추가
        history.push({
            role: 'user',
            content: message,
            timestamp: Date.now(),
        });

        // agent-server 호출 (Phase 2)
        const chatServerUrl = process.env.CHAT_SERVER_URL || 'http://localhost:8000';
        const agentResponse = await fetch(`${chatServerUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: history.map((m) => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    content: m.content,
                })),
                stream: false,
            }),
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

