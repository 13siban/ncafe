'use client';

import React, { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { userAPI, authAPI } from '@/app/lib/api';
import styles from '../../page.module.css';
import { OrderDetail } from '../../types';

interface OrderDetailsSummaryProps {
    order: OrderDetail;
}

export function OrderDetailsSummary({ order }: OrderDetailsSummaryProps) {
    const [pointBalance, setPointBalance] = useState<number | null>(null);

    useEffect(() => {
        const fetchPoints = async () => {
            if (order.status !== 'COMPLETED' && order.status !== 'PICKED_UP') return;
            try {
                const session = await authAPI.getSession();
                if (session && session.user) {
                    const data = await userAPI.getPointBalance();
                    if (data && data.pointBalance !== undefined) {
                        setPointBalance(data.pointBalance);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch point balance", e);
            }
        };
        fetchPoints();
    }, [order.status]);

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

            {order.usedPoints && order.usedPoints > 0 ? (
                <>
                    <div className={styles.totalRow} style={{ borderTop: "1px dashed var(--color-gray-200)", paddingBottom: "0", marginTop: "1rem" }}>
                        <span className={styles.totalLabel} style={{ fontWeight: 400 }}>주문 총액</span>
                        <span className={styles.totalValue} style={{ fontWeight: 400 }}>{new Intl.NumberFormat('ko-KR').format(order.totalPrice + (order.usedPoints ?? 0))}원</span>
                    </div>
                    <div className={styles.totalRow} style={{ borderTop: "none", paddingTop: "8px", paddingBottom: "8px" }}>
                        <span className={styles.totalLabel} style={{ fontWeight: 400, color: "var(--color-primary-600)" }}>포인트 사용</span>
                        <span className={styles.totalValue} style={{ fontWeight: 400, color: "var(--color-primary-600)" }}>- {new Intl.NumberFormat('ko-KR').format(order.usedPoints ?? 0)} P</span>
                    </div>
                    <div className={styles.totalRow} style={{ borderTop: "none", paddingTop: "8px" }}>
                        <span className={styles.totalLabel}>최종 결제 금액</span>
                        <span className={styles.totalValue}>{new Intl.NumberFormat('ko-KR').format(order.totalPrice)}원</span>
                    </div>
                </>
            ) : (
                <div className={styles.totalRow}>
                    <span className={styles.totalLabel}>총 결제 금액</span>
                    <span className={styles.totalValue}>{new Intl.NumberFormat('ko-KR').format(order.totalPrice)}원</span>
                </div>
            )}

            {(order.status === 'COMPLETED' || order.status === 'PICKED_UP') && order.earnPoints !== undefined && order.earnPoints > 0 && (
                <div style={{ marginTop: '16px', background: 'var(--color-gray-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-gray-200)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-gray-700)', fontWeight: 600 }}>이번 주문 적립 포인트</span>
                        <span style={{ color: 'var(--color-primary-600)', fontWeight: 700, fontSize: '1.05rem' }}>+ {new Intl.NumberFormat('ko-KR').format(order.earnPoints ?? 0)} P</span>
                    </div>
                    {pointBalance !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--color-gray-200)' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>사용 가능 포인트 (잔액)</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-gray-800)', fontWeight: 600 }}>{new Intl.NumberFormat('ko-KR').format(pointBalance ?? 0)} P</span>
                        </div>
                    )}
                </div>
            )}

            {order.memo && (
                <div className={styles.memoBox}>
                    <span className={styles.memoLabel}>요청사항:</span>
                    <span>{order.memo}</span>
                </div>
            )}
        </div>
    );
}
