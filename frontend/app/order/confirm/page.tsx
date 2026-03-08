"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { authAPI } from "@/app/lib/api";
import { ChevronLeft, ShoppingBag, ClipboardList, User, MessageCircle, CreditCard, Loader2 } from "lucide-react";
import styles from "./page.module.css";

export default function OrderConfirmPage() {
    const router = useRouter();
    const { items, getTotalPrice, clearCart } = useCartStore();

    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOrdering, setIsOrdering] = useState(false);

    const [username, setUsername] = useState("비회원");
    const [memo, setMemo] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const fetchSession = async () => {
            try {
                const session = await authAPI.getSession();
                if (session && session.user) {
                    setUsername(session.user.nickname || session.user.username);
                    setIsLoggedIn(true);
                }
            } catch (e) {
                console.error("Failed to fetch session:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSession();
    }, []);

    useEffect(() => {
        if (isMounted && items.length === 0 && !isOrdering) {
            router.push("/menus");
        }
    }, [isMounted, items.length, isOrdering, router]);

    const handleOrder = async () => {
        if (items.length === 0) return;
        setIsOrdering(true);

        try {
            const orderItems = items.map(item => ({
                menuId: item.menuId,
                quantity: item.quantity,
                selectedOptions: item.selectedOptions.map(opt => ({
                    optionGroupId: opt.optionGroupId,
                    optionItemId: opt.optionItemId
                }))
            }));

            // Use /api rewriting handled by Next.js middleware or route.ts
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customerName: username,
                    memo: memo,
                    items: orderItems
                })
            });

            if (response.ok) {
                const result = await response.json();
                clearCart();
                // Phase 4-2 specifies order status page at /order/[date]/[number]
                // But result probably has orderDate and orderNumber
                router.push(`/order/${result.orderDate}/${result.orderNumber}`);
            } else {
                const error = await response.json();
                alert(`주문 실패: ${error.message || '영업 중이 아니거나 서버 오류가 발생했습니다.'}`);
            }
        } catch (error) {
            console.error("Order error:", error);
            alert('주문 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        } finally {
            setIsOrdering(false);
        }
    };

    if (!isMounted || (items.length === 0 && !isOrdering)) return null;

    return (
        <div className={styles.wrapper}>
            <header className={styles.header}>
                <button className={styles.backButton} onClick={() => router.back()}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className={styles.title}>주문 확인</h1>
            </header>

            <main className={styles.container}>
                {/* 1. Item Summary Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <ShoppingBag size={20} /> 주문 내역
                    </h2>
                    <div className={styles.itemList}>
                        {items.map((item) => (
                            <div key={item.cartId} className={styles.item}>
                                <div className={styles.itemInfo}>
                                    <span className={styles.itemName}>
                                        {item.menuName} × {item.quantity}
                                    </span>
                                    {item.selectedOptions.length > 0 && (
                                        <span className={styles.itemOptions}>
                                            {item.selectedOptions.map(o => o.optionItemName).join(", ")}
                                        </span>
                                    )}
                                </div>
                                <span className={styles.itemPrice}>
                                    {new Intl.NumberFormat('ko-KR').format(item.subtotal)}원
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>총 결제 금액</span>
                        <span className={styles.totalValue}>
                            {new Intl.NumberFormat('ko-KR').format(getTotalPrice())}원
                        </span>
                    </div>
                </div>

                {/* 2. Customer Info Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <ClipboardList size={20} /> 주문 정보
                    </h2>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <User size={14} style={{ marginRight: 4 }} /> 주문자
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="이름을 입력하세요"
                            disabled={isLoggedIn}
                        />
                        {isLoggedIn && <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 4 }}>회원 정보로 자동 입렵되었습니다.</p>}
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <MessageCircle size={14} style={{ marginRight: 4 }} /> 요청 사항
                        </label>
                        <textarea
                            className={styles.textarea}
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="예) 시럽 적게 넣어주세요, 얼음 많이 주세요"
                        />
                    </div>
                </div>

                <div className={styles.footerActions}>
                    <button
                        className={styles.orderButton}
                        onClick={handleOrder}
                        disabled={isOrdering || items.length === 0 || !username.trim()}
                    >
                        <CreditCard size={20} />
                        {new Intl.NumberFormat('ko-KR').format(getTotalPrice())}원 주문하기
                    </button>
                </div>
            </main>

            {isOrdering && (
                <div className={styles.loadingOverlay}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                    <span className={styles.loadingText}>주문을 전송하고 있습니다...</span>
                </div>
            )}
        </div>
    );
}
