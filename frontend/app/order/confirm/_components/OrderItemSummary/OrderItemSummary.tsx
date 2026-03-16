'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import styles from '../../page.module.css';

interface OrderItemSummaryProps {
    items: any[];
    orderType: string;
    validUsePoints: number;
    finalPrice: number;
}

const OrderItemSummary: React.FC<OrderItemSummaryProps> = ({ items, orderType, validUsePoints, finalPrice }) => {
    return (
        <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span><ShoppingBag size={20} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> 주문 내역</span>
                    <span style={{
                        fontSize: '0.85rem',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        backgroundColor: orderType === 'PICKUP' ? 'var(--color-primary-100)' : 'var(--color-gray-100)',
                        color: orderType === 'PICKUP' ? 'var(--color-primary-600)' : 'var(--color-gray-700)',
                        fontWeight: '600'
                    }}>
                        {orderType === 'PICKUP' ? '포장 (일회용기)' : '매장 (다회용기)'}
                    </span>
                </div>
            </h2>
            <div className={styles.itemList}>
                {items.map((item) => (
                    <div key={item.cartId} className={styles.item}>
                        <div className={styles.itemInfo}>
                            <span className={styles.itemName}>
                                {item.menuName} × {item.quantity}
                            </span>
                            {item.selectedOptions.length > 0 && (
                                <span className={styles.itemOptions}>
                                    {item.selectedOptions.map((o: any) => o.optionItemName).join(", ")}
                                </span>
                            )}
                        </div>
                        <span className={styles.itemPrice}>
                            {new Intl.NumberFormat('ko-KR').format(item.subtotal)}원
                        </span>
                    </div>
                ))}
            </div>
            {validUsePoints > 0 && (
                <div className={styles.totalRow} style={{ borderTop: "none", paddingTop: 0, marginTop: "-8px" }}>
                    <span className={styles.totalLabel} style={{ color: "var(--color-primary-600)" }}>포인트 사용</span>
                    <span className={styles.totalValue} style={{ color: "var(--color-primary-600)" }}>
                        - {new Intl.NumberFormat('ko-KR').format(validUsePoints)} P
                    </span>
                </div>
            )}
            <div className={styles.totalRow}>
                <span className={styles.totalLabel}>총 결제 금액</span>
                <span className={styles.totalValue}>
                    {new Intl.NumberFormat('ko-KR').format(finalPrice)}원
                </span>
            </div>
        </div>
    );
};

export default OrderItemSummary;
