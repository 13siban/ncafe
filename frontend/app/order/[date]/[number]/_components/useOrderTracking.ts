'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/app/lib/api';
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
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchOrder, order?.status]);

    return {
        order,
        loading,
        lastUpdated,
        isRefreshing,
        fetchOrder
    };
}
