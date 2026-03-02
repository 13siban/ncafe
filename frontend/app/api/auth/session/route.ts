import { NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

/**
 * 현재 로그인 상태를 확인합니다.
 * 클라이언트 컴포넌트에서 useEffect로 로그인 상태 확인 시 사용합니다.
 * 반환값은 { user: SessionUser } 또는 { user: null }
 */
export async function GET() {
    const session = await getSession();

    if (!session.token) {
        return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: session.user });
}
