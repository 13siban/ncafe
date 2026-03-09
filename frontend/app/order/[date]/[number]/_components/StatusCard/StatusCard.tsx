'use client';

import React from 'react';
import { Coffee, CheckCircle2, ShoppingBag, AlertCircle, Check, ClipboardList } from 'lucide-react';
import styles from '../../page.module.css';
import { OrderDetail, OrderStatus, StatusInfo } from '../../types';

const STATUS_INFO: Record<OrderStatus, StatusInfo> = {
    PREPARING: {
        title: "음료를 맛있게 제조 중입니다!",
        icon: <Coffee size={48} className="animate-bounce" />,
        color: "var(--primary)",
        description: "잠시만 기다려 주세요. 금방 준비해 드릴게요."
    },
    COMPLETED: {
        title: "음료 제조가 완료되었습니다!",
        icon: <CheckCircle2 size={48} />,
        color: "var(--color-success)",
        description: "카운터에서 음료를 픽업해 주세요."
    },
    PICKED_UP: {
        title: "맛있게 드세요!",
        icon: <ShoppingBag size={48} />,
        color: "var(--color-info)",
        description: "이용해 주셔서 감사합니다. 다음에도 방문해 주세요."
    },
    REJECTED: {
        title: "주문이 취소되었습니다",
        icon: <AlertCircle size={48} />,
        color: "var(--color-error)",
        description: "매장 사정으로 인해 주문이 취소되었습니다. 대단히 죄송합니다."
    }
};

interface StatusCardProps {
    order: OrderDetail;
}

export function StatusCard({ order }: StatusCardProps) {
    const currentStatus = STATUS_INFO[order.status];
    const statusSteps: OrderStatus[] = ['PREPARING', 'COMPLETED', 'PICKED_UP'];
    const currentStepIndex = statusSteps.indexOf(order.status);
    const isRejected = order.status === 'REJECTED';

    return (
        <div className={`${styles.statusCard} ${isRejected ? styles.rejectedCard : ''}`}>
            <div className={`${styles.statusIcon} ${isRejected ? styles.rejectedIcon : ''}`}>
                {currentStatus.icon}
            </div>
            <h2 className={styles.statusTitle} style={{ color: currentStatus.color }}>
                {currentStatus.title}
            </h2>
            <p className={styles.statusDescription}>{currentStatus.description}</p>
            <div className={styles.statusTime}>주문 완료: {new Date(order.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>

            {!isRejected && (
                <div className={styles.trackingBar}>
                    <div className={`${styles.step} ${currentStepIndex >= 0 ? (currentStepIndex === 0 ? styles.activeStep : styles.completedStep) : ''}`}>
                        <div className={styles.stepIcon}>{currentStepIndex > 0 ? <Check size={16} /> : <Coffee size={16} />}</div>
                        <span className={styles.stepLabel}>제조중</span>
                    </div>
                    <div className={`${styles.step} ${currentStepIndex >= 1 ? (currentStepIndex === 1 ? styles.activeStep : styles.completedStep) : ''}`}>
                        <div className={styles.stepIcon}>{currentStepIndex > 1 ? <Check size={16} /> : <ClipboardList size={16} />}</div>
                        <span className={styles.stepLabel}>제조완료</span>
                    </div>
                    <div className={`${styles.step} ${currentStepIndex >= 2 ? (currentStepIndex === 2 ? styles.activeStep : styles.completedStep) : ''}`}>
                        <div className={styles.stepIcon}><ShoppingBag size={16} /></div>
                        <span className={styles.stepLabel}>수령완료</span>
                    </div>
                </div>
            )}

            {isRejected && (
                <div className={styles.rejectDetails}>
                    <span className={styles.rejectLabel}>취소 사유</span>
                    <p className={styles.rejectReason}>{order.rejectReason || "매장 사정으로 인해 주문이 취소되었습니다."}</p>
                </div>
            )}
        </div>
    );
}
