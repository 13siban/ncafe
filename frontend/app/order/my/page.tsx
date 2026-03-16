"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
    ClipboardList,
    AlertCircle,
    Home,
    Clock,
    Coffee
} from "lucide-react";
import { fetchAPI } from '@/app/lib/api/client';
import styles from "./page.module.css";

interface OrderHistoryItem {
    id: number;
    orderDate: string;
    orderNumber: number;
    displayNumber: string;
    customerName: string;
    isGuest: boolean;
    status: 'PREPARING' | 'COMPLETED' | 'REJECTED' | 'PICKED_UP';
    summary: string;
    totalPrice: number;
    createdAt: string;
}

const TABS = {
    PREPARING: '준비 중',
    COMPLETED: '준비 완료',
    PICKED_UP: '픽업 완료',
    REJECTED: '취소 완료'
};

export default function MyOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                // 1. 먼저 세션 확인 (또는 회원 주문 내역 호출 시도)
                try {
                    const data = await fetchAPI('/orders/my', { skipRedirect: true });
                    setOrders(data);
                } catch (error: any) {
                    // 401 Unauthorized인 경우 비회원 로직 수행
                    if (error.status === 401) {
                        const guestOrders = JSON.parse(localStorage.getItem("guest-orders") || "[]");
                        if (guestOrders.length > 0) {
                            // 비회원 주문 목록 조회 API 호출 (새로 만든 POST /orders/list)
                            const data = await fetchAPI('/orders/list', {
                                method: 'POST',
                                body: JSON.stringify(guestOrders)
                            });
                            setOrders(data);
                        } else {
                            setOrders([]);
                        }
                    } else {
                        throw error;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch my orders:", error);
                setOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMyOrders();
    }, []);

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <header className={styles.header}>
                    <button className={styles.backButton} onClick={() => router.back()}>
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className={styles.title}>내 주문 내역</h1>
                </header>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
                    <Coffee size={48} className="animate-spin" color="var(--primary)" />
                    <p style={{ color: '#666' }}>주문 내역을 불러오고 있습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.push('/menus')}>
                    <Home size={22} />
                </button>
                <h1 className={styles.title}>내 주문 내역</h1>
            </header>

            <main className={styles.container}>
                {orders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <ShoppingBag size={64} style={{ opacity: 0.3 }} />
                        <h2 className={styles.emptyTitle}>주문 내역이 없습니다.</h2>
                        <p>아직 NCafé에서 주문한 내역이 없네요.</p>
                        <button className={styles.orderButton} onClick={() => router.push('/menus')}>
                            메뉴 둘러보기
                        </button>
                    </div>
                ) : (
                    <div className={styles.orderList}>
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className={styles.orderCard}
                                onClick={() => router.push(`/order/${order.orderDate}/${order.orderNumber}`)}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.dateInfo}>
                                        <div className={styles.date}>{new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className={styles.displayNumber}>{order.displayNumber}</div>
                                    </div>
                                    <div className={`${styles.statusBadge} ${order.status === 'PREPARING' ? styles.badgePreparing :
                                            order.status === 'COMPLETED' ? styles.badgeCompleted :
                                                order.status === 'REJECTED' ? styles.badgeRejected :
                                                    styles.badgePickedUp
                                        }`}>
                                        {TABS[order.status] || order.status}
                                    </div>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.summary}>{order.summary}</div>
                                    <div className={styles.totalPrice}>{new Intl.NumberFormat('ko-KR').format(order.totalPrice)}원</div>
                                </div>
                                <div className={styles.cardFooter}>
                                    <div className={styles.detailButton}>
                                        상세보기 <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
