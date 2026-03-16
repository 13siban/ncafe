import { NextRequest, NextResponse } from 'next/server';
import { IronSession } from 'iron-session';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';

/** 로그인 후 세션에 사용자 정보를 저장하는 공통 헬퍼 */
async function saveUserSession(session: IronSession<any>, token: string, tokenData: any) {
    const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const user = meRes.ok ? await meRes.json() : null;

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
}

/** 일반 로그인 */
export async function handleLogin(req: NextRequest, session: IronSession<any>) {
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

        await saveUserSession(session, token, tokenData);
        return NextResponse.json({ user: session.user });
    } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 500 });
    }
}

/** 구글 소셜 로그인 */
export async function handleGoogleLogin(req: NextRequest, session: IronSession<any>) {
    try {
        const body = await req.json();
        const loginRes = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!loginRes.ok) {
            const error = await loginRes.json().catch(() => ({ message: 'Google Login failed' }));
            return NextResponse.json(error, { status: loginRes.status });
        }

        const tokenData = await loginRes.json();
        const token = tokenData.accessToken || tokenData.token;
        if (!token) return NextResponse.json({ message: 'Token not found' }, { status: 500 });

        await saveUserSession(session, token, tokenData);
        return NextResponse.json({ user: session.user, accountRestored: tokenData.accountRestored || false });
    } catch (e: any) {
        return NextResponse.json({ message: e.message }, { status: 500 });
    }
}

/** 로그아웃 */
export async function handleLogout(session: IronSession<any>) {
    session.destroy();
    return NextResponse.json({ ok: true });
}

/** 세션 확인 */
export async function handleSession(session: IronSession<any>) {
    if (!session.token) return NextResponse.json({ user: null });

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
