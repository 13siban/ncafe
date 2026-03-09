'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import styles from '../../page.module.css';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    changeLabel?: string;
    icon: React.ReactNode;
    iconClass: string;
}

export function StatCard({ title, value, change, changeLabel, icon, iconClass }: StatCardProps) {
    const isPositive = change.startsWith('+');
    const isNegative = change.startsWith('-');

    return (
        <div className={styles.statCard}>
            <div className={styles.statHeader}>
                <span className={styles.statTitle}>{title}</span>
                <div className={`${styles.statIcon} ${styles[iconClass]}`}>
                    {icon}
                </div>
            </div>
            <div className={styles.statValue}>{value}</div>
            {change && (
                <div className={`${styles.statChange} ${isNegative ? styles.statChangeNegative : ''}`}>
                    {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : null}
                    <span>{change}</span>
                    <span style={{ color: 'var(--color-gray-400)' }}>{changeLabel}</span>
                </div>
            )}
        </div>
    );
}
