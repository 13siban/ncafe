'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const error = searchParams.get('error');
        if (error === 'forbidden') {
            alert("접근 권한이 없습니다.");

            // 현재 URL에서 error 파라미터만 제거
            const params = new URLSearchParams(searchParams.toString());
            params.delete('error');
            const newQuery = params.toString();
            const newUrl = `${pathname}${newQuery ? `?${newQuery}` : ''}`;

            router.replace(newUrl);
        }
    }, [searchParams, router, pathname]);

    return null;
}

export function AuthErrorHandler() {
    return (
        <Suspense fallback={null}>
            <AuthErrorContent />
        </Suspense>
    );
}
