import { NextRequest } from 'next/server';
import { getSession } from '@/app/lib/session';
import { handleLogin, handleGoogleLogin, handleDemoLogin, handleLogout, handleSession } from './handlers/authHandlers';
import { handleProxy } from './handlers/proxyHandler';

/**
 * 통합 BFF (Backend For Frontend) 라우터
 * 
 * 1. 인증 관련 특수 경로 → authHandlers
 * 2. 그 외 모든 요청 → proxyHandler (JWT 자동 주입)
 */
async function unifiedHandler(req: NextRequest) {
    const session = await getSession();
    const { pathname } = req.nextUrl;

    // 인증 관련 특수 경로
    if (pathname === '/api/auth/login' && req.method === 'POST') {
        return handleLogin(req, session);
    }
    if (pathname === '/api/auth/google' && req.method === 'POST') {
        return handleGoogleLogin(req, session);
    }
    if (pathname === '/api/auth/demo' && req.method === 'POST') {
        return handleDemoLogin(session);
    }
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
        return handleLogout(session);
    }
    if (pathname === '/api/auth/session' && req.method === 'GET') {
        return handleSession(session);
    }

    // 일반 API 프록시
    return handleProxy(req, session);
}

export const GET = unifiedHandler;
export const POST = unifiedHandler;
export const PUT = unifiedHandler;
export const DELETE = unifiedHandler;
export const PATCH = unifiedHandler;
