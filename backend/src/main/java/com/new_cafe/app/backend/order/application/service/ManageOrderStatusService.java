package com.new_cafe.app.backend.order.application.service;

import com.new_cafe.app.backend.order.adapter.out.persistence.OrderItemJpaEntity;
import com.new_cafe.app.backend.order.adapter.out.persistence.OrderItemJpaRepository;
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
    private final OrderItemJpaRepository orderItemRepository; 
    private final DailyMenuSalesJpaRepository dailyMenuSalesRepository;
    private final AdminMenuJpaRepository menuRepository;
    private final CategoryJpaRepository categoryRepository;
    private final PaymentVerificationService paymentVerificationService;

    @Override
    public void changeOrderStatus(Long id, String statusStr) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Order not found"));
        OrderStatus newStatus = OrderStatus.valueOf(statusStr.toUpperCase());

        Order updatedOrder = Order.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .customerName(order.getCustomerName())
                .status(newStatus)
                .totalPrice(order.getTotalPrice())
                .rejectReason(order.getRejectReason())
                .memo(order.getMemo())
                .paymentId(order.getPaymentId())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();

        orderRepository.save(updatedOrder);

        // 결제 취소 처리: CANCELLED 상태로 변경될 때 (주문자 취소 등)
        if (newStatus == OrderStatus.CANCELLED && order.getPaymentId() != null) {
            paymentVerificationService.cancelPayment(order.getPaymentId(), "고객 또는 관리자에 의한 주문 취소");
        }

        // When status moves to COMPLETED or PICKED_UP from a non-final state, aggregate daily sales
        boolean isNowFinal = (newStatus == OrderStatus.COMPLETED || newStatus == OrderStatus.PICKED_UP);
        boolean wasNotFinal = (order.getStatus() != OrderStatus.COMPLETED && order.getStatus() != OrderStatus.PICKED_UP);
        
        if (isNowFinal && wasNotFinal) {
            aggregateDailySales(order);
        }
    }

    @Override
    public void rejectOrder(Long id, String reason) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        Order updatedOrder = Order.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .customerName(order.getCustomerName())
                .status(OrderStatus.REJECTED)
                .totalPrice(order.getTotalPrice())
                .rejectReason(reason) // required
                .memo(order.getMemo())
                .paymentId(order.getPaymentId())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();

        orderRepository.save(updatedOrder);

        // 결제 취소 처리: 주문 거절 시 자동 환불
        if (order.getPaymentId() != null) {
            paymentVerificationService.cancelPayment(order.getPaymentId(), "주문 거절: " + reason);
        }
    }

    private void aggregateDailySales(Order order) {
        List<OrderItemJpaEntity> items = orderItemRepository.findAll().stream()
                .filter(i -> i.getOrderId().equals(order.getId()))
                .collect(Collectors.toList());

        for (OrderItemJpaEntity item : items) {
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
