import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/app/lib/session';

// 로그인이 필요한 보호된 경로
const PROTECTED_PATHS = ['/admin'];

// 인증 체크를 건너뛸 공개 경로
const PUBLIC_PATHS = ['/login', '/signup', '/api', '/_next', '/menus', '/about'];

// session.ts의 cookieName과 반드시 동일해야 합니다!
const SESSION_COOKIE_NAME = 'app_session';

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 공개 경로는 건너뜀
    if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // 정적 파일은 건너뜀
    if (pathname.includes('.')) {
        return NextResponse.next();
    }

    // 보호 경로인지 확인
    const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
    if (!isProtected) {
        return NextResponse.next();
    }

    // 세션 쿠키 존재 여부 확인
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
    if (!sessionCookie) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // [권한 체크 추가] 어드민 경로인 경우 ROLE_ADMIN 여부 확인
    try {
        const res = NextResponse.next();
        const session = await getIronSession<{ user?: { role: string } }>(req, res, sessionOptions);

        if (!session.user || session.user.role !== 'ROLE_ADMIN') {
            // [수정] 이전 창(Referer)으로 이동하거나, 없으면 메인으로 이동
            const referer = req.headers.get('referer');
            const targetUrl = referer ? new URL(referer) : new URL('/', req.url);

            targetUrl.searchParams.set('error', 'forbidden');
            return NextResponse.redirect(targetUrl);
        }
        return res;
    } catch (error) {
        console.error('Middleware session check failed:', error);
        return NextResponse.redirect(new URL('/login', req.url));
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
