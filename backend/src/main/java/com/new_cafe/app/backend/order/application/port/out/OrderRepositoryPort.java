package com.new_cafe.app.backend.order.application.port.out;

import com.new_cafe.app.backend.order.domain.model.Order;
import com.new_cafe.app.backend.order.domain.model.OrderItem;
import com.new_cafe.app.backend.order.domain.model.OrderOptionSelection;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OrderRepositoryPort {
    Order save(Order order);
    OrderItem saveItem(OrderItem item);
    Optional<Order> findById(Long id);
    Optional<Order> findByOrderDateAndOrderNumber(LocalDate orderDate, Integer orderNumber);
    List<Order> findByUserId(String userId);
    List<Order> findAll();
    Integer getNextOrderNumber(LocalDate orderDate);
    
    // 아이템/옵션 조회
    List<OrderItem> findItemsByOrderId(Long orderId);
    List<OrderOptionSelection> findOptionsByOrderItemId(Long orderItemId);
    
    long countByOrderDate(LocalDate orderDate);
    long countByOrderDateAndStatus(LocalDate orderDate, com.new_cafe.app.backend.order.domain.model.OrderStatus status);
    long sumTotalPriceByOrderDateAndStatusCompleted(LocalDate date);
    long countDistinctUserIdsByOrderDate(LocalDate date);
    long countGuestOrdersByOrderDate(LocalDate date);
    List<Order> findByOrderDateOrderByCreatedAtDesc(LocalDate date);
    List<Order> findByOrderDateBetween(LocalDate start, LocalDate end);
    List<Order> findByStatusAndOrderDate(String status, LocalDate date);
}
