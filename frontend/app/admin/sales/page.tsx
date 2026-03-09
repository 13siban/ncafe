'use client';

import React, { useState } from 'react';
import { BarChart3, List as ListIcon, PieChart as PieChartIcon } from 'lucide-react';
import { subDays, addDays } from 'date-fns';
import styles from './page.module.css';

import { SalesPeriod } from './types';
import { useSalesData } from './_components/useSalesData';
import { SalesPeriodControl } from './_components/SalesPeriodControl/SalesPeriodControl';
import { SalesStatsGrid } from './_components/SalesStatsGrid/SalesStatsGrid';
import { SalesLineChart } from './_components/SalesLineChart/SalesLineChart';
import { OrdersTable } from './_components/OrdersTable/OrdersTable';
import { MenuRankingTable } from './_components/MenuRankingTable/MenuRankingTable';
import { CategoryPieChart } from './_components/CategoryPieChart/CategoryPieChart';

export default function SalesAnalysisPage() {
    const [period, setPeriod] = useState<SalesPeriod>('daily');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('summary');

    const {
        summary,
        chartData,
        orders,
        menuRanking,
        categoryData
    } = useSalesData(period, currentDate);

    const handlePrev = () => {
        if (period === 'daily') setCurrentDate(subDays(currentDate, 1));
        else if (period === 'weekly') setCurrentDate(subDays(currentDate, 7));
        else if (period === 'monthly') {
            const d = new Date(currentDate);
            d.setMonth(d.getMonth() - 1);
            setCurrentDate(d);
        }
    };

    const handleNext = () => {
        if (period === 'daily') setCurrentDate(addDays(currentDate, 1));
        else if (period === 'weekly') setCurrentDate(addDays(currentDate, 7));
        else if (period === 'monthly') {
            const d = new Date(currentDate);
            d.setMonth(d.getMonth() + 1);
            setCurrentDate(d);
        }
    };

    return (
        <div className={styles.container}>
            <SalesPeriodControl
                period={period}
                currentDate={currentDate}
                onPeriodChange={(p) => { setPeriod(p); setCurrentDate(new Date()); }}
                onPrev={handlePrev}
                onNext={handleNext}
            />

            <div className={styles.mainTabs}>
                <button
                    className={`${styles.mainTab} ${activeTab === 'summary' ? styles.activeMainTab : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    <BarChart3 size={18} /> 매출 요약
                </button>
                <button
                    className={`${styles.mainTab} ${activeTab === 'orders' ? styles.activeMainTab : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <ListIcon size={18} /> 주문 내역
                </button>
                <button
                    className={`${styles.mainTab} ${activeTab === 'menus' ? styles.activeMainTab : ''}`}
                    onClick={() => setActiveTab('menus')}
                >
                    <PieChartIcon size={18} /> 상품 분석
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'summary' && (
                    <div className={styles.tabContent}>
                        <SalesStatsGrid summary={summary} />
                        <SalesLineChart data={chartData} />
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className={styles.tabContent}>
                        <OrdersTable orders={orders} />
                    </div>
                )}

                {activeTab === 'menus' && (
                    <div className={styles.tabContent}>
                        <div className={styles.menuAnalysisGrid}>
                            <MenuRankingTable ranking={menuRanking} />
                            <CategoryPieChart data={categoryData} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
