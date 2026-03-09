'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Smartphone } from 'lucide-react';
import styles from '../../page.module.css';

export function TrackingFooter() {
    const router = useRouter();

    return (
        <div className={styles.footerActions}>
            <button className={styles.secondaryButton} onClick={() => router.push('/menus')}>
                <ShoppingBag size={18} /> 추가 메뉴 보기
            </button>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', opacity: 0.5 }}>
                <Smartphone size={14} />
                <span style={{ fontSize: '0.75rem' }}>주문 상태가 변경되면 자동으로 화면이 갱신됩니다.</span>
            </div>
        </div>
    );
}
