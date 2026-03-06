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
    sendMessage: (content: string) => Promise<void>;
    clearMessages: () => void;
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

    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
    openChat: () => set({ isOpen: true }),
    closeChat: () => set({ isOpen: false }),

    sendMessage: async (content: string) => {
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
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: content, sessionId }),
            });

            if (!res.ok) {
                throw new Error('채팅 응답을 가져오는데 실패했습니다.');
            }

            const data = await res.json();

            const assistantMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: data.reply,
                timestamp: data.timestamp,
            };

            set((state) => ({
                messages: [...state.messages, assistantMessage],
                isLoading: false,
            }));
        } catch {
            // 에러 시 에러 메시지를 어시스턴트 응답으로 표시
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

    clearMessages: () => set({ messages: [] }),
}));
