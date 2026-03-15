/**
 * BFF 패턴 클라이언트 API 유틸리티
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

            // 401이면 로그인 페이지로 리다이렉트 (skipRedirect가 아닐 때만)
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
    signup: (username: string, password: string, nickname?: string, email?: string, phoneNumber?: string) =>
        fetchAPI('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password, nickname, email, phoneNumber }),
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

export const galleryAPI = {
    /** 갤러리 퍼블릭 목록 조회 */
    getPublicImages: () => fetchAPI('/gallery/public'),

    /** 어드민 모든 갤러리 목록 조회 */
    getAdminImages: () => fetchAPI('/admin/gallery'),

    /** 갤러리 이미지 업로드 */
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetchAPI('/admin/gallery/upload', {
            method: 'POST',
            body: formData,
        });
    },

    /** 갤러리 이미지 업데이트 (정렬순서, 표시여부) */
    updateImage: (id: number, params: { sortOrder?: number; isVisible?: boolean }) =>
        fetchAPI(`/admin/gallery/${id}`, {
            method: 'PUT',
            body: JSON.stringify(params),
        }),

    /** 갤러리 이미지 삭제 */
    deleteImage: (id: number) =>
        fetchAPI(`/admin/gallery/${id}`, {
            method: 'DELETE',
        }),

    /** 갤러리 이미지 순서 변경 (전체 변경) */
    reorderImages: (orderedIds: number[]) =>
        fetchAPI('/admin/gallery/reorder', {
            method: 'PUT',
            body: JSON.stringify({ orderedIds }),
        }),
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

// 사용자 마이페이지 API 모음
export const userAPI = {
    /** 내 프로필 조회 */
    getProfile: () => fetchAPI('/users/me'),

    /** 프로필 업데이트 */
    updateProfile: (params: { nickname: string; email?: string; phoneNumber?: string }) =>
        fetchAPI('/users/me', {
            method: 'PUT',
            body: JSON.stringify(params),
        }),

    /** 비밀번호 변경 */
    updatePassword: (params: { currentPassword: string; newPassword: string }) =>
        fetchAPI('/users/me/password', {
            method: 'PUT',
            body: JSON.stringify(params),
        }),

    /** 주문 내역 조회 */
    getOrders: () => fetchAPI('/users/me/orders', { skipRedirect: true }),

    /** 자주 주문한 메뉴 Top 5 조회 */
    getTopMenus: () => fetchAPI('/users/me/top-menus', { skipRedirect: true }),

    /** 등급 정보 조회 */
    getGradeInfo: () => fetchAPI('/users/me/grade', { skipRedirect: true }),

    /** 계정 탈퇴 요청 (soft delete) */
    deleteAccount: (password: string) =>
        fetchAPI('/users/me', {
            method: 'DELETE',
            body: JSON.stringify({ password }),
        }),

    /** 탈퇴 취소 (복구) */
    restoreAccount: (username: string, password: string) =>
        fetchAPI('/users/me/restore', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            skipRedirect: true,
        }),

    /** 포인트 잔액 조회 */
    getPointBalance: () => fetchAPI('/users/me/points', { skipRedirect: true }),

    /** 포인트 내역 조회 */
    getPointHistory: (page: number = 0, size: number = 20) => fetchAPI(`/users/me/points/history?page=${page}&size=${size}`, { skipRedirect: true }),
};

// 사용자 즐겨찾기 API 모음
export const userFavoriteAPI = {
    /** 즐겨찾기 추가 */
    addFavorite: (params: { menuId: number; alias?: string; selectedOptions?: { optionGroupId: number; optionItemId: number }[] }) =>
        fetchAPI('/users/me/favorites', {
            method: 'POST',
            body: JSON.stringify(params),
        }),

    /** 즐겨찾기 삭제 */
    removeFavorite: (favoriteId: number) =>
        fetchAPI(`/users/me/favorites/${favoriteId}`, {
            method: 'DELETE',
        }),

    /** 즐겨찾기 목록 조회 */
    getFavorites: () => fetchAPI('/users/me/favorites'),

    /** 등급 및 특정 메뉴 즐겨찾기 여부 확인 */
    checkFavorite: (menuId: number) => fetchAPI(`/users/me/favorites/check?menuId=${menuId}`),
};

