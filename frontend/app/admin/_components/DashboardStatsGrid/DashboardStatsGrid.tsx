'use client';

import React from 'react';
import { UtensilsCrossed, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import styles from '../../page.module.css';
import { DashboardStats } from '../../types';
import { StatCard } from './StatCard';

interface DashboardStatsGridProps {
    stats: DashboardStats | null;
    period: string;
}

export function DashboardStatsGrid({ stats, period }: DashboardStatsGridProps) {
    const periodLabel = period === 'daily' ? '오늘' : period === 'weekly' ? '이번 주' : '이번 달';
    const compareLabel = period === 'daily' ? '어제' : period === 'weekly' ? '저번 주' : '저번 달';

    return (
        <div className={styles.statsGrid}>
            <StatCard
                title="총 메뉴"
                value={stats?.totalMenus.toString() || '0'}
                change=""
                icon={<UtensilsCrossed size={20} />}
                iconClass="statIconPrimary"
            />
            <StatCard
                title={`${periodLabel} 주문`}
                value={stats?.orderCount.toString() || '0'}
                change={stats?.orderCountChange || ''}
                changeLabel={`${compareLabel} 대비`}
                icon={<ShoppingBag size={20} />}
                iconClass="statIconSuccess"
            />
            <StatCard
                title={`${periodLabel} 매출`}
                value={`₩${stats?.totalSales.toLocaleString() || '0'}`}
                change={stats?.totalSalesChange || ''}
                changeLabel="대비"
                icon={<TrendingUp size={20} />}
                iconClass="statIconInfo"
            />
            <StatCard
                title="방문 고객"
                value={stats?.customerCount.toString() || '0'}
                change={stats?.customerCountChange || ''}
                changeLabel="대비"
                icon={<Users size={20} />}
                iconClass="statIconWarning"
            />
        </div>
    );
}
