import { NextRequest, NextResponse } from 'next/server';

// 로그인이 필요한 보호된 경로
const PROTECTED_PATHS = ['/admin'];

// 인증 체크를 건너뛸 공개 경로
const PUBLIC_PATHS = ['/login', '/signup', '/api', '/_next', '/menus', '/about'];

// session.ts의 cookieName과 반드시 동일해야 합니다!
const SESSION_COOKIE_NAME = 'app_session';

export function middleware(req: NextRequest) {
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
    // (쿠키가 있다는 것 = 로그인한 것. 쿠키 내용(JWT)은 서버에서만 복호화 가능)
    const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
    if (!sessionCookie) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
