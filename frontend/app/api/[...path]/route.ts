import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';
const CHAT_SERVER_BASE = process.env.CHAT_SERVER_URL || 'http://localhost:8000';

/**
 * BFF 패턴의 핵심: Catch-all API 프록시
 *
 * 클라이언트의 모든 /api/* 요청을 받아서:
 * 1. 세션 쿠키에서 JWT를 꺼냄
 * 2. Authorization 헤더에 JWT를 주입
 * 3. Spring Boot로 요청 전달
 * 4. 응답을 그대로 클라이언트에 전달
 *
 * 클라이언트 코드에서는 JWT를 전혀 신경 쓸 필요 없이
 * 그냥 fetch('/api/...')만 하면 됩니다.
 */
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 통합 BFF (Backend For Frontend) 핸들러
 * ─────────────────────────────────────────────────────────────────────────────
 * 도커/운영 환경에서의 경로 충돌을 방지하기 위해 모든 /api/* 요청을 이 파일에서 처리합니다.
 * 1. 인증 관련 특수 경로 (/api/auth/login, logout, session) 처리
 * 2. 그 외 모든 요청을 Spring Boot 백엔드로 프록시 (JWT 자동 주입)
 * ─────────────────────────────────────────────────────────────────────────────
 */
async function unifiedHandler(req: NextRequest) {
    const session = await getSession();
    const { pathname } = req.nextUrl;
    const search = req.nextUrl.search;

    // 1. [특수 경로] 로그인 프로세스
    if (pathname === '/api/auth/login' && req.method === 'POST') {
        try {
            const body = await req.json();
            const loginRes = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!loginRes.ok) {
                const error = await loginRes.json().catch(() => ({ message: 'Login failed' }));
                return NextResponse.json(error, { status: loginRes.status });
            }

            const tokenData = await loginRes.json();
            const token = tokenData.accessToken || tokenData.token;

            if (!token) return NextResponse.json({ message: 'Token not found' }, { status: 500 });

            // 사용자 정보 조회
            const meRes = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const user = meRes.ok ? await meRes.json() : null;

            // 세션 저장 - 이 부분이 실행되어야 로그인이 유지됩니다.
            session.token = token;
            session.user = user ? {
                id: user.id || user.nickname,
                email: user.email || user.nickname,
                nickname: user.nickname,
                role: user.role,
                phoneNumber: user.phoneNumber,
                grade: user.grade,
            } : {
                id: tokenData.username,
                email: tokenData.username,
                nickname: tokenData.username,
                role: tokenData.role,
            };
            await session.save();

            return NextResponse.json({ user: session.user });
        } catch (e: any) {
            return NextResponse.json({ message: e.message }, { status: 500 });
        }
    }

    // 2. [특수 경로] 로그아웃
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
        session.destroy();
        return NextResponse.json({ ok: true });
    }

    // 3. [특수 경로] 현재 세션 상태 확인
    if (pathname === '/api/auth/session' && req.method === 'GET') {
        if (!session.token) return NextResponse.json({ user: null });
        
        // 기존 세션을 최신 정보로 갱신 (마이페이지/주문 시 phoneNumber 등 최신화)
        try {
            const meRes = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${session.token}` },
            });
            if (meRes.ok) {
                const user = await meRes.json();
                session.user = {
                    id: user.id || user.nickname,
                    email: user.email || user.nickname,
                    nickname: user.nickname,
                    role: user.role,
                    phoneNumber: user.phoneNumber,
                    grade: user.grade,
                };
                await session.save();
            }
        } catch (e) {
            console.error('Session refresh error:', e);
        }

        return NextResponse.json({ user: session.user });
    }

    // 4. [프록시] 대상 서버 및 경로 결정
    let backendPath = pathname;
    let targetBase = API_BASE;

    if (pathname.startsWith('/api/vector/')) {
        // AI 에이전트 서비스로 전달 (FastAPI는 /api/vector 경로를 포함해서 받음)
        targetBase = CHAT_SERVER_BASE;
    } else if (pathname.startsWith('/api/')) {
        // Spring Boot 백엔드로 전달 (Spring Boot는 /api 접두어 없이 호출됨)
        backendPath = pathname.replace(/^\/api/, '');
    } else if (pathname.startsWith('/images/')) {
        // 이미지 요청은 백엔드의 /upload로 매핑
        backendPath = pathname.replace(/^\/images/, '/upload');
    }

    const targetUrl = `${targetBase}${backendPath}${search}`;

    const headers: Record<string, string> = {};
    const contentType = req.headers.get('content-type');
    if (contentType) headers['Content-Type'] = contentType;
    if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
    }

    const hasBody = !['GET', 'HEAD'].includes(req.method);
    let requestBody = null;

    if (hasBody) {
        try {
            const buffer = await req.arrayBuffer();
            if (buffer.byteLength > 0) {
                requestBody = buffer;
            }
        } catch (e) {
            console.error('Failed to read request body:', e);
        }
    }

    try {
        const proxyRes = await fetch(targetUrl, {
            method: req.method,
            headers,
            body: requestBody,
            // duplex 옵션은 더 이상 스트림을 직접 전달하지 않으므로 제거됩니다.
        });

        if (proxyRes.status === 401 && session.token) {
            session.destroy();
        }

        const responseHeaders = new Headers();
        const resContentType = proxyRes.headers.get('content-type');
        if (resContentType) responseHeaders.set('Content-Type', resContentType);

        return new NextResponse(proxyRes.body, {
            status: proxyRes.status,
            statusText: proxyRes.statusText,
            headers: responseHeaders,
        });
    } catch (e: any) {
        console.error('Proxy error:', e);
        return NextResponse.json(
            { message: `백엔드 서버와 통신 중 오류가 발생했습니다: ${e.message}` },
            { status: 500 }
        );
    }
}

export const GET = unifiedHandler;
export const POST = unifiedHandler;
export const PUT = unifiedHandler;
export const DELETE = unifiedHandler;
export const PATCH = unifiedHandler;
