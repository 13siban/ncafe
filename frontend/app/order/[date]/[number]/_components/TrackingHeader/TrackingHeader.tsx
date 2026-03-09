'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home } from 'lucide-react';
import styles from '../../page.module.css';

interface TrackingHeaderProps {
    lastUpdated: Date;
    isRefreshing: boolean;
}

export function TrackingHeader({ lastUpdated, isRefreshing }: TrackingHeaderProps) {
    const router = useRouter();

    return (
        <header className={styles.header}>
            <button className={styles.backButton} onClick={() => router.push('/menus')}>
                <Home size={22} />
            </button>
            <h1 className={styles.title}>주문 추적</h1>
            <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#999' }}>
                {isRefreshing ? '업데이트 중...' : `${lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
            </div>
        </header>
    );
}
