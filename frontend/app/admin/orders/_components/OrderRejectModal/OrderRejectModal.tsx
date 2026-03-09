'use client';

import React from 'react';
import styles from '../../page.module.css';

interface OrderRejectModalProps {
    rejectReason: string;
    isRejecting: boolean;
    onReasonChange: (reason: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
}

export function OrderRejectModal({
    rejectReason,
    isRejecting,
    onReasonChange,
    onCancel,
    onConfirm
}: OrderRejectModalProps) {
    return (
        <div className={styles.modalOverlay} onClick={onCancel}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h3 className={styles.modalTitle}>주문 거절 사유</h3>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                    고객님께 전송될 주문 거절 사유를 입력해 주세요.
                </p>
                <textarea
                    className={styles.textarea}
                    placeholder="예) 재료 소진으로 인해 주문이 취소되었습니다."
                    value={rejectReason}
                    onChange={e => onReasonChange(e.target.value)}
                />
                <div className={styles.modalActions}>
                    <button
                        className={styles.secondaryAction}
                        onClick={onCancel}
                    >
                        취소
                    </button>
                    <button
                        className={`${styles.primaryAction} ${styles.actionButton}`}
                        onClick={onConfirm}
                        disabled={!rejectReason.trim() || isRejecting}
                    >
                        주문 거절 확정
                    </button>
                </div>
            </div>
        </div>
    );
}
