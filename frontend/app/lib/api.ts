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

            // 401이면 로그인 페이지로 리다이렉트
            if (status === 401 && typeof window !== 'undefined') {
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

    /** 회원가입: 새로운 사용자 등록 */
    signup: (username: string, password: string) =>
        fetchAPI('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),
};

// 매장 관리 API 모음
export const adminStoreAPI = {
    /** 매장 현재 상태 및 설정 조회 */
    getStoreStatus: () => fetchAPI('/admin/store/status'),

    /** 매장 영업 시작 */
    openStore: () => fetchAPI('/admin/store/open', { method: 'PUT' }),

    /** 매장 영업 종료 */
    closeStore: () => fetchAPI('/admin/store/close', { method: 'PUT' }),

    /** 영업 시간 및 매장 정보 설정 업데이트 */
    updateSettings: (params: {
        openTime: string;
        closeTime: string;
        cafeName?: string;
        description?: string;
        contactNumber?: string;
        address?: string;
        faviconUrl?: string;
        faviconDarkUrl?: string;
    }) =>
        fetchAPI('/admin/store/settings', {
            method: 'PUT',
            body: JSON.stringify(params),
        }),

    /** 파비콘 업로드 */
    uploadFavicon: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchAPI('/admin/store/favicon', {
            method: 'POST',
            body: formData,
        });
    }
};

// 대시보드 및 통계 API 모음
export const adminDashboardAPI = {
    /** 기간별 대시보드 통계 조회 (period: daily, weekly, monthly) */
    getStats: (period: string = 'daily') => fetchAPI(`/admin/dashboard/stats?period=${period}`),

    /** 최근 주문 5건 조회 */
    getRecentOrders: () => fetchAPI('/admin/dashboard/recent-orders'),
};

// 매출 분석 API 모음
export const adminSalesAPI = {
    /** 기간별 매출 요약 조회 */
    getSummary: (period: string = 'daily', date?: string) =>
        fetchAPI(`/admin/sales/summary?period=${period}${date ? `&date=${date}` : ''}`),

    /** 특정 기간의 완료 주문 내역 조회 */
    getOrders: (period: string = 'daily', date: string) => fetchAPI(`/admin/sales/orders?period=${period}&date=${date}`),

    /** 상품별 판매량 랭킹 조회 */
    getMenuRanking: (period: string = 'daily', date?: string) =>
        fetchAPI(`/admin/sales/menu-ranking?period=${period}${date ? `&date=${date}` : ''}`),

    /** 매출 차트 데이터 조회 */
    getChart: (period: string = 'daily', date?: string) =>
        fetchAPI(`/admin/sales/chart?period=${period}${date ? `&date=${date}` : ''}`),
};

