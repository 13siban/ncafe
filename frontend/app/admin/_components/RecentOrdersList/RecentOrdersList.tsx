'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from '../../page.module.css';
import { DashboardRecentOrder } from '../../types';

interface RecentOrdersListProps {
    orders: DashboardRecentOrder[];
}

export function RecentOrdersList({ orders }: RecentOrdersListProps) {
    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PREPARING': return { label: '제조 중', color: styles.statusBadgePreparing };
            case 'COMPLETED': return { label: '완료', color: styles.statusBadgeCompleted };
            case 'REJECTED': return { label: '반려', color: styles.statusBadgeRejected };
            case 'PICKED_UP': return { label: '수령 완료', color: styles.statusBadgePickedUp };
            default: return { label: status, color: '' };
        }
    };

    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>최근 주문 (5건)</h2>
                <Link href="/admin/orders" className={styles.seeMore}>전체보기 <ChevronRight size={16} /></Link>
            </div>

            <div className={styles.recentOrdersList}>
                {orders.length > 0 ? (
                    orders.map((order) => {
                        const statusInfo = getStatusLabel(order.status);
                        return (
                            <div key={order.id} className={styles.orderRow}>
                                <div className={styles.orderMain}>
                                    <div className={styles.orderNumber}>{order.displayNumber}</div>
                                    <div className={styles.orderInfo}>
                                        <div className={styles.orderCustomer}>{order.customerName} {order.isGuest ? '(비회원)' : '(회원)'}</div>
                                        <div className={styles.orderSummary}>{order.summary}</div>
                                    </div>
                                </div>
                                <div className={styles.orderRight}>
                                    <div className={styles.orderAmount}>₩{order.totalPrice.toLocaleString()}</div>
                                    <div className={`${styles.statusBadgeSmall} ${statusInfo.color}`}>{statusInfo.label}</div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className={styles.emptyState}>최근 주문이 없습니다.</div>
                )}
            </div>
        </section>
    );
}
