import * as PortOne from "@portone/browser-sdk/v2";

export type PaymentMethod = "KAKAOPAY" | "NAVERPAY" | "INICIS";

interface PaymentRequest {
    orderName: string;       // 예: "아메리카노 외 2건"
    totalAmount: number;     // 총 결제 금액
    method: PaymentMethod;   // 결제 수단
    customerName: string;    // 주문자명
    customerEmail?: string;  // 주문자 이메일 (이니시스 등 필수)
    customerPhoneNumber?: string; // 주문자 휴대폰 번호 (이니시스 등 필수)
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
    customerEmail,
    customerPhoneNumber,
}: PaymentRequest): Promise<string> {
    let channelKey = "";
    let payMethod: "EASY_PAY" | "CARD" = "EASY_PAY";

    if (method === "KAKAOPAY") {
        channelKey = process.env.NEXT_PUBLIC_PORTONE_KAKAOPAY_CHANNEL_KEY!;
    } else if (method === "NAVERPAY") {
        channelKey = process.env.NEXT_PUBLIC_PORTONE_NAVERPAY_CHANNEL_KEY!;
    } else if (method === "INICIS") {
        channelKey = process.env.NEXT_PUBLIC_PORTONE_INICIS_CHANNEL_KEY!;
        payMethod = "CARD";
    }

    if (!channelKey) {
        throw new Error(`${method} 결제 채널 키가 설정되지 않았습니다. .env.local 파일을 확인해 주세요.`);
    }

    // 고유한 paymentId 생성 (중복 방지)
    const paymentId = `ncafe_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const response = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey,
        paymentId,
        orderName,
        totalAmount,
        currency: "CURRENCY_KRW",
        payMethod,
        customer: {
            fullName: customerName,
            email: customerEmail,
            phoneNumber: customerPhoneNumber,
        },
        redirectUrl: `${window.location.origin}/api/payment/callback`, // 모바일 환경 대비
    });

    if (response?.code) {
        // 사용자가 결제를 취소하거나 오류 발생
        throw new Error(response.message || "결제가 취소되었습니다.");
    }

    return paymentId;
}
