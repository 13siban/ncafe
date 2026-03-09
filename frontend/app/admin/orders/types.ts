export type OrderStatus = 'PREPARING' | 'COMPLETED' | 'REJECTED' | 'PICKED_UP';

export interface OrderItem {
    menuName: string;
    quantity: number;
    subtotal: number;
}

export interface OrderListItem {
    id: number;
    orderDate: string;
    orderNumber: number;
    displayNumber: string;
    customerName: string;
    isGuest: boolean;
    status: OrderStatus;
    summary: string;
    totalPrice: number;
    createdAt: string;
}

export interface OrderFull extends OrderListItem {
    memo: string;
    rejectReason?: string;
    paymentId?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    items: {
        menuName: string;
        quantity: number;
        subtotal: number;
        options: {
            groupName: string;
            itemName: string;
        }[];
    }[];
}

export const TABS = [
    { label: '전체', value: 'ALL' },
    { label: '준비 중', value: 'PREPARING' },
    { label: '완료됨', value: 'COMPLETED' },
    { label: '수령됨', value: 'PICKED_UP' },
    { label: '거절됨', value: 'REJECTED' },
];
