package com.new_cafe.app.backend.order.application.service;

import com.new_cafe.app.backend.order.adapter.out.persistence.OrderItemJpaEntity;
import com.new_cafe.app.backend.order.adapter.out.persistence.OrderItemJpaRepository;
import com.new_cafe.app.backend.order.application.port.in.ManageOrderStatusUseCase;
import com.new_cafe.app.backend.order.application.port.out.OrderRepositoryPort;
import com.new_cafe.app.backend.order.domain.model.Order;
import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import com.new_cafe.app.backend.sales.adapter.out.persistence.DailyMenuSalesJpaEntity;
import com.new_cafe.app.backend.sales.adapter.out.persistence.DailyMenuSalesJpaRepository;
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
    private final OrderItemJpaRepository orderItemRepository; // Using JPA directly for read simplicity here
    private final DailyMenuSalesJpaRepository dailyMenuSalesRepository;

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
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();

        orderRepository.save(updatedOrder);

        // When status is COMPLETED, aggregate daily sales
        if (newStatus == OrderStatus.COMPLETED) {
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
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();

        orderRepository.save(updatedOrder);
    }

    private void aggregateDailySales(Order order) {
        List<OrderItemJpaEntity> items = orderItemRepository.findAll().stream()
                .filter(i -> i.getOrderId().equals(order.getId()))
                .collect(Collectors.toList());

        for (OrderItemJpaEntity item : items) {
            DailyMenuSalesJpaEntity salesEntity = dailyMenuSalesRepository.findAll().stream()
                    .filter(s -> s.getSaleDate().equals(order.getOrderDate()) && s.getMenuId().equals(item.getMenuId()))
                    .findFirst()
                    .orElseGet(() -> DailyMenuSalesJpaEntity.builder()
                            .saleDate(order.getOrderDate())
                            .menuId(item.getMenuId())
                            .menuName(item.getMenuName())
                            .categoryName(null) // we don't fetch category name here for simplicity, can be fetched if needed
                            .quantitySold(0)
                            .totalSales(0)
                            .build()
                    );
            
            salesEntity.addSales(item.getQuantity(), item.getSubtotal());
            dailyMenuSalesRepository.save(salesEntity);
        }
    }
}
