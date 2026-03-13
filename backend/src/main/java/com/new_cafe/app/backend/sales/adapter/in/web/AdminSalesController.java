package com.new_cafe.app.backend.sales.adapter.in.web;

import com.new_cafe.app.backend.order.application.port.in.GetOrderUseCase;
import com.new_cafe.app.backend.sales.application.port.in.GetSalesAnalysisUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin/sales")
@RequiredArgsConstructor
public class AdminSalesController {

    private final GetSalesAnalysisUseCase getSalesAnalysisUseCase;
    private final GetOrderUseCase getOrderUseCase;

    @GetMapping("/summary")
    public GetSalesAnalysisUseCase.SalesSummary getSummary(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return getSalesAnalysisUseCase.getSalesSummary(period, date);
    }

    @GetMapping("/orders")
    public List<GetOrderUseCase.OrderListDto> getSalesOrders(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate start = date;
        LocalDate end = date;

        if ("weekly".equalsIgnoreCase(period)) {
            start = date.minusDays(6);
        } else if ("monthly".equalsIgnoreCase(period)) {
            start = date.withDayOfMonth(1);
            end = date.withDayOfMonth(date.lengthOfMonth());
        }

        List<GetOrderUseCase.OrderListDto> allOrders = getOrderUseCase.getOrdersByRange(null, start, end);
        return allOrders.stream()
                .filter(o -> o.getStatus() != null && 
                             (o.getStatus().name().equals("COMPLETED") || o.getStatus().name().equals("PICKED_UP")))
                .toList();
    }

    @GetMapping("/menu-ranking")
    public List<GetSalesAnalysisUseCase.MenuRankingDto> getMenuRanking(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return getSalesAnalysisUseCase.getMenuRanking(period, date);
    }

    @GetMapping("/chart")
    public List<GetSalesAnalysisUseCase.SalesChartDto> getChart(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now();
        return getSalesAnalysisUseCase.getSalesChart(period, date);
    }
}
