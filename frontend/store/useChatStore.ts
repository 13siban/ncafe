import { create } from 'zustand';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ChatState {
    messages: ChatMessage[];
    isOpen: boolean;
    isLoading: boolean;
    sessionId: string;
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    sendMessage: (content: string, userId?: string | null, cartSummary?: string | null) => Promise<void>;
    clearMessages: () => void;
    pendingAction:
        | { type: 'navigate'; path: string }
        | { type: 'add_to_cart'; slug: string; quantity: number }
        | { type: 'show_menu_cards'; menus: { slug: string; name: string; price: number }[] }
        | { type: 'reorder'; items: { menuId: number; menuName: string; quantity: number }[] }
        | null;
    clearPendingAction: () => void;
}

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getSessionId(): string {
    if (typeof window === 'undefined') return '';
    let id = sessionStorage.getItem('chat-session-id');
    if (!id) {
        id = generateId();
        sessionStorage.setItem('chat-session-id', id);
    }
    return id;
}

export const useChatStore = create<ChatState>((set, get) => ({
    messages: [],
    isOpen: false,
    isLoading: false,
    sessionId: '',
    pendingAction: null,

    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
    openChat: () => set({ isOpen: true }),
    closeChat: () => set({ isOpen: false }),

    sendMessage: async (content: string, userId?: string | null, cartSummary?: string | null) => {
        const state = get();
        let sessionId = state.sessionId;

        // 세션 ID 초기화 (첫 메시지 전송 시)
        if (!sessionId) {
            sessionId = getSessionId();
            set({ sessionId });
        }

        // 유저 메시지 즉시 추가
        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content,
            timestamp: Date.now(),
        };

        set((state) => ({
            messages: [...state.messages, userMessage],
            isLoading: true,
        }));

        try {
            const aiMessageId = generateId();
            let isFirstChunk = true;

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content, sessionId, stream: true, userId: userId || null, cartSummary: cartSummary || null }),
            });

            if (!res.ok) {
                throw new Error('채팅 응답을 가져오는데 실패했습니다.');
            }

            if (!res.body) {
                throw new Error('Response body is null');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder('utf-8', { fatal: false });
            let sseBuffer = '';
            let fullContent = '';
            let action: ChatState['pendingAction'] = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                sseBuffer += decoder.decode(value, { stream: true });

                const lines = sseBuffer.split('\n');
                sseBuffer = lines.pop() || ''; // 불완전한 마지막 라인 보관

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ') || trimmed.startsWith('data:')) {
                        const data = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed.slice(5);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);

                            // Function Calling 액션 (navigate, add_to_cart)
                            if (parsed.action) {
                                if (parsed.action === 'navigate' && parsed.url) {
                                    action = { type: 'navigate', path: parsed.url };
                                } else if (parsed.action === 'add_to_cart' && parsed.slug) {
                                    action = {
                                        type: 'add_to_cart',
                                        slug: parsed.slug,
                                        quantity: parsed.quantity || 1,
                                    };
                                } else if (parsed.action === 'show_menu_cards' && parsed.menus) {
                                    action = {
                                        type: 'show_menu_cards',
                                        menus: parsed.menus,
                                    };
                                } else if (parsed.action === 'reorder' && parsed.items) {
                                    action = {
                                        type: 'reorder',
                                        items: parsed.items,
                                    };
                                }
                            }
                            // 텍스트 청크
                            else if (parsed.content) {
                                fullContent += parsed.content;

                                if (isFirstChunk) {
                                    set((state) => ({
                                        messages: [...state.messages, {
                                            id: aiMessageId,
                                            role: 'assistant' as const,
                                            content: fullContent,
                                            timestamp: Date.now(),
                                        }],
                                    }));
                                    isFirstChunk = false;
                                } else {
                                    set((state) => ({
                                        messages: state.messages.map((msg) =>
                                            msg.id === aiMessageId
                                                ? { ...msg, content: fullContent }
                                                : msg
                                        ),
                                    }));
                                }
                            }
                        } catch {
                            // 불완전한 JSON은 무시
                        }
                    }
                }
            }

            // 스트리밍 완료 — 최종 상태 업데이트
            let defaultContent = fullContent;
            if (isFirstChunk && action) {
                // 텍스트 없이 액션만 온 경우 (프롬프트에서 '바로 호출하세요' 지시 때문)
                if (action.type === 'add_to_cart') defaultContent = "옵션을 선택해주세요.";
                else if (action.type === 'show_menu_cards') defaultContent = "추천 메뉴입니다.";
                else if (action.type === 'reorder') defaultContent = "이전 주문 상품의 옵션을 확인해주세요.";
                else if (action.type === 'navigate') defaultContent = "해당 페이지로 이동합니다.";
                else defaultContent = "요청을 처리했습니다.";

                set((state) => ({
                    messages: [...state.messages, {
                        id: aiMessageId,
                        role: 'assistant',
                        content: defaultContent,
                        timestamp: Date.now(),
                    }],
                    isLoading: false,
                    pendingAction: action,
                }));
            } else {
                set((state) => ({
                    messages: state.messages.map((msg) =>
                        msg.id === aiMessageId
                            ? { ...msg, content: fullContent }
                            : msg
                    ),
                    isLoading: false,
                    pendingAction: action,
                }));
            }
        } catch (error) {
            console.error('Chat Error:', error);
            const errorMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: '죄송합니다. 일시적인 오류가 발생했어요. 다시 시도해 주세요.',
                timestamp: Date.now(),
            };

            set((state) => ({
                messages: [...state.messages, errorMessage],
                isLoading: false,
            }));
        }
    },

    clearPendingAction: () => set({ pendingAction: null }),
    clearMessages: () => {
        const oldSessionId = get().sessionId;
        // 서버측 세션 히스토리 삭제
        if (oldSessionId) {
            fetch('/api/chat', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: oldSessionId }),
            }).catch(() => {});
        }
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('chat-session-id');
        }
        set({ messages: [], sessionId: '' });
    },
}));
