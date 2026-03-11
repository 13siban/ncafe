"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { authAPI } from "@/app/lib/api";
import { ChevronLeft, ShoppingBag, ClipboardList, User, MessageCircle, CreditCard, Loader2 } from "lucide-react";
import styles from "./page.module.css";

import { requestPayment, PaymentMethod } from "@/lib/portone";

export default function OrderConfirmPage() {
    const router = useRouter();
    const { items, getTotalPrice, clearCart } = useCartStore();

    const [isMounted, setIsMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOrdering, setIsOrdering] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [username, setUsername] = useState("비회원");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [memo, setMemo] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("KAKAOPAY");

    useEffect(() => {
        setIsMounted(true);
        const fetchSession = async () => {
            try {
                const session = await authAPI.getSession();
                if (session && session.user) {
                    setUsername(session.user.nickname || session.user.username);
                    setEmail(session.user.email || "");
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
        if (isMounted && items.length === 0 && !isOrdering && !isSuccess) {
            router.push("/menus");
        }
    }, [isMounted, items.length, isOrdering, isSuccess, router]);

    const handleConfirmSuccess = () => {
        router.push("/order/history");
    };

    const handleTestOrder = async () => {
        if (items.length === 0) return;
        setIsOrdering(true);
        try {
            await submitOrder();
        } catch (error: any) {
            alert(`주문 실패: ${error.message}`);
        } finally {
            setIsOrdering(false);
        }
    };

    const submitOrder = async (paymentId?: string, method?: string) => {
        const orderItems = items.map(item => ({
            menuId: item.menuId,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions.map(opt => ({
                optionGroupId: opt.optionGroupId,
                optionItemId: opt.optionItemId
            }))
        }));

        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerName: username,
                memo: memo,
                items: orderItems,
                ...(paymentId && { paymentId }),
                ...(method && { paymentMethod: method })
            })
        });

        if (response.ok) {
            const result = await response.json();
            setIsSuccess(true);
            clearCart();
            router.push(`/order/${result.orderDate}/${result.orderNumber}`);
        } else {
            const error = await response.json();
            throw new Error(error.message || '영업 중이 아니거나 서버 오류가 발생했습니다.');
        }
    };


    const handlePaymentOrder = async () => {
        if (items.length === 0) return;
        setIsOrdering(true);
        try {
            const orderName = items.length === 1
                ? items[0].menuName
                : `${items[0].menuName} 외 ${items.length - 1}건`;

            // 이메일 유효성 검사 및 정리 (이니시스 필수값 대응)
            const trimmedEmail = (email || "").trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const finalEmail = emailRegex.test(trimmedEmail) ? trimmedEmail : "consumer@ncafe.com";

            const paymentId = await requestPayment({
                orderName,
                totalAmount: getTotalPrice(),
                method: paymentMethod,
                customerName: username,
                customerEmail: finalEmail,
                customerPhoneNumber: phone || "010-0000-0000", // 이니시스 V2 필수값 대응
            });

            await submitOrder(paymentId, paymentMethod);
        } catch (error: any) {
            alert(`결제 실패: ${error.message}`);
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
                    </div>
                    {!isLoggedIn && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                이메일 (결제 알림용)
                            </label>
                            <input
                                type="email"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                            />
                        </div>
                    )}
                    {!isLoggedIn && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                휴대폰 번호 (결제 알림용)
                            </label>
                            <input
                                type="tel"
                                className={styles.input}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="010-0000-0000"
                            />
                        </div>
                    )}
                    {isLoggedIn && <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: 4 }}>회원 정보로 자동 입력되었습니다.</p>}
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

                {/* 3. Payment Method Section */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <CreditCard size={20} /> 결제 수단
                    </h2>
                    <div className={styles.paymentMethods}>
                        <button
                            className={`${styles.paymentButton} ${paymentMethod === "KAKAOPAY" ? styles.selected : ""}`}
                            onClick={() => setPaymentMethod("KAKAOPAY")}
                        >
                            <span className={styles.paymentIcon}>💛</span>
                            카카오페이
                        </button>
                        <button
                            className={`${styles.paymentButton} ${paymentMethod === "NAVERPAY" ? styles.selected : ""}`}
                            onClick={() => setPaymentMethod("NAVERPAY")}
                        >
                            <span className={styles.paymentIcon}>💚</span>
                            네이버페이
                        </button>
                        <button
                            className={`${styles.paymentButton} ${paymentMethod === "INICIS" ? styles.selected : ""}`}
                            onClick={() => setPaymentMethod("INICIS")}
                        >
                            <span className={styles.paymentIcon}>💳</span>
                            신용카드
                        </button>
                    </div>
                </div>

                <div className={styles.footerActions}>
                    <button
                        className={styles.testOrderButton}
                        onClick={handleTestOrder}
                        disabled={isOrdering || items.length === 0 || !username.trim()}
                    >
                        🧪 테스트 주문
                    </button>
                    <button
                        className={styles.orderButton}
                        onClick={handlePaymentOrder}
                        disabled={isOrdering || items.length === 0 || !username.trim()}
                    >
                        <CreditCard size={20} />
                        {new Intl.NumberFormat('ko-KR').format(getTotalPrice())}원 결제하기
                    </button>
                </div>
            </main>

            {isOrdering && (
                <div className={styles.loadingOverlay}>
                    <Loader2 size={48} className="animate-spin" color="var(--primary)" />
                    <span className={styles.loadingText}>주문을 처리하고 있습니다...</span>
                </div>
            )}
        </div>
    );
}

