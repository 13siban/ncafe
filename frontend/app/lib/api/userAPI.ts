import { fetchAPI } from './client';

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

    /** 특정 메뉴 즐겨찾기 여부 확인 */
    checkFavorite: (menuId: number) => fetchAPI(`/users/me/favorites/check?menuId=${menuId}`),
};
