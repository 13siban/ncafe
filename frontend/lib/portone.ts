import * as PortOne from "@portone/browser-sdk/v2";

export type PaymentMethod = "KAKAOPAY" | "NAVERPAY";

interface PaymentRequest {
    orderName: string;       // 예: "아메리카노 외 2건"
    totalAmount: number;     // 총 결제 금액
    method: PaymentMethod;   // 결제 수단
    customerName: string;    // 주문자명
}

/**
 * 포트원 결제창 호출
 * @returns paymentId (성공 시) 또는 에러 throw
 */
export async function requestPayment({
    orderName,
    totalAmount,
    method,
    customerName,
}: PaymentRequest): Promise<string> {
    const channelKey =
        method === "KAKAOPAY"
            ? process.env.NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY!
            : process.env.NEXT_PUBLIC_PORTONE_NAVERPAY_CHANNEL_KEY!;

    // 고유한 paymentId 생성 (중복 방지)
    const paymentId = `ncafe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const response = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey,
        paymentId,
        orderName,
        totalAmount,
        currency: "CURRENCY_KRW",
        payMethod: "EASY_PAY",
        customer: {
            fullName: customerName,
        },
        redirectUrl: `${window.location.origin}/api/payment/callback`, // 모바일 환경 대비
    });

    if (response?.code) {
        // 사용자가 결제를 취소하거나 오류 발생
        throw new Error(response.message || "결제가 취소되었습니다.");
    }

    return paymentId;
}
