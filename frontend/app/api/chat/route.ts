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

/**
 * 더미 응답 생성 (Phase 1)
 * Phase 2에서 Gemini API 호출로 대체됩니다.
 */
function generateDummyResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();

    if (message.includes('메뉴') || message.includes('음료') || message.includes('커피')) {
        return '☕ NCafe에서는 다양한 커피와 음료를 제공하고 있어요!\n\n• 아메리카노\n• 카페라떼\n• 바닐라라떼\n• 카라멜 마키아토\n• 아이스티\n\n자세한 메뉴는 상단의 "Menu" 탭에서 확인하실 수 있어요!';
    }

    if (message.includes('가격') || message.includes('얼마')) {
        return '💰 메뉴별 가격은 "Menu" 페이지에서 확인하실 수 있어요. 대부분의 음료는 3,000원~6,000원 사이입니다!';
    }

    if (message.includes('영업') || message.includes('시간') || message.includes('오픈')) {
        return '🕐 NCafe 영업시간\n\n• 평일: 08:00 ~ 22:00\n• 주말: 09:00 ~ 21:00\n• 공휴일: 10:00 ~ 20:00';
    }

    if (message.includes('위치') || message.includes('주소') || message.includes('어디')) {
        return '📍 NCafe는 현재 온라인으로 운영되고 있어요. 위치 정보는 추후 업데이트될 예정입니다!';
    }

    if (message.includes('안녕') || message.includes('하이') || message.includes('hello') || message.includes('hi')) {
        return '안녕하세요! 👋 NCafe AI 어시스턴트입니다.\n\n무엇이든 물어보세요!\n• 메뉴 정보\n• 가격 안내\n• 영업시간\n• 기타 궁금한 점';
    }

    if (message.includes('추천')) {
        return '✨ 오늘의 추천 메뉴!\n\n🥇 바닐라라떼 - 달콤하고 부드러운 맛\n🥈 아메리카노 - 깔끔한 커피 본연의 맛\n🥉 카라멜 마키아토 - 달콤 쌉싸름한 조화\n\n어떤 메뉴가 끌리시나요? 😊';
    }

    return '감사합니다! 😊 NCafe에 대해 궁금한 것이 있으시면 언제든 물어보세요.\n\n예를 들어:\n• "메뉴 알려줘"\n• "가격이 어떻게 돼?"\n• "영업시간 알려줘"\n• "추천 메뉴 있어?"';
}

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

        // 더미 응답 생성 (Phase 2에서 Gemini 호출로 교체)
        const reply = generateDummyResponse(message);

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
