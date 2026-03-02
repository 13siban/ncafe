import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

// ──────────────────────────────────────
// 세션에 저장할 사용자 정보 타입
// Spring Boot /auth/me 응답에 맞게 정의되어 있습니다.
// ──────────────────────────────────────
export interface SessionUser {
    id: string;
    email: string;
    nickname: string;
    role: string;
}

export interface SessionData {
    token: string;      // Spring Boot에서 발급받은 JWT (서버에서만 접근 가능)
    user: SessionUser;  // 사용자 정보 (클라이언트에 반환되는 정보)
}

export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_SECRET || 'default-secret-change-in-production-minimum-32chars',
    cookieName: 'app_session',
    cookieOptions: {
        httpOnly: true,                                   // JavaScript 접근 차단 (XSS 방어 핵심)
        secure: process.env.NODE_ENV === 'production',    // 운영에서만 HTTPS 필수
        sameSite: 'lax' as const,                         // CSRF 기본 방어
        path: '/',
        maxAge: 60 * 60 * 24,                             // 24시간 (JWT 만료시간과 동기화)
    },
};

/**
 * 현재 요청의 세션을 가져옵니다.
 * Server Component, API Route, Middleware에서 사용 가능합니다.
 */
export async function getSession() {
    const cookieStore = await cookies();
    return getIronSession<SessionData>(cookieStore, sessionOptions);
}
