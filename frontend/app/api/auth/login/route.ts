import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8031';

export async function POST(req: NextRequest) {
    const body = await req.json();

    // 1. Spring Boot 로그인 API 호출 (서버 → 서버, JWT가 브라우저를 경유하지 않음)
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!loginRes.ok) {
        const error = await loginRes.json().catch(() => ({ message: '로그인에 실패했습니다.' }));
        return NextResponse.json(error, { status: loginRes.status });
    }

    const tokenData = await loginRes.json();
    // Spring Boot LoginResponse 필드명: token
    const token = tokenData.accessToken || tokenData.token;

    if (!token) {
        return NextResponse.json({ message: '토큰을 받지 못했습니다.' }, { status: 500 });
    }

    // 2. 사용자 정보 조회 (/auth/me)
    const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    let user = null;
    if (meRes.ok) {
        user = await meRes.json();
    }

    // 3. 세션에 저장 (httpOnly 쿠키로 암호화되어 저장 — 브라우저에서 JWT 직접 접근 불가)
    const session = await getSession();
    session.token = token;
    if (user) {
        session.user = {
            id: user.id || user.nickname,
            email: user.email || user.nickname,
            nickname: user.nickname,
            role: user.role,
        };
    } else {
        // /auth/me 실패 시 loginRes에서 받은 정보로 폴백
        session.user = {
            id: tokenData.username,
            email: tokenData.username,
            nickname: tokenData.username,
            role: tokenData.role,
        };
    }
    await session.save();

    // 4. 클라이언트에 user 정보만 반환 (JWT는 절대 반환하지 않음!)
    return NextResponse.json({ user: session.user });
}
