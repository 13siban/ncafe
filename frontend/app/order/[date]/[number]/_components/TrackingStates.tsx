'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Coffee, AlertCircle, Home } from 'lucide-react';
import styles from '../page.module.css';

export function LoadingState() {
    const router = useRouter();
    return (
        <div className={styles.wrapper}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className={styles.title}>주문 확인 중...</h1>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                <Coffee size={48} className="animate-spin" color="var(--primary)" />
                <p style={{ color: '#666' }}>주문 내역을 불러오고 있습니다.</p>
            </div>
        </div>
    );
}

export function NotFoundState() {
    const router = useRouter();
    return (
        <div className={styles.wrapper}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className={styles.title}>주문을 찾을 수 없음</h1>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', padding: '2rem', textAlign: 'center' }}>
                <AlertCircle size={48} color="var(--color-error)" style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>주문 정보를 찾을 수 없습니다.</h2>
                <p style={{ color: '#666', marginTop: '0.5rem', marginBottom: '2rem' }}>주문 번호를 다시 확인해 주시거나 매장에 문의해 주세요.</p>
                <button className={styles.primaryButton} style={{ width: '100%' }} onClick={() => router.push('/menus')}>
                    <Home size={18} /> 홈으로 돌아가기
                </button>
            </div>
        </div>
    );
}
