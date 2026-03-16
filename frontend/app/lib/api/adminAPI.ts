import { fetchAPI } from './client';

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

// 갤러리 API 모음
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
    /** 기간별 대시보드 통계 조회 */
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
