package com.new_cafe.app.backend.sales.application.port.in;

import lombok.Builder;
import lombok.Getter;

public interface GetDashboardStatsUseCase {
    DashboardStats getDashboardStats(String period);

    @Getter
    @Builder
    class DashboardStats {
        private String period;
        private String date; // Standard date for the report
        private Long totalMenus;
        private Long orderCount;
        private String orderCountChange; // e.g., "+12%"
        private Long totalSales;
        private String totalSalesChange; // e.g., "+8%"
        private Long customerCount;
        private String customerCountChange; // e.g., "-5%"
        private Long preparingOrders;
        private Long completedOrders;
        private Long rejectedOrders;
    }
}
