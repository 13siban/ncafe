'use client';

import React from 'react';
import { X } from 'lucide-react';
import styles from '../../page.module.css';
import modalStyles from './OrderDetailModal.module.css';
import { OrderFull, TABS } from '../../types';

interface OrderDetailModalProps {
    order: OrderFull;
    onClose: () => void;
    onStatusChange: (id: number, status: string) => void;
    onRejectClick: (id: number) => void;
}

export function OrderDetailModal({
    order,
    onClose,
    onStatusChange,
    onRejectClick
}: OrderDetailModalProps) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className={modalStyles.modalHeader}>
                    <h3 className={styles.modalTitle} style={{ marginBottom: 0 }}>주문 상세 정보</h3>
                    <button onClick={onClose}>
                        <X size={24} color="#999" />
                    </button>
                </div>

                <div className={modalStyles.modalContent}>
                    <div className={modalStyles.section}>
                        <div className={modalStyles.orderHeader}>
                            <span className={modalStyles.orderNumber}>{order.displayNumber}</span>
                            <div className={`${styles.statusBadge} ${order.status === 'PREPARING' ? styles.badgePreparing :
                                order.status === 'COMPLETED' ? styles.badgeCompleted :
                                    order.status === 'REJECTED' ? styles.badgeRejected :
                                        styles.badgePickedUp
                                }`}>
                                {TABS.find(t => t.value === order.status)?.label || order.status}
                            </div>
                        </div>
                        <div className={modalStyles.orderDate}>
                            주문 일시: {new Date(order.createdAt).toLocaleString('ko-KR')}
                        </div>
                    </div>

                    <div>
                        <h4 className={modalStyles.sectionLabel}>주문 메뉴</h4>
                        <div className={modalStyles.itemList}>
                            {order.items.map((item, idx) => (
                                <div key={idx} className={modalStyles.orderItem}>
                                    <div className={modalStyles.itemRow}>
                                        <span className={modalStyles.itemName}>{item.menuName} × {item.quantity}</span>
                                        <span>{new Intl.NumberFormat('ko-KR').format(item.subtotal)}원</span>
                                    </div>
                                    {item.options.length > 0 && (
                                        <div className={modalStyles.itemOptions}>
                                            {item.options.map(o => o.itemName).join(", ")}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className={modalStyles.totalRow}>
                            <span>총 결제 금액</span>
                            <span>{new Intl.NumberFormat('ko-KR').format(order.totalPrice)}원</span>
                        </div>
                    </div>

                    <div>
                        <h4 className={modalStyles.sectionLabel}>주문자 정보</h4>
                        <div className={modalStyles.infoList}>
                            <div className={modalStyles.infoRow}>
                                <span className={modalStyles.infoLabel}>성함</span>
                                <span>{order.customerName} {order.isGuest && '(비회원)'}</span>
                            </div>
                            <div className={modalStyles.infoRow}>
                                <span className={modalStyles.infoLabel}>요청사항</span>
                                <span className={order.memo ? modalStyles.memoText : modalStyles.emptyMemo}>
                                    {order.memo || '없음'}
                                </span>
                            </div>
                            {order.status === 'REJECTED' && (
                                <div className={modalStyles.rejectBox}>
                                    <span className={modalStyles.rejectLabel}>반려사유</span>
                                    <span className={modalStyles.rejectValue}>{order.rejectReason}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className={modalStyles.sectionLabel}>결제 정보</h4>
                        <div className={modalStyles.infoList}>
                            <div className={modalStyles.infoRow}>
                                <span className={modalStyles.infoLabel}>결제 수단</span>
                                <span>
                                    {order.paymentId ? (
                                        <>
                                            {order.paymentMethod === 'kakaopay' ? '카카오페이' :
                                                order.paymentMethod === 'naverpay' ? '네이버페이' :
                                                    order.paymentMethod}
                                            {order.paymentStatus === 'PAID' && ' (결제완료)'}
                                        </>
                                    ) : (
                                        <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>🧪 테스트 주문</span>
                                    )}
                                </span>
                            </div>
                            {order.paymentId && (
                                <div className={modalStyles.infoRow}>
                                    <span className={modalStyles.infoLabel}>결제 ID</span>
                                    <span style={{ fontSize: '11px', color: '#999' }}>{order.paymentId}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={modalStyles.modalFooter}>
                        {order.status === 'PREPARING' && (
                            <>
                                <button
                                    className={`${styles.actionButton} ${styles.dangerAction} ${modalStyles.flex1}`}
                                    onClick={() => onRejectClick(order.id)}
                                >
                                    주문 거절
                                </button>
                                <button
                                    className={`${styles.actionButton} ${styles.primaryAction} ${modalStyles.flex2}`}
                                    onClick={() => onStatusChange(order.id, 'COMPLETED')}
                                >
                                    제조 완료
                                </button>
                            </>
                        )}
                        {order.status === 'COMPLETED' && (
                            <button
                                className={`${styles.actionButton} ${styles.primaryAction} ${modalStyles.flex1}`}
                                onClick={() => onStatusChange(order.id, 'PICKED_UP')}
                            >
                                픽업 완료
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
