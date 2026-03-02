/**
 * BFF 패턴 클라이언트 API 유틸리티
 *
 * 핵심 특징:
 * - localStorage 관련 코드 없음
 * - Authorization 헤더를 수동으로 넣지 않음 (Catch-all 프록시가 자동 처리)
 * - 쿠키는 브라우저가 자동 전송 (same-origin 기본값)
 * - 401 에러 시 로그인 페이지로 리다이렉트
 */
export async function fetchAPI(endpoint: string, options?: RequestInit) {
    try {
        const isFormData = options?.body instanceof FormData;

        const defaultHeaders: HeadersInit = {
            Accept: 'application/json',
            ...(options?.headers),
        };

        if (!isFormData) {
            (defaultHeaders as any)['Content-Type'] = 'application/json';
        }

        const res = await fetch(`/api${endpoint}`, {
            ...options,
            headers: defaultHeaders,
            // credentials: 'same-origin' 이 기본값이므로 쿠키 자동 전송
        });

        if (!res.ok) {
            // 401이면 로그인 페이지로 리다이렉트
            if (res.status === 401 && typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
                return;
            }
            const error: any = new Error(`API Error: ${res.status}`);
            error.status = res.status;
            try {
                const body = await res.json();
                error.message = body.message || error.message;
            } catch {
                /* no json body */
            }
            throw error;
        }

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return res.json();
        }
        return null;
    } catch (error: any) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            const networkError: any = new Error('Network Error: 서버에 연결할 수 없습니다.');
            networkError.status = 0;
            throw networkError;
        }
        throw error;
    }
}

// 인증 API 모음
export const authAPI = {
    /**
     * 로그인: username과 password로 로그인.
     * JWT는 httpOnly 쿠키에 저장되므로 반환값에 토큰이 없습니다.
     * 반환값: { user: { id, email, nickname, role } }
     */
    login: (username: string, password: string) =>
        fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),

    /** 로그아웃: 서버에서 세션 쿠키 삭제 */
    logout: () => fetchAPI('/auth/logout', { method: 'POST' }),

    /** 현재 세션에서 사용자 정보 조회 */
    getSession: () => fetchAPI('/auth/session'),
};
