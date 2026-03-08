"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft,
    Clock,
    CheckCircle2,
    AlertCircle,
    Coffee,
    ShoppingBag,
    Check,
    ClipboardList,
    Home,
    Smartphone,
    MessageCircle
} from "lucide-react";
import { fetchAPI } from "@/app/lib/api";
import styles from "./page.module.css";

type OrderStatus = 'PREPARING' | 'COMPLETED' | 'REJECTED' | 'PICKED_UP';

interface OrderDetail {
    id: number;
    orderDate: string;
    orderNumber: number;
    displayNumber: string;
    customerName: string;
    status: OrderStatus;
    totalPrice: number;
    memo: string;
    rejectReason?: string;
    createdAt: string;
    items: {
        menuName: string;
        quantity: number;
        unitPrice: number;
        optionPrice: number;
        subtotal: number;
        options: {
            groupName: string;
            itemName: string;
            priceDelta: number;
        }[];
    }[];
}

const STATUS_INFO = {
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

export default function OrderTrackingPage() {
    const router = useRouter();
    const params = useParams();
    const { date, number } = params;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchOrder = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        else setIsRefreshing(true);

        try {
            const data = await fetchAPI(`/orders/${date}/${number}`);
            setOrder(data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch order:", error);
            // If it's a 404, maybe it's too early? or wrong params
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [date, number]);

    useEffect(() => {
        fetchOrder();

        // Poll every 10 seconds while PREPARING or COMPLETED
        const interval = setInterval(() => {
            if (order && (order.status === 'PREPARING' || order.status === 'COMPLETED')) {
                fetchOrder(true);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchOrder, order?.status]);

    if (loading && !order) {
        return (
            <div className={styles.wrapper}>
                <header className={styles.header}>
                    <button className={styles.backButton} onClick={() => router.back()}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className={styles.title}>주문 확인 중...</h1>
                </header>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                    <Coffee size={48} className="animate-spin" color="var(--primary)" />
                    <p style={{ color: '#666' }}>주문 내역을 불러오고 있습니다.</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className={styles.wrapper}>
                <header className={styles.header}>
                    <button className={styles.backButton} onClick={() => router.back()}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className={styles.title}>주문을 찾을 수 없음</h1>
                </header>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', padding: '2rem', textAlign: 'center' }}>
                    <AlertCircle size={48} color="var(--color-error)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>주문 정보를 찾을 수 없습니다.</h2>
                    <p style={{ color: '#666', marginTop: '0.5rem', marginBottom: '2rem' }}>주문 번호를 다시 확인해 주시거나 매장에 문의해 주세요.</p>
                    <button className={styles.primaryButton} style={{ width: '100%' }} onClick={() => router.push('/menus')}>
                        <Home size={18} /> 홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    const currentStatus = STATUS_INFO[order.status];
    const statusSteps = ['PREPARING', 'COMPLETED', 'PICKED_UP'];
    const currentStepIndex = statusSteps.indexOf(order.status);
    const isRejected = order.status === 'REJECTED';

    return (
        <div className={styles.wrapper}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.push('/menus')}>
                    <Home size={22} />
                </button>
                <h1 className={styles.title}>주문 추적</h1>
                <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#999' }}>
                    {isRefreshing ? '업데이트 중...' : `${lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                </div>
            </header>

            <main className={styles.container}>
                {/* 1. Real-time Status Card */}
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

                {/* 2. Order Details Section */}
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

                <div className={styles.footerActions}>
                    <button className={styles.secondaryButton} onClick={() => router.push('/menus')}>
                        <ShoppingBag size={18} /> 추가 메뉴 보기
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem', opacity: 0.5 }}>
                        <Smartphone size={14} />
                        <span style={{ fontSize: '0.75rem' }}>주문 상태가 변경되면 자동으로 화면이 갱신됩니다.</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
