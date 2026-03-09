'use client';

import React from 'react';
import { ClipboardList } from 'lucide-react';
import styles from '../../page.module.css';
import { OrderDetail } from '../../types';

interface OrderDetailsSummaryProps {
    order: OrderDetail;
}

export function OrderDetailsSummary({ order }: OrderDetailsSummaryProps) {
    return (
        <div className={styles.section}>
            <div className={styles.orderBrief}>
                <div className={styles.orderNumber}>주문번호 <span className={styles.displayNumber}>{order.displayNumber}</span></div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>{order.customerName} 고객님</div>
            </div>

            <h3 className={styles.sectionTitle}>
                <ClipboardList size={18} /> 주문 내역
            </h3>

            <div className={styles.itemList}>
                {order.items.map((item, idx) => (
                    <div key={idx} className={styles.itemWrapper}>
                        <div className={styles.item}>
                            <div className={styles.itemName}>{item.menuName} × {item.quantity}</div>
                            <div className={styles.itemPrice}>{new Intl.NumberFormat('ko-KR').format(item.subtotal)}원</div>
                        </div>
                        {item.options.length > 0 && (
                            <div className={styles.itemOptions}>
                                {item.options.map(o => o.itemName).join(", ")}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className={styles.totalRow}>
                <span className={styles.totalLabel}>총 결제 금액</span>
                <span className={styles.totalValue}>{new Intl.NumberFormat('ko-KR').format(order.totalPrice)}원</span>
            </div>

            {order.memo && (
                <div className={styles.memoBox}>
                    <span className={styles.memoLabel}>요청사항:</span>
                    <span>{order.memo}</span>
                </div>
            )}
        </div>
    );
}
