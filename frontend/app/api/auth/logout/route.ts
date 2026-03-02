import { NextResponse } from 'next/server';
import { getSession } from '@/app/lib/session';

export async function POST() {
    const session = await getSession();
    session.destroy(); // 세션 쿠키 삭제 (JWT도 함께 삭제됨)
    return NextResponse.json({ ok: true });
}
