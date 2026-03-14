import React from 'react';

export type OrderStatus = 'PREPARING' | 'COMPLETED' | 'REJECTED' | 'PICKED_UP';

export interface OrderDetail {
    id: number;
    orderDate: string;
    orderNumber: number;
    displayNumber: string;
    customerName: string;
    status: OrderStatus;
    totalPrice: number;
    memo: string;
    rejectReason?: string;
    usedPoints?: number;
    earnPoints?: number;
    createdAt: string;
    items: {
        menuName: string;
        quantity: number;
        unitPrice: number;
        optionPrice: number;
        subtotal: number;
        options: {
            groupName: string;
            itemName: string;
            priceDelta: number;
        }[];
    }[];
}

export interface StatusInfo {
    title: string;
    icon: React.ReactNode;
    color: string;
    description: string;
}
