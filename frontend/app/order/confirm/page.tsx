"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { authAPI, userAPI } from "@/app/lib/api";
import { ChevronLeft, ShoppingBag, ClipboardList, User, MessageCircle, CreditCard, Loader2 } from "lucide-react";
import styles from "./page.module.css";

import { requestPayment, PaymentMethod } from "@/lib/portone";

export default function OrderConfirmPage() {
    const router = useRouter();
    const { orderType, items, getTotalPrice, clearCart } = useCartStore();

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

    const [gradeName, setGradeName] = useState("");
    const [pointBalance, setPointBalance] = useState(0);
    const [usePoints, setUsePoints] = useState<number | string>("");
    const [earnRate, setEarnRate] = useState(0);

    const originalTotalPrice = getTotalPrice();
    const parsedUsePoints = typeof usePoints === 'number' ? usePoints : (parseInt(usePoints, 10) || 0);
    const validUsePoints = Math.floor(Math.min(parsedUsePoints, pointBalance, originalTotalPrice) / 100) * 100;
    const finalPrice = Math.max(0, originalTotalPrice - validUsePoints);
    const estimatedEarnPoints = (finalPrice > 0 && earnRate > 0) ? Math.floor(finalPrice * (earnRate / 100)) : 0;

    useEffect(() => {
        setIsMounted(true);
        const fetchSession = async () => {
            try {
                const session = await authAPI.getSession();
                if (session && session.user) {
                    setUsername(session.user.nickname || session.user.username || session.user.id);
                    setEmail(session.user.email || "");
                    setPhone(session.user.phoneNumber || "");
                    setIsLoggedIn(true);

                    try {
                        const gradeInfo = await userAPI.getGradeInfo();
                        if (gradeInfo) {
                            setGradeName(gradeInfo.currentGradeName || "");
                            setEarnRate(gradeInfo.earnRate || 0);
                        }
                    } catch (e) {
                        console.warn("Failed to fetch grade info - token might be expired");
                    }

                    try {
                        const pointInfo = await userAPI.getPointBalance();
                        if (pointInfo && pointInfo.pointBalance !== undefined) {
                            setPointBalance(pointInfo.pointBalance);
                        }
                    } catch (e) {
                        console.warn("Failed to fetch point balance - token might be expired");
                    }
                }
            } catch (e) {
                console.warn("Session check failed - treating as guest");
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
                orderType: orderType,
                memo: memo,
                items: orderItems,
                usePoints: validUsePoints,
                ...(paymentId && { paymentId }),
                ...(method && { paymentMethod: method })
            })
        });

        if (response.ok) {
            const result = await response.json();
            setIsSuccess(true);
            clearCart();

            // 비회원일 경우 로컬 스토리지에 주문 내역 저장
            if (!isLoggedIn) {
                const guestOrders = JSON.parse(localStorage.getItem("guest-orders") || "[]");
                const newOrder = { date: result.orderDate, number: result.orderNumber };

                // 중복 체크 후 추가
                const isDuplicate = guestOrders.some((o: any) => o.date === newOrder.date && o.number === newOrder.number);
                if (!isDuplicate) {
                    localStorage.setItem("guest-orders", JSON.stringify([newOrder, ...guestOrders].slice(0, 20))); // 최근 20개까지만 저장
                }
            }

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
                totalAmount: finalPrice,
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span><ShoppingBag size={20} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> 주문 내역</span>
                            <span style={{ 
                                fontSize: '0.85rem', 
                                padding: '4px 10px', 
                                borderRadius: '12px', 
                                backgroundColor: orderType === 'PICKUP' ? 'var(--color-primary-100)' : 'var(--color-gray-100)',
                                color: orderType === 'PICKUP' ? 'var(--color-primary-600)' : 'var(--color-gray-700)',
                                fontWeight: '600'
                            }}>
                                {orderType === 'PICKUP' ? '포장 (일회용기)' : '매장 (다회용기)'}
                            </span>
                        </div>
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
                    {validUsePoints > 0 && (
                        <div className={styles.totalRow} style={{ borderTop: "none", paddingTop: 0, marginTop: "-8px" }}>
                            <span className={styles.totalLabel} style={{ color: "var(--color-primary-600)" }}>포인트 사용</span>
                            <span className={styles.totalValue} style={{ color: "var(--color-primary-600)" }}>
                                - {new Intl.NumberFormat('ko-KR').format(validUsePoints)} P
                            </span>
                        </div>
                    )}
                    <div className={styles.totalRow}>
                        <span className={styles.totalLabel}>총 결제 금액</span>
                        <span className={styles.totalValue}>
                            {new Intl.NumberFormat('ko-KR').format(finalPrice)}원
                        </span>
                    </div>
                </div>

                {isLoggedIn && (
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>💰</span> 포인트 사용
                        </h2>
                        <div className={styles.formGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span>
                                    사용 가능 포인트: <strong>{new Intl.NumberFormat('ko-KR').format(pointBalance)}P</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)', marginLeft: '6px' }}>(100원 단위 사용)</span>
                                </span>
                                {estimatedEarnPoints > 0 && (
                                    <span style={{ color: 'var(--color-primary-600)' }}>예상 적립: {new Intl.NumberFormat('ko-KR').format(estimatedEarnPoints)}P</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <input
                                        type="number"
                                        step="100"
                                        min="0"
                                        max={Math.floor(Math.min(pointBalance, originalTotalPrice) / 100) * 100}
                                        className={styles.input}
                                        style={{ width: '100%', textAlign: 'right', fontSize: '1.1rem', padding: '12px 50px 12px 16px', fontWeight: '600' }}
                                        value={usePoints}
                                        onChange={(e) => {
                                            let v = e.target.value;
                                            setUsePoints(v === "" ? "" : parseInt(v, 10));
                                        }}
                                        placeholder="사용할 포인트 입력"
                                    />
                                    <span style={{ position: 'absolute', right: '32px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-500)', fontWeight: '600', pointerEvents: 'none' }}>P</span>
                                </div>
                                <button
                                    type="button"
                                    style={{ 
                                        width: 'auto', 
                                        whiteSpace: 'nowrap', 
                                        padding: '0 20px', 
                                        background: 'var(--bg-secondary)', 
                                        color: 'var(--text-secondary)', 
                                        border: '1.5px solid var(--border)', 
                                        borderRadius: 'var(--radius-md)', 
                                        fontWeight: '600',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setUsePoints(Math.floor(Math.min(pointBalance, originalTotalPrice) / 100) * 100)}
                                >
                                    전액 사용
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            {isLoggedIn ? '이메일' : '[선택] 이메일 (결제 알림용)'}
                        </label>
                        <input
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={isLoggedIn ? '' : '입력하지 않아도 주문 가능합니다'}
                            disabled={isLoggedIn}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            {isLoggedIn ? '휴대폰 번호' : '[선택] 휴대폰 번호 (결제 알림용)'}
                        </label>
                        <input
                            type="tel"
                            className={styles.input}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder={isLoggedIn ? '' : '입력하지 않아도 주문 가능합니다'}
                            disabled={isLoggedIn}
                        />
                    </div>
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
                        disabled={isOrdering || items.length === 0 || !username.trim() || finalPrice < 0}
                    >
                        <CreditCard size={20} />
                        {new Intl.NumberFormat('ko-KR').format(finalPrice)}원 결제하기
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

