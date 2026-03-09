'use client';

import React from 'react';
import styles from '../../page.module.css';
import { OrderListItem } from '../../types';
import { OrderCard } from '../OrderCard/OrderCard';

interface OrderGridProps {
    orders: OrderListItem[];
    selectedOrderId: number | null;
    onOrderClick: (id: number) => void;
    onStatusChange: (id: number, status: string) => void;
    onRejectClick: (id: number) => void;
}

export function OrderGrid({
    orders,
    selectedOrderId,
    onOrderClick,
    onStatusChange,
    onRejectClick
}: OrderGridProps) {
    return (
        <div className={styles.orderGrid}>
            {orders.map((order) => (
                <OrderCard
                    key={order.id}
                    order={order}
                    isSelected={selectedOrderId === order.id}
                    onClick={onOrderClick}
                    onStatusChange={onStatusChange}
                    onRejectClick={onRejectClick}
                />
            ))}
        </div>
    );
}
