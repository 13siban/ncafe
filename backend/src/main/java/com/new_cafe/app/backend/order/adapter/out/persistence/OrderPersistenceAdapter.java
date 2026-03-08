package com.new_cafe.app.backend.order.adapter.out.persistence;

import com.new_cafe.app.backend.order.application.port.out.OrderRepositoryPort;
import com.new_cafe.app.backend.order.domain.model.Order;
import com.new_cafe.app.backend.order.domain.model.OrderItem;
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
                .status(order.getStatus())
                .totalPrice(order.getTotalPrice())
                .rejectReason(order.getRejectReason())
                .memo(order.getMemo())
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
        return OrderItem.builder()
                .id(saved.getId())
                .orderId(saved.getOrderId())
                .menuId(saved.getMenuId())
                .menuName(saved.getMenuName())
                .quantity(saved.getQuantity())
                .unitPrice(saved.getUnitPrice())
                .optionPrice(saved.getOptionPrice())
                .subtotal(saved.getSubtotal())
                .build();
    }

    @Override
    public Optional<Order> findById(Long id) {
        return orderRepository.findById(id).map(this::mapToDomain);
    }

    @Override
    public Optional<Order> findByOrderDateAndOrderNumber(LocalDate orderDate, Integer orderNumber) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getOrderDate().equals(orderDate) && o.getOrderNumber().equals(orderNumber))
                .findFirst()
                .map(this::mapToDomain);
    }

    @Override
    public List<Order> findByUserId(String userId) {
        return orderRepository.findAll().stream()
                .filter(o -> userId.equals(o.getUserId()))
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
        return orderRepository.findAll().stream()
                .filter(o -> o.getOrderDate().equals(orderDate))
                .mapToInt(OrderJpaEntity::getOrderNumber)
                .max()
                .orElse(0) + 1;
    }

    private Order mapToDomain(OrderJpaEntity entity) {
        return Order.builder()
                .id(entity.getId())
                .orderDate(entity.getOrderDate())
                .orderNumber(entity.getOrderNumber())
                .userId(entity.getUserId())
                .customerName(entity.getCustomerName())
                .status(entity.getStatus())
                .totalPrice(entity.getTotalPrice())
                .rejectReason(entity.getRejectReason())
                .memo(entity.getMemo())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
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
