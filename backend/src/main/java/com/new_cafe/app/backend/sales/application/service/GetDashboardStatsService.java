package com.new_cafe.app.backend.sales.application.service;

import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaRepository;
import com.new_cafe.app.backend.order.application.port.out.OrderRepositoryPort;
import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import com.new_cafe.app.backend.sales.application.port.in.GetDashboardStatsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetDashboardStatsService implements GetDashboardStatsUseCase {

    private final OrderRepositoryPort orderRepository;
    private final AdminMenuJpaRepository menuRepository;

    @Override
    public DashboardStats getDashboardStats(String period) {
        LocalDate today = LocalDate.now();
        
        LocalDate currentStart = today;
        LocalDate currentEnd = today;
        LocalDate prevStart = today.minusDays(1);
        LocalDate prevEnd = today.minusDays(1);

        if ("weekly".equalsIgnoreCase(period)) {
            currentStart = today.minusDays(6);
            prevStart = today.minusDays(13);
            prevEnd = today.minusDays(7);
        } else if ("monthly".equalsIgnoreCase(period)) {
            currentStart = today.withDayOfMonth(1);
            currentEnd = today.withDayOfMonth(today.lengthOfMonth());
            prevStart = today.minusMonths(1).withDayOfMonth(1);
            prevEnd = today.minusMonths(1).withDayOfMonth(today.minusMonths(1).lengthOfMonth());
        }

        long totalMenus = menuRepository.count();
        
        // Use stream based counting for ranges to avoid adding many port methods
        var currentOrders = orderRepository.findByOrderDateBetween(currentStart, currentEnd);
        var prevOrders = orderRepository.findByOrderDateBetween(prevStart, prevEnd);

        long orderCount = currentOrders.size();
        long prevOrderCount = prevOrders.size();
        
        long totalSales = currentOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .mapToLong(o -> o.getTotalPrice())
                .sum();
        long prevTotalSales = prevOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
                .mapToLong(o -> o.getTotalPrice())
                .sum();
        
        // Simple distinct user count + guest orders approximation for range
        long customerCount = currentOrders.stream().filter(o -> o.getUserId() != null).map(o -> o.getUserId()).distinct().count() 
                           + currentOrders.stream().filter(o -> o.getUserId() == null).count();
        long prevCustomerCount = prevOrders.stream().filter(o -> o.getUserId() != null).map(o -> o.getUserId()).distinct().count()
                           + prevOrders.stream().filter(o -> o.getUserId() == null).count();

        long preparingOrders = currentOrders.stream().filter(o -> o.getStatus() == OrderStatus.PREPARING).count();
        long completedOrders = currentOrders.stream().filter(o -> o.getStatus() == OrderStatus.COMPLETED).count();
        long rejectedOrders = currentOrders.stream().filter(o -> o.getStatus() == OrderStatus.REJECTED).count();

        return DashboardStats.builder()
                .period(period)
                .date(today.toString())
                .totalMenus(totalMenus)
                .orderCount(orderCount)
                .orderCountChange(calculateChange(orderCount, prevOrderCount))
                .totalSales(totalSales)
                .totalSalesChange(calculateChange(totalSales, prevTotalSales))
                .customerCount(customerCount)
                .customerCountChange(calculateChange(customerCount, prevCustomerCount))
                .preparingOrders(preparingOrders)
                .completedOrders(completedOrders)
                .rejectedOrders(rejectedOrders)
                .build();
    }

    private String calculateChange(long current, long previous) {
        if (previous == 0) {
            return current > 0 ? "+100%" : "0%";
        }
        double change = ((double) (current - previous) / previous) * 100;
        String sign = change >= 0 ? "+" : "";
        return sign + Math.round(change) + "%";
    }
}
