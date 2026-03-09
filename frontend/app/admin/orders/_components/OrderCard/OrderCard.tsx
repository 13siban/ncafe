'use client';

import React from 'react';
import { Clock, User } from 'lucide-react';
import styles from '../../page.module.css';
import { OrderListItem, TABS } from '../../types';

interface OrderCardProps {
    order: OrderListItem;
    isSelected: boolean;
    onClick: (id: number) => void;
    onStatusChange: (id: number, status: string) => void;
    onRejectClick: (id: number) => void;
}

export function OrderCard({
    order,
    isSelected,
    onClick,
    onStatusChange,
    onRejectClick
}: OrderCardProps) {
    return (
        <div
            className={`${styles.orderCard} ${isSelected ? styles.selectedCard : ''}`}
            onClick={() => onClick(order.id)}
        >
            <div className={styles.cardHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.orderNumber}>{order.displayNumber}</div>
                    <div className={styles.orderTime}>
                        <Clock size={12} style={{ marginRight: 4 }} />
                        {new Date(order.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
                <div className={`${styles.statusBadge} ${order.status === 'PREPARING' ? styles.badgePreparing :
                        order.status === 'COMPLETED' ? styles.badgeCompleted :
                            order.status === 'REJECTED' ? styles.badgeRejected :
                                styles.badgePickedUp
                    }`}>
                    {TABS.find(t => t.value === order.status)?.label || order.status}
                </div>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.customerInfo}>
                    <User size={14} />
                    {order.customerName} {order.isGuest && <span style={{ fontSize: '10px', color: '#999', fontWeight: 400 }}>(비회원)</span>}
                </div>
                <div style={{ marginTop: '0.75rem', fontWeight: 600 }}>
                    {order.summary}
                </div>
            </div>

            <div className={styles.cardFooter}>
                <div className={styles.totalPrice}>
                    {new Intl.NumberFormat('ko-KR').format(order.totalPrice)}원
                </div>
                <div className={styles.actions}>
                    {order.status === 'PREPARING' && (
                        <>
                            <button
                                className={`${styles.actionButton} ${styles.dangerAction}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRejectClick(order.id);
                                }}
                            >
                                주문 거절
                            </button>
                            <button
                                className={`${styles.actionButton} ${styles.primaryAction}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(order.id, 'COMPLETED');
                                }}
                            >
                                제조 완료
                            </button>
                        </>
                    )}
                    {order.status === 'COMPLETED' && (
                        <button
                            className={`${styles.actionButton} ${styles.primaryAction}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(order.id, 'PICKED_UP');
                            }}
                        >
                            픽업 완료
                        </button>
                    )}
                    {order.status === 'PICKED_UP' && (
                        <span style={{ fontSize: '0.75rem', color: '#999' }}>처리 완료 된 주문</span>
                    )}
                </div>
            </div>
        </div>
    );
}
