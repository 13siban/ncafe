export interface SalesSummary {
    totalSales: number;
    totalOrders: number;
    completedOrders: number;
    rejectedOrders: number;
    preparingOrders: number;
    avgOrderAmount: number;
    memberOrders: number;
    guestOrders: number;
}

export interface MenuRanking {
    rank: number;
    menuName: string;
    categoryName: string;
    quantitySold: number;
    totalSales: number;
}

export interface SalesChartData {
    label: string;
    sales: number;
}

export interface SalesOrderItem {
    id: number;
    displayNumber: string;
    customerName: string;
    isGuest: boolean;
    status: string;
    totalPrice: number;
    summary: string;
    createdAt: string;
}

export type SalesPeriod = 'daily' | 'weekly' | 'monthly';
