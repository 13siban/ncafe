'use client';

import React from 'react';
import { format } from 'date-fns';
import styles from '../../page.module.css';
import { SalesOrderItem } from '../../types';

interface OrdersTableProps {
    orders: SalesOrderItem[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
    return (
        <div className={styles.tableCard}>
            <h3 className={styles.sectionTitle}>완료된 주문 내역</h3>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>주문번호</th>
                            <th>고객명</th>
                            <th>상품 요약</th>
                            <th>결제 금액</th>
                            <th>주문 일시</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length > 0 ? orders.map(order => (
                            <tr key={order.id}>
                                <td>{order.displayNumber}</td>
                                <td>{order.customerName} {order.isGuest ? '(비회원)' : ''}</td>
                                <td className={styles.summaryCell}>{order.summary}</td>
                                <td className={styles.priceCell}>₩{order.totalPrice.toLocaleString()}</td>
                                <td className={styles.dateCell}>{format(new Date(order.createdAt), 'HH:mm')}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className={styles.empty}>주문 내역이 없습니다.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
