package com.new_cafe.app.backend.order.application.port.out;

import com.new_cafe.app.backend.order.domain.model.Order;

import com.new_cafe.app.backend.order.domain.model.OrderItem;

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
}
