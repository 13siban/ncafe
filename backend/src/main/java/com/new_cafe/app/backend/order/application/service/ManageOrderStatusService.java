package com.new_cafe.app.backend.order.application.service;

import com.new_cafe.app.backend.order.application.port.in.ManageOrderStatusUseCase;
import com.new_cafe.app.backend.order.application.port.out.OrderRepositoryPort;
import com.new_cafe.app.backend.order.domain.model.Order;
import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import com.new_cafe.app.backend.sales.adapter.out.persistence.DailyMenuSalesJpaEntity;
import com.new_cafe.app.backend.sales.adapter.out.persistence.DailyMenuSalesJpaRepository;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaEntity;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaRepository;
import com.new_cafe.app.backend.category.adapter.out.persistence.CategoryJpaRepository;
import com.new_cafe.app.backend.payment.PaymentVerificationService;
import com.new_cafe.app.backend.auth.application.port.in.ManageUserPointUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ManageOrderStatusService implements ManageOrderStatusUseCase {

    private final OrderRepositoryPort orderRepository;
    private final DailyMenuSalesJpaRepository dailyMenuSalesRepository;
    private final AdminMenuJpaRepository menuRepository;
    private final CategoryJpaRepository categoryRepository;
    private final PaymentVerificationService paymentVerificationService;
    private final ManageUserPointUseCase userPointUseCase;

    @Override
    public void changeOrderStatus(Long id, String statusStr) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Order not found"));
        OrderStatus previousStatus = order.getStatus();
        OrderStatus newStatus = OrderStatus.valueOf(statusStr.toUpperCase());

        order.changeStatus(newStatus);
        orderRepository.save(order);

        // 결제 취소 처리: CANCELLED 상태로 변경될 때
        if (newStatus == OrderStatus.CANCELLED) {
            handleCancellation(order);
        }

        // 완료 상태로 전환 시 일일 매출 집계
        boolean isNowFinal = (newStatus == OrderStatus.COMPLETED || newStatus == OrderStatus.PICKED_UP);
        boolean wasNotFinal = (previousStatus != OrderStatus.COMPLETED && previousStatus != OrderStatus.PICKED_UP);
        
        if (isNowFinal && wasNotFinal) {
            aggregateDailySales(order);
        }
    }

    @Override
    public void rejectOrder(Long id, String reason) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        order.reject(reason);
        orderRepository.save(order);

        // 결제 취소 처리: 주문 거절 시 자동 환불
        if (order.getPaymentId() != null) {
            paymentVerificationService.cancelPayment(order.getPaymentId(), "주문 거절: " + reason);
        }
        handlePointRefund(order);
    }

    private void handleCancellation(Order order) {
        if (order.getPaymentId() != null) {
            paymentVerificationService.cancelPayment(order.getPaymentId(), "고객 또는 관리자에 의한 주문 취소");
        }
        handlePointRefund(order);
    }

    private void handlePointRefund(Order order) {
        if (order.getUserId() == null) return;
        if (order.getUsedPoints() != null && order.getUsedPoints() > 0) {
            userPointUseCase.cancelPoints(order.getUserId(), order.getId().toString(), order.getUsedPoints(), "주문 취소/거절 환급");
        }
        if (order.getEarnPoints() != null && order.getEarnPoints() > 0) {
            userPointUseCase.usePoints(order.getUserId(), order.getId().toString(), order.getEarnPoints(), "주문 취소/거절 적립 회수");
        }
    }

    private void aggregateDailySales(Order order) {
        List<com.new_cafe.app.backend.order.domain.model.OrderItem> items = orderRepository.findItemsByOrderId(order.getId());

        for (com.new_cafe.app.backend.order.domain.model.OrderItem item : items) {
            DailyMenuSalesJpaEntity salesEntity = dailyMenuSalesRepository.findAll().stream()
                    .filter(s -> s.getSaleDate().equals(order.getOrderDate()) && s.getMenuId().equals(item.getMenuId()))
                    .findFirst()
                    .orElseGet(() -> {
                        AdminMenuJpaEntity menu = menuRepository.findById(item.getMenuId()).orElse(null);
                        String categoryName = "기타";
                        if (menu != null && menu.getCategoryId() != null) {
                            categoryName = categoryRepository.findById(menu.getCategoryId())
                                    .map(c -> c.getName())
                                    .orElse("기타");
                        }
                        return DailyMenuSalesJpaEntity.builder()
                                .saleDate(order.getOrderDate())
                                .menuId(item.getMenuId())
                                .menuName(item.getMenuName())
                                .categoryName(categoryName)
                                .quantitySold(0)
                                .totalSales(0)
                                .build();
                    });
            
            salesEntity.addSales(item.getQuantity(), item.getSubtotal());
            dailyMenuSalesRepository.save(salesEntity);
        }
    }
}
