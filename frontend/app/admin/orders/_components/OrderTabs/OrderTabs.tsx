'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import styles from '../../page.module.css';
import { TABS } from '../../types';

interface OrderTabsProps {
    activeTab: string;
    orderCount: number;
    isRefreshing: boolean;
    onTabChange: (tab: string) => void;
    onRefresh: () => void;
}

export function OrderTabs({
    activeTab,
    orderCount,
    isRefreshing,
    onTabChange,
    onRefresh
}: OrderTabsProps) {
    return (
        <header className={styles.header}>
            <div className={styles.tabs}>
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        className={`${styles.tab} ${activeTab === tab.value ? styles.activeTab : ''}`}
                        onClick={() => onTabChange(tab.value)}
                    >
                        {tab.label}
                        {activeTab === tab.value && (
                            <span className={styles.tabBadge}>{orderCount}</span>
                        )}
                    </button>
                ))}
            </div>

            <button
                className={styles.secondaryAction}
                onClick={onRefresh}
                disabled={isRefreshing}
            >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? '새로고침 중' : '목록 새로고침'}
            </button>
        </header>
    );
}
