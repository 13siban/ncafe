export interface StoreStatus {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
}

export interface DashboardStats {
    period: string;
    date: string;
    totalMenus: number;
    orderCount: number;
    orderCountChange: string;
    totalSales: number;
    totalSalesChange: string;
    customerCount: number;
    customerCountChange: string;
    preparingOrders: number;
    completedOrders: number;
    rejectedOrders: number;
}

export interface DashboardRecentOrder {
    id: number;
    displayNumber: string;
    customerName: string;
    isGuest: boolean;
    status: string;
    totalPrice: number;
    summary: string;
    createdAt: string;
}

export interface DashboardPopularMenu {
    rank: number;
    menuName: string;
    categoryName: string;
    quantitySold: number;
    totalSales: number;
}
