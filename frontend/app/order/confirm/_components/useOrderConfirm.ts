'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { authAPI } from '@/app/lib/api/authAPI';
import { userAPI } from '@/app/lib/api/userAPI';
import { requestPayment, PaymentMethod } from '@/lib/portone';

export const useOrderConfirm = () => {
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
    const parsedUsePoints = typeof usePoints === 'number' ? usePoints : (parseInt(usePoints as string, 10) || 0);
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
                        if (gradeInfo) { setGradeName(gradeInfo.currentGradeName || ""); setEarnRate(gradeInfo.earnRate || 0); }
                    } catch { console.warn("Failed to fetch grade info"); }

                    try {
                        const pointInfo = await userAPI.getPointBalance();
                        if (pointInfo?.pointBalance !== undefined) setPointBalance(pointInfo.pointBalance);
                    } catch { console.warn("Failed to fetch point balance"); }
                }
            } catch { console.warn("Session check failed"); }
            finally { setIsLoading(false); }
        };
        fetchSession();
    }, []);

    useEffect(() => {
        if (isMounted && items.length === 0 && !isOrdering && !isSuccess) router.push("/menus");
    }, [isMounted, items.length, isOrdering, isSuccess, router]);

    const submitOrder = async (paymentId?: string, method?: string) => {
        const orderItems = items.map(item => ({
            menuId: item.menuId, quantity: item.quantity,
            selectedOptions: item.selectedOptions.map(opt => ({ optionGroupId: opt.optionGroupId, optionItemId: opt.optionItemId }))
        }));

        const response = await fetch('/api/orders', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerName: username, orderType, memo, items: orderItems, usePoints: validUsePoints,
                ...(paymentId && { paymentId }), ...(method && { paymentMethod: method })
            })
        });

        if (response.ok) {
            const result = await response.json();
            setIsSuccess(true); clearCart();
            if (!isLoggedIn) {
                const guestOrders = JSON.parse(localStorage.getItem("guest-orders") || "[]");
                const newOrder = { date: result.orderDate, number: result.orderNumber };
                if (!guestOrders.some((o: any) => o.date === newOrder.date && o.number === newOrder.number)) {
                    localStorage.setItem("guest-orders", JSON.stringify([newOrder, ...guestOrders].slice(0, 20)));
                }
            }
            router.push(`/order/${result.orderDate}/${result.orderNumber}`);
        } else {
            const error = await response.json();
            throw new Error(error.message || '영업 중이 아니거나 서버 오류가 발생했습니다.');
        }
    };

    const handleTestOrder = async () => {
        if (items.length === 0) return;
        setIsOrdering(true);
        try { await submitOrder(); }
        catch (error: any) { alert(`주문 실패: ${error.message}`); }
        finally { setIsOrdering(false); }
    };

    const handlePaymentOrder = async () => {
        if (items.length === 0) return;
        setIsOrdering(true);
        try {
            const orderName = items.length === 1 ? items[0].menuName : `${items[0].menuName} 외 ${items.length - 1}건`;
            const trimmedEmail = (email || "").trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const finalEmail = emailRegex.test(trimmedEmail) ? trimmedEmail : "consumer@ncafe.com";
            const paymentId = await requestPayment({
                orderName, totalAmount: finalPrice, method: paymentMethod,
                customerName: username, customerEmail: finalEmail, customerPhoneNumber: phone || "010-0000-0000",
            });
            await submitOrder(paymentId, paymentMethod);
        } catch (error: any) { alert(`결제 실패: ${error.message}`); }
        finally { setIsOrdering(false); }
    };

    return {
        isMounted, isOrdering, items, orderType, username, email, phone, memo,
        isLoggedIn, paymentMethod, pointBalance, usePoints, originalTotalPrice,
        validUsePoints, finalPrice, estimatedEarnPoints,
        setUsername, setEmail, setPhone, setMemo, setPaymentMethod, setUsePoints,
        handleTestOrder, handlePaymentOrder,
    };
};
