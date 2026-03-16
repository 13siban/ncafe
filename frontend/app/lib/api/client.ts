/**
 * BFF 패턴 클라이언트 API - 공통 fetch wrapper
 *
 * 핵심 특징:
 * - localStorage 관련 코드 없음
 * - Authorization 헤더를 수동으로 넣지 않음 (Catch-all 프록시가 자동 처리)
 * - 쿠키는 브라우저가 자동 전송 (same-origin 기본값)
 * - 401 에러 시 로그인 페이지로 리다이렉트
 */
export async function fetchAPI(endpoint: string, options?: RequestInit & { skipRedirect?: boolean }) {
    try {
        const isFormData = options?.body instanceof FormData;
        const skipRedirect = options?.skipRedirect;

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
        });

        if (!res.ok) {
            let message = `Error: ${res.status} ${res.statusText}`;
            let status = res.status;

            try {
                const body = await res.json();
                if (body && body.message) {
                    message = body.message;
                }
            } catch {
                /* no json body */
            }

            if (status === 401 && typeof window !== 'undefined' && !skipRedirect) {
                const currentPath = window.location.pathname;
                const isAuthEndpoint = endpoint.startsWith('/auth/');
                if (!currentPath.startsWith('/login') && !isAuthEndpoint) {
                    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
                    return;
                }
            }

            const error: any = new Error(message);
            error.status = status;
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
