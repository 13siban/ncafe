package com.new_cafe.app.backend.order.adapter.out.persistence;

import com.new_cafe.app.backend.order.application.port.out.OrderRepositoryPort;
import com.new_cafe.app.backend.order.domain.model.Order;
import com.new_cafe.app.backend.order.domain.model.OrderItem;
import com.new_cafe.app.backend.order.domain.model.OrderOptionSelection;
import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import com.new_cafe.app.backend.order.application.port.out.OrderOptionRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OrderPersistenceAdapter implements OrderRepositoryPort, OrderOptionRepositoryPort {

    private final OrderJpaRepository orderRepository;
    private final OrderItemJpaRepository orderItemRepository;
    private final OrderOptionSelectionJpaRepository orderOptionRepository;

    @Override
    public Order save(Order order) {
        OrderJpaEntity orderEntity = OrderJpaEntity.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .customerName(order.getCustomerName())
                .orderType(order.getOrderType())
                .status(order.getStatus())
                .totalPrice(order.getTotalPrice())
                .usedPoints(order.getUsedPoints())
                .earnPoints(order.getEarnPoints())
                .rejectReason(order.getRejectReason())
                .memo(order.getMemo())
                .paymentId(order.getPaymentId())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();

        OrderJpaEntity savedOrder = orderRepository.save(orderEntity);
        return mapToDomain(savedOrder);
    }

    @Override
    public OrderItem saveItem(OrderItem item) {
        OrderItemJpaEntity itemEntity = OrderItemJpaEntity.builder()
                .id(item.getId())
                .orderId(item.getOrderId())
                .menuId(item.getMenuId())
                .menuName(item.getMenuName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .optionPrice(item.getOptionPrice())
                .subtotal(item.getSubtotal())
                .build();

        OrderItemJpaEntity saved = orderItemRepository.save(itemEntity);
        return mapItemToDomain(saved);
    }

    @Override
    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id).map(this::mapToDomain);
    }

    @Override
    public Optional<Order> findByOrderDateAndOrderNumber(LocalDate orderDate, Integer orderNumber) {
        return orderRepository.findByOrderDateAndOrderNumber(orderDate, orderNumber)
                .map(this::mapToDomain);
    }

    @Override
    public List<Order> findByUserId(String userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findAll() {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Integer getNextOrderNumber(LocalDate orderDate) {
        return (int) orderRepository.countByOrderDate(orderDate) + 1;
    }

    @Override
    public List<OrderItem> findItemsByOrderId(Long orderId) {
        return orderItemRepository.findByOrderId(orderId).stream()
                .map(this::mapItemToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderOptionSelection> findOptionsByOrderItemId(Long orderItemId) {
        return orderOptionRepository.findByOrderItemId(orderItemId).stream()
                .map(this::mapOptionToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public long countByOrderDate(LocalDate orderDate) {
        return orderRepository.countByOrderDate(orderDate);
    }

    @Override
    public long countByOrderDateAndStatus(LocalDate orderDate, OrderStatus status) {
        return orderRepository.countByOrderDateAndStatus(orderDate, status);
    }

    @Override
    public long sumTotalPriceByOrderDateAndStatusCompleted(LocalDate date) {
        return orderRepository.sumTotalPriceByOrderDateAndStatusCompleted(date);
    }

    @Override
    public long countDistinctUserIdsByOrderDate(LocalDate date) {
        return orderRepository.countDistinctUserIdsByOrderDate(date);
    }

    @Override
    public long countGuestOrdersByOrderDate(LocalDate date) {
        return orderRepository.countGuestOrdersByOrderDate(date);
    }

    @Override
    public List<Order> findByOrderDateOrderByCreatedAtDesc(LocalDate date) {
        return orderRepository.findByOrderDateOrderByCreatedAtDesc(date).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByOrderDateBetween(LocalDate start, LocalDate end) {
        return orderRepository.findByOrderDateBetween(start, end).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Order> findByStatusAndOrderDate(String status, LocalDate date) {
        return findAll().stream()
                .filter(o -> (status == null || o.getStatus().name().equalsIgnoreCase(status)))
                .filter(o -> (date == null || o.getOrderDate().equals(date)))
                .collect(Collectors.toList());
    }

    private Order mapToDomain(OrderJpaEntity entity) {
        return Order.builder()
                .id(entity.getId())
                .orderDate(entity.getOrderDate())
                .orderNumber(entity.getOrderNumber())
                .userId(entity.getUserId())
                .customerName(entity.getCustomerName())
                .orderType(entity.getOrderType())
                .status(entity.getStatus())
                .totalPrice(entity.getTotalPrice())
                .usedPoints(entity.getUsedPoints())
                .earnPoints(entity.getEarnPoints())
                .rejectReason(entity.getRejectReason())
                .memo(entity.getMemo())
                .paymentId(entity.getPaymentId())
                .paymentMethod(entity.getPaymentMethod())
                .paymentStatus(entity.getPaymentStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private OrderItem mapItemToDomain(OrderItemJpaEntity entity) {
        return OrderItem.builder()
                .id(entity.getId())
                .orderId(entity.getOrderId())
                .menuId(entity.getMenuId())
                .menuName(entity.getMenuName())
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .optionPrice(entity.getOptionPrice())
                .subtotal(entity.getSubtotal())
                .build();
    }

    private OrderOptionSelection mapOptionToDomain(OrderOptionSelectionJpaEntity entity) {
        return OrderOptionSelection.builder()
                .id(entity.getId())
                .orderItemId(entity.getOrderItemId())
                .optionGroupName(entity.getOptionGroupName())
                .optionItemName(entity.getOptionItemName())
                .priceDelta(entity.getPriceDelta())
                .build();
    }

    @Override
    public void saveSelections(Long orderItemId, List<OptionSelectionData> selections) {
        for (OptionSelectionData selection : selections) {
            OrderOptionSelectionJpaEntity entity = OrderOptionSelectionJpaEntity.builder()
                    .orderItemId(orderItemId)
                    .optionGroupName(selection.optionGroupName())
                    .optionItemName(selection.optionItemName())
                    .priceDelta(selection.priceDelta())
                    .build();
            orderOptionRepository.save(entity);
        }
    }
}
