'use client';

import React from 'react';
import styles from '../../page.module.css';

interface CartActionBarProps {
    totalPrice: number;
    isOrderable: boolean;
    isSoldOut: boolean;
    isStoreOpen: boolean;
    isLoading: boolean;
    onAdd: () => void;
}

export function CartActionBar({
    totalPrice,
    isOrderable,
    isSoldOut,
    isStoreOpen,
    isLoading,
    onAdd
}: CartActionBarProps) {
    return (
        <div className={styles.bottomBar}>
            <div className={styles.bottomBarContainer}>
                <div className={styles.totalPriceInfo}>
                    <span className={styles.totalPriceLabel}>주문 금액</span>
                    <span className={styles.totalPriceValue}>
                        {new Intl.NumberFormat('ko-KR').format(totalPrice)}원
                    </span>
                </div>

                <div className={styles.actionArea}>
                    {!isStoreOpen && !isLoading && (
                        <div className={styles.storeClosedMessage}>
                            현재 매장 영업 종료로 주문이 불가합니다.
                        </div>
                    )}

                    <button
                        className={styles.orderButton}
                        disabled={!isOrderable || isSoldOut || !isStoreOpen}
                        onClick={onAdd}
                    >
                        {!isStoreOpen ? '영업 종료' : (isSoldOut ? '품절' : (!isOrderable ? '옵션을 선택해주세요' : '장바구니 담기'))}
                    </button>
                </div>
            </div>
        </div>
    );
}
