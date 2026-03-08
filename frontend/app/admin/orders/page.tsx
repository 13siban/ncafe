"use client";

import React, { useEffect, useState, useCallback } from 'react';
import {
    ShoppingBag,
    Clock,
    User,
    ChevronRight,
    X,
    CheckCircle2,
    AlertCircle,
    Undo,
    Coffee,
    MessageSquare,
    RefreshCw,
    Search,
    Filter
} from 'lucide-react';
import { fetchAPI } from '@/app/lib/api';
import styles from './page.module.css';
import toast from 'react-hot-toast';

type OrderStatus = 'PREPARING' | 'COMPLETED' | 'REJECTED' | 'PICKED_UP';

interface OrderItem {
    menuName: string;
    quantity: number;
    subtotal: number;
}

interface OrderListItem {
    id: number;
    orderDate: string;
    orderNumber: number;
    displayNumber: string;
    customerName: string;
    isGuest: boolean;
    status: OrderStatus;
    summary: string;
    totalPrice: number;
    createdAt: string;
}

// Full order for detailed modal
interface OrderFull extends OrderListItem {
    memo: string;
    rejectReason?: string;
    items: {
        menuName: string;
        quantity: number;
        subtotal: number;
        options: {
            groupName: string;
            itemName: string;
        }[];
    }[];
}

const TABS = [
    { label: '전체', value: 'ALL' },
    { label: '준비 중', value: 'PREPARING' },
    { label: '완료됨', value: 'COMPLETED' },
    { label: '수령됨', value: 'PICKED_UP' },
    { label: '거절됨', value: 'REJECTED' },
];

