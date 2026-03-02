import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8031';

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
async function proxyRequest(req: NextRequest) {
    const session = await getSession();
    const path = req.nextUrl.pathname;   // 예: /api/menus
    const search = req.nextUrl.search;  // 예: ?page=0&size=10

    // /api/ 접두사를 그대로 유지하여 Spring Boot로 전달
    // Spring Boot의 엔드포인트: /menus, /categories, /auth, /admin, ...
    // Next.js API Route 경로: /api/menus, /api/categories, ...
    // path에서 /api 제거 후 Spring Boot 경로로 변환
    const backendPath = path.replace(/^\/api/, '');
    const targetUrl = `${API_BASE}${backendPath}${search}`;

    console.log(`[BFF Proxy] ${req.method} ${path} -> ${targetUrl}`);

    // 요청 헤더 구성
    const headers: Record<string, string> = {};

    const contentType = req.headers.get('content-type');
    if (contentType) {
        headers['Content-Type'] = contentType;
    }

    const accept = req.headers.get('accept');
    if (accept) {
        headers['Accept'] = accept;
    }

    // ★ 핵심: 세션에 JWT가 있으면 Authorization 헤더 자동 주입
    if (session.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
        console.log(`[BFF Proxy] Token found in session, injecting into header`);
    } else {
        console.warn(`[BFF Proxy] No token found in session for ${path}`);
    }

    // 요청 본문 전달
    let body: BodyInit | null = null;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (contentType?.includes('multipart/form-data')) {
            body = await req.blob(); // 파일 업로드
        } else {
            body = await req.text(); // JSON 등
        }
    }

    const proxyRes = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
    });

    // 401 응답 시 세션 삭제 (JWT 만료)
    if (proxyRes.status === 401 && session.token) {
        session.destroy();
    }

    // 응답 전달
    const responseHeaders = new Headers();
    const resContentType = proxyRes.headers.get('content-type');
    if (resContentType) {
        responseHeaders.set('Content-Type', resContentType);
    }

    return new NextResponse(proxyRes.body, {
        status: proxyRes.status,
        statusText: proxyRes.statusText,
        headers: responseHeaders,
    });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
