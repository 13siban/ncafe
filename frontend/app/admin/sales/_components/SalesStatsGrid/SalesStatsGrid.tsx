'use client';

import React from 'react';
import { ShoppingBag, Users, DollarSign, TrendingUp } from 'lucide-react';
import styles from '../../page.module.css';
import { SalesSummary } from '../../types';

interface SalesStatsGridProps {
    summary: SalesSummary | null;
}

export function SalesStatsGrid({ summary }: SalesStatsGridProps) {
    return (
        <div className={styles.statsGrid}>
            <div className={styles.statCard}>
                <div className={styles.statInfo}>
                    <p className={styles.statLabel}>총 매출액</p>
                    <h3 className={styles.statValue}>₩{summary?.totalSales?.toLocaleString() || '0'}</h3>
                </div>
                <div className={`${styles.iconBox} ${styles.blue}`}><DollarSign size={20} /></div>
            </div>
            <div className={styles.statCard}>
                <div className={styles.statInfo}>
                    <p className={styles.statLabel}>주문 건수</p>
                    <h3 className={styles.statValue}>{summary?.totalOrders?.toLocaleString() || '0'}건</h3>
                </div>
                <div className={`${styles.iconBox} ${styles.green}`}><ShoppingBag size={20} /></div>
            </div>
            <div className={styles.statCard}>
                <div className={styles.statInfo}>
                    <p className={styles.statLabel}>객단가</p>
                    <h3 className={styles.statValue}>₩{Math.round(summary?.avgOrderAmount || 0).toLocaleString()}</h3>
                </div>
                <div className={`${styles.iconBox} ${styles.purple}`}><TrendingUp size={20} /></div>
            </div>
            <div className={styles.statCard}>
                <div className={styles.statInfo}>
                    <p className={styles.statLabel}>회원/비회원</p>
                    <h3 className={styles.statValue}>{summary?.memberOrders || 0} / {summary?.guestOrders || 0}</h3>
                </div>
                <div className={`${styles.iconBox} ${styles.orange}`}><Users size={20} /></div>
            </div>
        </div>
    );
}