export default function AdminOrdersPage() {
    const [activeTab, setActiveTab] = useState('ALL');
    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Selection
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<OrderFull | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Reject Modal
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const fetchOrders = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        else setIsRefreshing(true);

        try {
            const statusParam = activeTab === 'ALL' ? '' : `?status=${activeTab}`;
            const data = await fetchAPI(`/admin/orders${statusParam}`);
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            toast.error('주문 목록을 가져오지 못했습니다.');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [activeTab]);

    const fetchOrderDetail = async (id: number) => {
        setLoadingDetail(true);
        setSelectedOrderId(id);
        try {
            const data = await fetchAPI(`/admin/orders/${id}`);
            setSelectedOrder(data);
        } catch (error) {
            console.error('Failed to fetch order detail:', error);
            toast.error('주문 상세 정보를 가져오지 못했습니다.');
            setSelectedOrderId(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Auto refresh every 30 seconds
        const interval = setInterval(() => fetchOrders(true), 30000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            await fetchAPI(`/admin/orders/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            toast.success('주문 상태가 업데이트되었습니다.');
            fetchOrders(true);
            if (selectedOrderId === id) fetchOrderDetail(id);
        } catch (error) {
            toast.error('상태 변경에 실패했습니다.');
        }
    };

    const handleReject = async () => {
        if (!rejectId || !rejectReason.trim()) return;
        setIsRejecting(true);
        try {
            await fetchAPI(`/admin/orders/${rejectId}/reject`, {
                method: 'PUT',
                body: JSON.stringify({ reason: rejectReason }),
            });
            toast.success('주문이 거절되었습니다.');
            setRejectId(null);
            setRejectReason('');
            fetchOrders(true);
            if (selectedOrderId === rejectId) fetchOrderDetail(rejectId);
        } catch (error) {
            toast.error('거절 처리에 실패했습니다.');
        } finally {
            setIsRejecting(false);
        }
    };

    const currentTabOrders = orders; // Filtered by server if activeTab changes

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.tabs}>
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            className={`${styles.tab} ${activeTab === tab.value ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab.value)}
                        >
                            {tab.label}
                            {activeTab === tab.value && (
                                <span className={styles.tabBadge}>{orders.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                <button
                    className={styles.secondaryAction}
                    onClick={() => fetchOrders(true)}
                    disabled={isRefreshing}
                >
                    <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    {isRefreshing ? '새로고침 중' : '목록 새로고침'}
                </button>
            </header>

            {loading ? (
                <div className={styles.emptyState}>
                    <RefreshCw size={48} className="animate-spin" />
                    <p>주문 목록을 불러오고 있습니다...</p>
                </div>
            ) : currentTabOrders.length === 0 ? (
                <div className={styles.emptyState}>
                    <ShoppingBag size={48} />
                    <p>해당 상태의 주문이 없습니다.</p>
                </div>
            ) : (
                <div className={styles.orderGrid}>
                    {currentTabOrders.map((order) => (
                        <div
                            key={order.id}
                            className={`${styles.orderCard} ${selectedOrderId === order.id ? styles.selectedCard : ''}`}
                            onClick={() => fetchOrderDetail(order.id)}
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
                                                    setRejectId(order.id);
                                                }}
                                            >
                                                주문 거절
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.primaryAction}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(order.id, 'COMPLETED');
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
                                                handleStatusChange(order.id, 'PICKED_UP');
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
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {selectedOrderId && selectedOrder && (
                <div className={styles.modalOverlay} onClick={() => {
                    setSelectedOrderId(null);
                    setSelectedOrder(null);
                }}>
                    <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 className={styles.modalTitle} style={{ marginBottom: 0 }}>주문 상세 정보</h3>
                            <button onClick={() => {
                                setSelectedOrderId(null);
                                setSelectedOrder(null);
                            }}>
                                <X size={24} color="#999" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className={styles.section}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>{selectedOrder.displayNumber}</span>
                                    <div className={`${styles.statusBadge} ${selectedOrder.status === 'PREPARING' ? styles.badgePreparing :
                                        selectedOrder.status === 'COMPLETED' ? styles.badgeCompleted :
                                            selectedOrder.status === 'REJECTED' ? styles.badgeRejected :
                                                styles.badgePickedUp
                                        }`}>
                                        {TABS.find(t => t.value === selectedOrder.status)?.label || selectedOrder.status}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                    주문 일시: {new Date(selectedOrder.createdAt).toLocaleString('ko-KR')}
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                    주문 메뉴
                                </h4>
                                <div className={styles.itemList}>
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} style={{ marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 600 }}>{item.menuName} × {item.quantity}</span>
                                                <span>{new Intl.NumberFormat('ko-KR').format(item.subtotal)}원</span>
                                            </div>
                                            {item.options.length > 0 && (
                                                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem', paddingLeft: '0.5rem', borderLeft: '2px solid #eee' }}>
                                                    {item.options.map(o => o.itemName).join(", ")}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--primary)', fontSize: '1.125rem' }}>
                                    <span>총 결제 금액</span>
                                    <span>{new Intl.NumberFormat('ko-KR').format(selectedOrder.totalPrice)}원</span>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.75rem', color: '#333', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                    주문자 정보
                                </h4>
                                <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <span style={{ color: '#999', width: '60px' }}>성함</span>
                                        <span>{selectedOrder.customerName} {selectedOrder.isGuest && '(비회원)'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <span style={{ color: '#999', width: '60px' }}>요청사항</span>
                                        <span style={{ color: selectedOrder.memo ? '#333' : '#ccc' }}>
                                            {selectedOrder.memo || '없음'}
                                        </span>
                                    </div>
                                    {selectedOrder.status === 'REJECTED' && (
                                        <div style={{ display: 'flex', gap: '1rem', backgroundColor: '#fff5f5', padding: '0.75rem', borderRadius: '4px', border: '1px solid #feb2b2' }}>
                                            <span style={{ color: '#c53030', fontWeight: 700, width: '60px' }}>반려사유</span>
                                            <span style={{ color: '#c53030' }}>{selectedOrder.rejectReason}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                {selectedOrder.status === 'PREPARING' && (
                                    <>
                                        <button
                                            className={`${styles.actionButton} ${styles.dangerAction}`}
                                            onClick={() => setRejectId(selectedOrder.id)}
                                            style={{ flex: 1 }}
                                        >
                                            주문 거절
                                        </button>
                                        <button
                                            className={`${styles.actionButton} ${styles.primaryAction}`}
                                            onClick={() => handleStatusChange(selectedOrder.id, 'COMPLETED')}
                                            style={{ flex: 2 }}
                                        >
                                            제조 완료
                                        </button>
                                    </>
                                )}
                                {selectedOrder.status === 'COMPLETED' && (
                                    <button
                                        className={`${styles.actionButton} ${styles.primaryAction}`}
                                        onClick={() => handleStatusChange(selectedOrder.id, 'PICKED_UP')}
                                        style={{ flex: 1 }}
                                    >
                                        픽업 완료
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {rejectId && (
                <div className={styles.modalOverlay} onClick={() => setRejectId(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>주문 거절 사유</h3>
                        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                            고객님께 전송될 주문 거절 사유를 입력해 주세요.
                        </p>
                        <textarea
                            className={styles.textarea}
                            placeholder="예) 재료 소진으로 인해 주문이 취소되었습니다."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                        <div className={styles.modalActions}>
                            <button
                                className={styles.secondaryAction}
                                onClick={() => setRejectId(null)}
                            >
                                취소
                            </button>
                            <button
                                className={`${styles.primaryAction} ${styles.actionButton}`}
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || isRejecting}
                            >
                                주문 거절 확정
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
