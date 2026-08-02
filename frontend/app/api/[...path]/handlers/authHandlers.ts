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

/**
 * 포트폴리오 데모 로그인 (부관리자 체험)
 *
 * 방문자가 계정을 몰라도 서비스를 둘러볼 수 있게 한다.
 * 자격증명은 서버 환경변수에서만 읽으므로 클라이언트 번들에 노출되지 않는다.
 * (클라이언트는 본문 없는 POST만 보낸다)
 */
export async function handleDemoLogin(session: IronSession<any>) {
    try {
        const username = process.env.DEMO_SUBADMIN_ID || 'subadmin';
        const password = process.env.DEMO_SUBADMIN_PW || '1234';

        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        if (!loginRes.ok) {
            console.error(`Demo login failed: status=${loginRes.status}`);
            return NextResponse.json(
                { message: '데모 계정을 준비하지 못했습니다. 잠시 후 다시 시도해주세요.' },
                { status: loginRes.status }
            );
        }

        const tokenData = await loginRes.json();
        const token = tokenData.accessToken || tokenData.token;
        if (!token) return NextResponse.json({ message: 'Token not found' }, { status: 500 });

        await saveUserSession(session, token, tokenData);
        return NextResponse.json({ user: session.user });
    } catch (e: any) {
        console.error('Demo login error:', e);
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
