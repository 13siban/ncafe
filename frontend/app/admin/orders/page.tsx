'use client';

import React, { useState } from 'react';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import styles from './page.module.css';

import { useAdminOrders } from './_components/useAdminOrders';
import { OrderTabs } from './_components/OrderTabs/OrderTabs';
import { OrderGrid } from './_components/OrderGrid/OrderGrid';
import { OrderDetailModal } from './_components/OrderDetailModal/OrderDetailModal';
import { OrderRejectModal } from './_components/OrderRejectModal/OrderRejectModal';

export default function AdminOrdersPage() {
    const [activeTab, setActiveTab] = useState('ALL');
    const {
        orders,
        loading,
        isRefreshing,
        selectedOrderId,
        selectedOrder,
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
    } = useAdminOrders(activeTab);

    return (
        <div className={styles.container}>
            <OrderTabs
                activeTab={activeTab}
                orderCount={orders.length}
                isRefreshing={isRefreshing}
                onTabChange={setActiveTab}
                onRefresh={() => fetchOrders(true)}
            />

            {loading ? (
                <div className={styles.emptyState}>
                    <RefreshCw size={48} className="animate-spin" />
                    <p>주문 목록을 불러오고 있습니다...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                    <ShoppingBag size={48} />
                    <p>해당 상태의 주문이 없습니다.</p>
                </div>
            ) : (
                <OrderGrid
                    orders={orders}
                    selectedOrderId={selectedOrderId}
                    onOrderClick={fetchOrderDetail}
                    onStatusChange={handleStatusChange}
                    onRejectClick={openReject}
                />
            )}

            {/* Modals */}
            {selectedOrderId && selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={closeDetail}
                    onStatusChange={handleStatusChange}
                    onRejectClick={openReject}
                />
            )}

            {rejectId && (
                <OrderRejectModal
                    rejectReason={rejectReason}
                    isRejecting={isRejecting}
                    onReasonChange={setRejectReason}
                    onCancel={closeReject}
                    onConfirm={handleReject}
                />
            )}
        </div>
    );
}
