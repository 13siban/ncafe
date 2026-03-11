'use client';

import { useState, useEffect } from 'react';
import { adminStoreAPI, adminDashboardAPI, adminSalesAPI } from '@/app/lib/api';
import { StoreStatus, DashboardStats, DashboardRecentOrder, DashboardPopularMenu } from '../types';

export function useDashboard(period: string) {
    const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);
    const [openTime, setOpenTime] = useState('');
    const [closeTime, setCloseTime] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<DashboardRecentOrder[]>([]);
    const [popularMenus, setPopularMenus] = useState<DashboardPopularMenu[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStoreStatus = async () => {
        try {
            const data = await adminStoreAPI.getStoreStatus();
            setStoreStatus(data);
            setOpenTime(data.openTime || '09:00');
            setCloseTime(data.closeTime || '22:00');
        } catch (error) {
            console.error('Failed to fetch store status:', error);
        }
    };

    const fetchStats = async (p: string) => {
        try {
            const data = await adminDashboardAPI.getStats(p);
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchRecentOrders = async () => {
        try {
            const data = await adminDashboardAPI.getRecentOrders();
            setRecentOrders(data || []);
        } catch (error) {
            console.error('Failed to fetch recent orders:', error);
        }
    };

    const fetchPopularMenus = async (p: string) => {
        try {
            const data = await adminSalesAPI.getMenuRanking(p);
            setPopularMenus(data?.slice(0, 5) || []);
        } catch (error) {
            console.error('Failed to fetch popular menus:', error);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            fetchStoreStatus(),
            fetchStats(period),
            fetchRecentOrders(),
            fetchPopularMenus(period)
        ]).finally(() => setIsLoading(false));
    }, [period]);

    const handleToggleStatus = async () => {
        if (!storeStatus) return;
        const action = storeStatus.isOpen ? '영업을 종료하시겠습니까? 주문번호가 초기화됩니다.' : '영업을 개시하시겠습니까?';
        if (!confirm(action)) return;

        try {
            if (storeStatus.isOpen) {
                await adminStoreAPI.closeStore();
            } else {
                await adminStoreAPI.openStore();
            }
            fetchStoreStatus();
            fetchStats(period);
        } catch (error) {
            alert('상태 변경에 실패했습니다.');
        }
    };

    const handleUpdateSettings = async () => {
        setIsUpdating(true);
        try {
            await adminStoreAPI.updateSettings({ openTime, closeTime });
            alert('영업 시간이 수정되었습니다.');
            fetchStoreStatus();
        } catch (error) {
            alert('수정에 실패했습니다.');
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        storeStatus,
        openTime,
        closeTime,
        isUpdating,
        stats,
        recentOrders,
        popularMenus,
        isLoading,
        setOpenTime,
        setCloseTime,
        handleToggleStatus,
        handleUpdateSettings
    };
}
