'use client';

import React from 'react';
import styles from '../../page.module.css';

interface CartSummaryProps {
    totalPrice: number;
    isOrdering: boolean;
    onOrder: () => void;
}

export function CartSummary({ totalPrice, isOrdering, onOrder }: CartSummaryProps) {
    return (
        <div className={styles.summarySection}>
            <div className={styles.summaryRow}>
                <span>총 주문 금액</span>
                <span className={styles.totalPrice}>
                    {new Intl.NumberFormat('ko-KR').format(totalPrice)}원
                </span>
            </div>
            <button
                className={styles.orderButton}
                onClick={onOrder}
                disabled={isOrdering}
            >
                {isOrdering ? '주문 처리 중...' : `${new Intl.NumberFormat('ko-KR').format(totalPrice)}원 주문하기`}
            </button>
        </div>
    );
}
