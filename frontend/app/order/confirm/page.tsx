"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, CreditCard, Loader2 } from "lucide-react";
import styles from "./page.module.css";

import OrderItemSummary from "./_components/OrderItemSummary";
import PointUsageSection from "./_components/PointUsageSection";
import CustomerInfoSection from "./_components/CustomerInfoSection";
import PaymentMethodSection from "./_components/PaymentMethodSection";
import { useOrderConfirm } from "./_components/useOrderConfirm";

export default function OrderConfirmPage() {
    const router = useRouter();
    const {
        isMounted, isOrdering, items, orderType, username, email, phone, memo,
        isLoggedIn, paymentMethod, pointBalance, usePoints, originalTotalPrice,
        validUsePoints, finalPrice, estimatedEarnPoints,
        setUsername, setEmail, setPhone, setMemo, setPaymentMethod, setUsePoints,
        handleTestOrder, handlePaymentOrder,
    } = useOrderConfirm();

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
                <OrderItemSummary items={items} orderType={orderType} validUsePoints={validUsePoints} finalPrice={finalPrice} />

                {isLoggedIn && (
                    <PointUsageSection
                        pointBalance={pointBalance} usePoints={usePoints} setUsePoints={setUsePoints}
                        originalTotalPrice={originalTotalPrice} estimatedEarnPoints={estimatedEarnPoints}
                    />
                )}

                <CustomerInfoSection
                    username={username} email={email} phone={phone} memo={memo} isLoggedIn={isLoggedIn}
                    setUsername={setUsername} setEmail={setEmail} setPhone={setPhone} setMemo={setMemo}
                />

                <PaymentMethodSection paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />

                <div className={styles.footerActions}>
                    <button className={styles.testOrderButton} onClick={handleTestOrder} disabled={isOrdering || items.length === 0 || !username.trim()}>
                        🧪 테스트 주문
                    </button>
                    <button className={styles.orderButton} onClick={handlePaymentOrder} disabled={isOrdering || items.length === 0 || !username.trim() || finalPrice < 0}>
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
