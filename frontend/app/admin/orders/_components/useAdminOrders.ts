'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '@/app/lib/api/client';
import toast from 'react-hot-toast';
import { OrderListItem, OrderFull } from '../types';

export function useAdminOrders(activeTab: string) {
    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Selection
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<OrderFull | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Reject state
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const fetchOrders = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        else setIsRefreshing(true);

        try {
            const statusParam = activeTab === 'ALL' ? '' : `?status=${activeTab}`;
            const data = await fetchAPI(`/admin/orders${statusParam}`);
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('주문 목록을 가져오지 못했습니다.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [activeTab]);

    const fetchOrderDetail = async (id: number) => {
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

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(() => fetchOrders(true), 30000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            await fetchAPI(`/admin/orders/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            toast.success('주문 상태가 업데이트되었습니다.');
            fetchOrders(true);
            if (selectedOrderId === id) fetchOrderDetail(id);
        } catch (error) {
            toast.error('상태 변경에 실패했습니다.');
        }
    };

    const handleReject = async () => {
        if (!rejectId || !rejectReason.trim()) return;
        setIsRejecting(true);
        try {
            await fetchAPI(`/admin/orders/${rejectId}/reject`, {
                method: 'PUT',
                body: JSON.stringify({ reason: rejectReason }),
            });
            toast.success('주문이 거절되었습니다.');
            setRejectId(null);
            setRejectReason('');
            fetchOrders(true);
            if (selectedOrderId === rejectId) fetchOrderDetail(rejectId);
        } catch (error) {
            toast.error('거절 처리에 실패했습니다.');
        } finally {
            setIsRejecting(false);
        }
    };

    const closeDetail = () => {
        setSelectedOrderId(null);
        setSelectedOrder(null);
    };

    const openReject = (id: number) => {
        setRejectId(id);
    };

    const closeReject = () => {
        setRejectId(null);
        setRejectReason('');
    };

    return {
        orders,
        loading,
        isRefreshing,
        selectedOrderId,
        selectedOrder,
        loadingDetail,
        rejectId,
        rejectReason,
        isRejecting,
        setRejectReason,
        fetchOrders,
        fetchOrderDetail,
        handleStatusChange,
        handleReject,
        closeDetail,
        openReject,
        closeReject
    };
}
