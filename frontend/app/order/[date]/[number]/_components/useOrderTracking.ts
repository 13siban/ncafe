'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/app/lib/api/client';
import { OrderDetail } from '../types';

export function useOrderTracking(date: string, number: string) {
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchOrder = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        else setIsRefreshing(true);

        try {
            const data = await fetchAPI(`/orders/${date}/${number}`);
            setOrder(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch order:", error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [date, number]);

    useEffect(() => {
        fetchOrder();

        const interval = setInterval(() => {
            if (order && (order.status === 'PREPARING' || order.status === 'COMPLETED')) {
                fetchOrder(true);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [fetchOrder, order?.status]);

    const markAsPickedUp = async () => {
        try {
            setLoading(true);
            await fetchAPI(`/orders/${date}/${number}/pickup`, { method: 'PUT' });
            await fetchOrder();
            window.dispatchEvent(new Event('globalTrackerRefresh'));
        } catch (error) {
            console.error("Failed to mark order as picked up:", error);
            alert("픽업 완료 처리 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return {
        order,
        loading,
        lastUpdated,
        isRefreshing,
        fetchOrder,
        markAsPickedUp
    };
}
