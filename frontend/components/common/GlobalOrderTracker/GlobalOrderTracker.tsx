'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { fetchAPI } from '@/app/lib/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { Coffee, CheckCircle, XCircle, X } from 'lucide-react';
import styles from './GlobalOrderTracker.module.css';

interface OrderSummary {
    id: number;
    orderDate: string;
    orderNumber: number;
    displayNumber: string;
    status: 'PENDING' | 'PREPARING' | 'COMPLETED' | 'REJECTED' | 'PICKED_UP' | 'CANCELLED';
    summary: string;
}

export default function GlobalOrderTracker() {
    const [activeOrder, setActiveOrder] = useState<OrderSummary | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [hiddenIds, setHiddenIds] = useState<number[]>([]);
    const router = useRouter();
    const pathname = usePathname();

    const fetchLatestOrder = async () => {
        try {
            const { user } = useAuthStore.getState();
            let latest: OrderSummary | null = null;

            if (user) {
                // 회원 주문 조회
                const orders = await fetchAPI('/users/me/orders', { skipRedirect: true });
                if (Array.isArray(orders) && orders.length > 0) {
                    latest = orders[0];
                }
            } else {
                // 비회원 주문 조회 (로컬 스토리지 확인)
                const guestOrdersStr = localStorage.getItem('guest-orders');
                if (guestOrdersStr) {
                    const guestOrders = JSON.parse(guestOrdersStr);
                    if (Array.isArray(guestOrders) && guestOrders.length > 0) {
                        const guestLast = guestOrders[0];
                        const orderDetail = await fetchAPI(`/orders/${guestLast.date}/${guestLast.number}`, { skipRedirect: true });
                        if (orderDetail) {
                            latest = {
                                id: orderDetail.id,
                                orderDate: orderDetail.orderDate,
                                orderNumber: orderDetail.orderNumber,
                                displayNumber: orderDetail.displayNumber,
                                status: orderDetail.status,
                                summary: orderDetail.items?.length === 1 
                                    ? orderDetail.items[0].menuName 
                                    : `${orderDetail.items[0].menuName} 외 ${orderDetail.items.length - 1}건`
                            };
                        }
                    }
                }
            }

            if (latest) {
                // If it is picked up or canceled, we don't track anymore.
                if (latest.status === 'PICKED_UP' || latest.status === 'CANCELLED') {
                    setActiveOrder(null);
                    return;
                }

                // If user dismissed this order while it was rejected or completed, don't show it again.
                if (hiddenIds.includes(latest.id)) {
                    setActiveOrder(null);
                    return;
                }
                
                setActiveOrder(latest);
            } else {
                setActiveOrder(null);
            }
        } catch (error) {
            // Failed to fetch or no orders
            setActiveOrder(null);
        }
    };

    useEffect(() => {
        // Only run logic on client
        const storedHidden = sessionStorage.getItem('hiddenOrders');
        if (storedHidden) {
            setHiddenIds(JSON.parse(storedHidden));
        }

        fetchLatestOrder();
        
        // 빠른 상태 반영을 위해 폴링 주기를 2초로 단축 (테스트용/소규모 최적)
        const interval = setInterval(fetchLatestOrder, 2000);
        
        // Listen for manual refreshes from other components (like marking as picked up)
        window.addEventListener('globalTrackerRefresh', fetchLatestOrder);

        return () => {
            clearInterval(interval);
            window.removeEventListener('globalTrackerRefresh', fetchLatestOrder);
        };
    }, [hiddenIds.join(','), pathname]);

    // Update expanded state based on status changes or navigation.
    const prevStatusRef = useRef<string | null>(null);
    useEffect(() => {
        if (activeOrder) {
            if (prevStatusRef.current !== activeOrder.status) {
                setIsExpanded(true);
            }
            prevStatusRef.current = activeOrder.status;
        } else {
            setIsExpanded(false);
            prevStatusRef.current = null;
        }
    }, [activeOrder?.status]);


    if (!activeOrder) return null;

    // Do not show on the specific order detail page tracking UI to avoid confusion
    if (pathname && pathname.includes(`/order/${activeOrder.orderDate}/${activeOrder.orderNumber}`)) {
        return null;
    }

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newHidden = [...hiddenIds, activeOrder.id];
        setHiddenIds(newHidden);
        sessionStorage.setItem('hiddenOrders', JSON.stringify(newHidden));
        setActiveOrder(null);
    };

    const handleContainerClick = () => {
        if (!isExpanded) {
            setIsExpanded(true);
        } else {
            router.push(`/order/${activeOrder.orderDate}/${activeOrder.orderNumber}`);
        }
    };

    // Derived styles & labels based on status
    const isPreparing = activeOrder.status === 'PREPARING' || activeOrder.status === 'PENDING';
    const isCompleted = activeOrder.status === 'COMPLETED';
    const isRejected = activeOrder.status === 'REJECTED';

    let statusClass = '';
    let StatusIcon = Coffee;
    let label = '';
    
    if (isPreparing) {
        statusClass = styles.statusPreparing;
        label = activeOrder.status === 'PENDING' ? '접수 대기중' : '메뉴 준비중';
        StatusIcon = Coffee;
    } else if (isCompleted) {
        statusClass = styles.statusCompleted;
        label = '준비 완료 (픽업 대기)';
        StatusIcon = CheckCircle;
    } else if (isRejected) {
        statusClass = styles.statusRejected;
        label = '주문 반려';
        StatusIcon = XCircle;
    }

    return (
        <div className={styles.trackerWrapper}>
            <div 
                className={`${styles.trackerBody} ${isExpanded ? styles.expanded : ''} ${statusClass}`}
                onClick={handleContainerClick}
            >
                <div className={styles.iconContainer}>
                    <StatusIcon size={24} />
                </div>
                
                <div className={styles.detailsContainer}>
                    <div className={styles.statusTitle}>
                        {label} <span style={{fontSize:'0.8rem', color:'var(--color-gray-500)'}}>[{activeOrder.displayNumber}]</span>
                    </div>
                    <div className={styles.statusSummary}>
                        {activeOrder.summary}
                    </div>
                </div>

                {/* Show close button on expanded, non-preparing states if user wants to dismiss it */}
                <span 
                    className={styles.closeButton}
                    onClick={handleDismiss}
                    aria-label="닫기"
                    title="알림 숨기기"
                >
                    <X size={18} />
                </span>
            </div>
        </div>
    );
}
