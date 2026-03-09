'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import styles from '../../page.module.css';

export function CartEmpty() {
    const router = useRouter();
    return (
        <div className={styles.emptyState}>
            <ShoppingBag size={64} color="var(--color-gray-300)" />
            <p>장바구니가 비어있습니다.</p>
            <button className={styles.primaryButton} onClick={() => router.push('/menus')}>
                메뉴 보러가기
            </button>
        </div>
    );
}
