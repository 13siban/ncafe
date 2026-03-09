package com.new_cafe.app.backend.sales.application.port.in;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

public interface GetSalesAnalysisUseCase {
    SalesSummary getSalesSummary(String period, LocalDate date);
    List<MenuRankingDto> getMenuRanking(String period, LocalDate date);
    List<SalesChartDto> getSalesChart(String period, LocalDate date);

    @Getter
    @Builder
    class SalesSummary {
        private Long totalSales;
        private Long totalOrders;
        private Long completedOrders;
        private Long rejectedOrders;
        private Long preparingOrders;
        private Double avgOrderAmount;
        private Long memberOrders;
        private Long guestOrders;
    }

    @Getter
    @Setter
    @Builder
    class MenuRankingDto {
        private Integer rank;
        private String menuName;
        private String categoryName;
        private Integer quantitySold;
        private Long totalSales;
    }

    @Getter
    @Builder
    class SalesChartDto {
        private String label; // "09:00" or "2026-03-09"
        private Long sales;
    }
}
