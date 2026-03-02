/**
 * @deprecated BFF 패턴으로 전환되었습니다.
 * 이 파일 대신 @/app/lib/api.ts 의 fetchAPI, authAPI를 사용하세요.
 *
 * BFF 방식에서는:
 * - JWT를 직접 다루지 않습니다 (httpOnly 쿠키에 자동 저장/전송)
 * - Authorization 헤더를 수동으로 설정하지 않습니다 (Catch-all 프록시가 처리)
 * - fetch('/api/your-endpoint') 만 호출하면 됩니다
 */

// 하위 호환성을 위해 app/lib/api.ts의 함수를 re-export합니다.
export { fetchAPI, authAPI } from '@/app/lib/api';

/**
 * @deprecated fetchAPI를 사용하세요.
 * 기존 코드와의 하위 호환성을 위해 유지합니다.
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});

    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        console.warn('[BFF] 세션이 만료되었거나 유효하지 않습니다. 로그인 페이지로 이동합니다.');
        if (typeof window !== 'undefined') {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        }
    }

    return response;
}
