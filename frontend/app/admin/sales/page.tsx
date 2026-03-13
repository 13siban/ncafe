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

import { OrderDetailModal } from '../orders/_components/OrderDetailModal/OrderDetailModal';
import { OrderFull } from '../orders/types';
import { fetchAPI } from '@/app/lib/api';
import toast from 'react-hot-toast';

export default function SalesAnalysisPage() {
    const [period, setPeriod] = useState<SalesPeriod>('daily');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState('summary');

    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<OrderFull | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

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

    const handleOrderClick = async (id: number) => {
        setLoadingDetail(true);
        setSelectedOrderId(id);
        try {
            const data = await fetchAPI(`/admin/orders/${id}`);
            setSelectedOrder(data);
        } catch (error) {
            console.error('Failed to fetch order detail:', error);
            toast.error('주문 상세 정보를 가져오지 못했습니다.');
            setSelectedOrderId(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeDetail = () => {
        setSelectedOrderId(null);
        setSelectedOrder(null);
    };

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            await fetchAPI(`/admin/orders/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            toast.success('주문 상태가 업데이트되었습니다.');
            handleOrderClick(id); // Refresh detail
        } catch (error) {
            toast.error('상태 변경에 실패했습니다.');
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
                        <OrdersTable orders={orders} onRowClick={handleOrderClick} />
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

            {selectedOrderId && selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={closeDetail}
                    onStatusChange={handleStatusChange}
                    onRejectClick={() => toast('주문 거절은 지원되지 않습니다.')}
                />
            )}
        </div>
    );
}
