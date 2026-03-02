/**
 * BFF(Backend For Frontend) 패턴 인증 스토어
 *
 * JWT는 Next.js 서버의 iron-session이 httpOnly 쿠키로 관리하며,
 * 이 스토어는 클라이언트 측의 사용자 인터페이스 상태(로그인 여부, 유저 정보)를 동기화합니다.
 */
import { create } from 'zustand';
import { authAPI } from '@/app/lib/api';

interface SessionUser {
    id: string;
    email: string;
    nickname: string;
    username: string;
    role: string;
}

interface AuthState {
    user: SessionUser | null;
    isLoading: boolean;
    setUser: (user: SessionUser | null) => void;
    clearUser: () => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

/**
 * @deprecated 이 스토어는 더 이상 JWT를 저장하지 않습니다.
 * SSR/CSR 간 상태 동기화가 필요한 경우에만 사용하세요.
 * 일반적으로는 authAPI.getSession()을 직접 호출하는 것을 권장합니다.
 */
export const useAuthStore = create<AuthState>()((set) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user, isLoading: false }),
    clearUser: () => set({ user: null, isLoading: false }),

    /** 서버 세션을 확인하여 스토어 상태 동기화 */
    checkAuth: async () => {
        try {
            set({ isLoading: true });
            const session = await authAPI.getSession();
            if (session && session.user) {
                set({ user: session.user, isLoading: false });
            } else {
                set({ user: null, isLoading: false });
            }
        } catch (error) {
            console.error('Session check failed:', error);
            set({ user: null, isLoading: false });
        }
    },

    /** 로그아웃 처리 */
    logout: async () => {
        try {
            await authAPI.logout();
            set({ user: null });
        } catch (error) {
            console.error('Logout failed:', error);
            set({ user: null });
        }
    },

    // 하위 호환성용 alias
    login: (_token: string, username: string, role: string) =>
        set({
            user: { id: username, email: username, nickname: username, username, role },
            isLoading: false
        }),
}));
