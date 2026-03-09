package com.new_cafe.app.backend.sales.adapter.in.web;

import com.new_cafe.app.backend.order.application.port.in.GetOrderUseCase;
import com.new_cafe.app.backend.sales.application.port.in.GetDashboardStatsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final GetDashboardStatsUseCase getDashboardStatsUseCase;
    private final GetOrderUseCase getOrderUseCase;

    @GetMapping("/stats")
    public GetDashboardStatsUseCase.DashboardStats getStats(@RequestParam(defaultValue = "daily") String period) {
        return getDashboardStatsUseCase.getDashboardStats(period);
    }

    @GetMapping("/recent-orders")
    public List<GetOrderUseCase.OrderListDto> getRecentOrders() {
        // Just Use existing GetOrderUseCase to get today's orders or all orders and limit to 5
        return getOrderUseCase.getAllOrders(null, LocalDate.now()).stream()
                .limit(5)
                .collect(Collectors.toList());
    }
}
