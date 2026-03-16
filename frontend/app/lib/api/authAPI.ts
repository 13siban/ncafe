import { fetchAPI } from './client';

// 인증 API 모음
export const authAPI = {
    /** 로그인 */
    login: (username: string, password: string) =>
        fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),

    /** 구글 로그인 */
    googleLogin: (idToken: string) =>
        fetchAPI('/auth/google', {
            method: 'POST',
            body: JSON.stringify({ idToken }),
        }),

    /** 로그아웃 */
    logout: () => fetchAPI('/auth/logout', { method: 'POST' }),

    /** 현재 세션에서 사용자 정보 조회 */
    getSession: () => fetchAPI('/auth/session'),

    /** 회원가입 */
    signup: (username: string, password: string, nickname?: string, email?: string, phoneNumber?: string) =>
        fetchAPI('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password, nickname, email, phoneNumber }),
        }),
};
