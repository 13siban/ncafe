package com.new_cafe.app.backend.sales.application.service;

import com.new_cafe.app.backend.order.application.port.out.OrderRepositoryPort;
import com.new_cafe.app.backend.order.domain.model.Order;
import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import com.new_cafe.app.backend.sales.domain.model.DailyMenuSales;
import com.new_cafe.app.backend.sales.application.port.in.GetSalesAnalysisUseCase;
import com.new_cafe.app.backend.sales.application.port.out.SalesRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetSalesAnalysisService implements GetSalesAnalysisUseCase {

    private final OrderRepositoryPort orderRepository;
    private final SalesRepositoryPort salesRepository;

    @Override
    public SalesSummary getSalesSummary(String period, LocalDate date) {
        LocalDate start = date;
        LocalDate end = date;

        if ("weekly".equalsIgnoreCase(period)) {
            start = date.minusDays(6);
        } else if ("monthly".equalsIgnoreCase(period)) {
            start = date.withDayOfMonth(1);
            end = date.withDayOfMonth(date.lengthOfMonth());
        }

        List<Order> orders = orderRepository.findByOrderDateBetween(start, end);

        long totalOrders = orders.size();
        long completedOrders = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED || o.getStatus() == OrderStatus.PICKED_UP)
                .count();
        long rejectedOrders = orders.stream().filter(o -> o.getStatus() == OrderStatus.REJECTED).count();
        long preparingOrders = orders.stream().filter(o -> o.getStatus() == OrderStatus.PREPARING).count();
        long totalSales = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED || o.getStatus() == OrderStatus.PICKED_UP)
                .mapToLong(Order::getTotalPrice)
                .sum();
        
        long memberOrderCount = orders.stream()
                .filter(o -> o.getUserId() != null)
                .count();
        long guestOrderCount = totalOrders - memberOrderCount;

        double avgAmount = completedOrders > 0 ? (double) totalSales / completedOrders : 0;

        return SalesSummary.builder()
                .totalSales(totalSales)
                .totalOrders(totalOrders)
                .completedOrders(completedOrders)
                .rejectedOrders(rejectedOrders)
                .preparingOrders(preparingOrders)
                .avgOrderAmount(avgAmount)
                .memberOrders(memberOrderCount)
                .guestOrders(guestOrderCount)
                .build();
    }

    @Override
    public List<MenuRankingDto> getMenuRanking(String period, LocalDate date) {
        LocalDate start = date;
        LocalDate end = date;

        if ("weekly".equalsIgnoreCase(period)) {
            start = date.minusDays(6);
        } else if ("monthly".equalsIgnoreCase(period)) {
            start = date.withDayOfMonth(1);
            end = date.withDayOfMonth(date.lengthOfMonth());
        }

        List<DailyMenuSales> dailySales = salesRepository.findBySaleDateBetween(start, end);
        
        Map<String, MenuRankingDto> aggregated = dailySales.stream()
                .collect(Collectors.toMap(
                        DailyMenuSales::getMenuName,
                        s -> MenuRankingDto.builder()
                                .menuName(s.getMenuName())
                                .categoryName(s.getCategoryName())
                                .quantitySold(s.getQuantitySold())
                                .totalSales(Long.valueOf(s.getTotalSales()))
                                .build(),
                        (existing, replacement) -> {
                            existing.setQuantitySold(existing.getQuantitySold() + replacement.getQuantitySold());
                            existing.setTotalSales(existing.getTotalSales() + replacement.getTotalSales());
                            return existing;
                        }
                ));

        List<MenuRankingDto> sorted = aggregated.values().stream()
                .sorted(Comparator.comparing(MenuRankingDto::getQuantitySold).reversed())
                .collect(Collectors.toList());

        return IntStream.range(0, sorted.size())
                .mapToObj(i -> {
                    MenuRankingDto dto = sorted.get(i);
                    dto.setRank(i + 1);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<SalesChartDto> getSalesChart(String period, LocalDate date) {
        if ("weekly".equalsIgnoreCase(period)) {
            LocalDate start = date.minusDays(6);
            List<Order> orders = orderRepository.findByOrderDateBetween(start, date);
            
            Map<LocalDate, Long> salesByDate = orders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.COMPLETED || o.getStatus() == OrderStatus.PICKED_UP)
                    .collect(Collectors.groupingBy(Order::getOrderDate, Collectors.summingLong(Order::getTotalPrice)));

            return start.datesUntil(date.plusDays(1))
                    .map(d -> SalesChartDto.builder()
                            .label(formatDateLabel(d))
                            .sales(salesByDate.getOrDefault(d, 0L))
                            .build())
                    .collect(Collectors.toList());
        } else if ("monthly".equalsIgnoreCase(period)) {
            LocalDate start = date.withDayOfMonth(1);
            LocalDate end = date.withDayOfMonth(date.lengthOfMonth());
            List<Order> orders = orderRepository.findByOrderDateBetween(start, end);

            Map<LocalDate, Long> salesByDate = orders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.COMPLETED || o.getStatus() == OrderStatus.PICKED_UP)
                    .collect(Collectors.groupingBy(Order::getOrderDate, Collectors.summingLong(Order::getTotalPrice)));

            return start.datesUntil(end.plusDays(1))
                    .map(d -> SalesChartDto.builder()
                            .label(String.valueOf(d.getDayOfMonth()))
                            .sales(salesByDate.getOrDefault(d, 0L))
                            .build())
                    .collect(Collectors.toList());
        }
        
        // Default to daily hourly chart
        List<Order> todayOrders = orderRepository.findByOrderDateOrderByCreatedAtDesc(date);
        Map<Integer, Long> salesByHour = todayOrders.stream()
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED || o.getStatus() == OrderStatus.PICKED_UP)
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().getHour(), Collectors.summingLong(Order::getTotalPrice)));

        return IntStream.range(0, 24)
                .mapToObj(h -> SalesChartDto.builder()
                        .label(String.format("%02d:00", h))
                        .sales(salesByHour.getOrDefault(h, 0L))
                        .build())
                .collect(Collectors.toList());
    }

    private String formatDateLabel(LocalDate date) {
        return date.getMonthValue() + "/" + date.getDayOfMonth();
    }
}
