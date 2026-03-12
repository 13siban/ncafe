package com.new_cafe.app.backend.order.application.service;

import com.new_cafe.app.backend.order.adapter.out.persistence.OrderItemJpaEntity;
import com.new_cafe.app.backend.order.adapter.out.persistence.OrderItemJpaRepository;
import com.new_cafe.app.backend.order.adapter.out.persistence.OrderJpaEntity;
import com.new_cafe.app.backend.order.adapter.out.persistence.OrderJpaRepository;
import com.new_cafe.app.backend.order.adapter.out.persistence.OrderOptionSelectionJpaEntity;
import com.new_cafe.app.backend.order.adapter.out.persistence.OrderOptionSelectionJpaRepository;
import com.new_cafe.app.backend.order.application.port.in.CreateOrderUseCase;
import com.new_cafe.app.backend.order.application.port.in.GetOrderUseCase;
import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetOrderService implements GetOrderUseCase {

    private final OrderJpaRepository orderRepository;
    private final OrderItemJpaRepository orderItemRepository;
    private final OrderOptionSelectionJpaRepository orderOptionRepository;

    @Override
    public OrderDto getOrder(LocalDate date, Integer number) {
        OrderJpaEntity order = orderRepository.findAll().stream()
                .filter(o -> o.getOrderDate().equals(date) && o.getOrderNumber().equals(number))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        return mapToDto(order);
    }

    @Override
    public OrderDto getOrderById(Long id) {
        OrderJpaEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        return mapToDto(order);
    }

    @Override
    public List<OrderListDto> getMyOrders(String userId) {
        if (userId == null) {
            return List.of();
        }
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(o -> userId.equals(o.getUserId()))
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderListDto> getAllOrders(String status, LocalDate date) {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(o -> (status == null || o.getStatus().name().equalsIgnoreCase(status)))
                .filter(o -> (date == null || o.getOrderDate().equals(date)))
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderListDto> getOrdersByRange(String status, LocalDate start, LocalDate end) {
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(o -> (status == null || o.getStatus().name().equalsIgnoreCase(status)))
                .filter(o -> (start == null || !o.getOrderDate().isBefore(start)))
                .filter(o -> (end == null || !o.getOrderDate().isAfter(end)))
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderListDto> getOrdersByKeys(List<OrderKey> keys) {
        if (keys == null || keys.isEmpty()) {
            return List.of();
        }
        return orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .filter(o -> keys.stream().anyMatch(k -> 
                    k != null && 
                    k.getDate() != null && 
                    k.getNumber() != null &&
                    LocalDate.parse(k.getDate()).equals(o.getOrderDate()) && 
                    k.getNumber().equals(o.getOrderNumber())
                ))
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    private OrderDto mapToDto(OrderJpaEntity order) {
        List<OrderItemJpaEntity> items = orderItemRepository.findAll().stream()
                .filter(i -> i.getOrderId().equals(order.getId()))
                .collect(Collectors.toList());

        List<CreateOrderUseCase.OrderItemResponse> itemResponses = new ArrayList<>();
        for (OrderItemJpaEntity item : items) {
            List<OrderOptionSelectionJpaEntity> options = orderOptionRepository.findAll().stream()
                    .filter(opt -> opt.getOrderItemId().equals(item.getId()))
                    .collect(Collectors.toList());

            List<CreateOrderUseCase.OrderOptionResponse> optionResponses = options.stream()
                    .map(opt -> CreateOrderUseCase.OrderOptionResponse.builder()
                            .groupName(opt.getOptionGroupName())
                            .itemName(opt.getOptionItemName())
                            .priceDelta(opt.getPriceDelta())
                            .build())
                    .collect(Collectors.toList());

            itemResponses.add(CreateOrderUseCase.OrderItemResponse.builder()
                    .menuName(item.getMenuName())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .optionPrice(item.getOptionPrice())
                    .subtotal(item.getSubtotal())
                    .options(optionResponses)
                    .build());
        }

        return OrderDto.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate().toString())
                .orderNumber(order.getOrderNumber())
                .displayNumber("#" + order.getOrderNumber())
                .customerName(order.getCustomerName())
                .status(order.getStatus())
                .totalPrice(order.getTotalPrice())
                .memo(order.getMemo())
                .rejectReason(order.getRejectReason())
                .paymentId(order.getPaymentId())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .createdAt(order.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .items(itemResponses)
                .build();
    }

    private OrderListDto mapToListDto(OrderJpaEntity order) {
        List<OrderItemJpaEntity> items = orderItemRepository.findAll().stream()
                .filter(i -> i.getOrderId().equals(order.getId()))
                .collect(Collectors.toList());

        String summary = "";
        if (!items.isEmpty()) {
            OrderItemJpaEntity firstItem = items.get(0);
            summary = firstItem.getMenuName();
            if (items.size() > 1) {
                summary += " 외 " + (items.size() - 1) + "건";
            }
        }

        return OrderListDto.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate().toString())
                .orderNumber(order.getOrderNumber())
                .displayNumber("#" + order.getOrderNumber())
                .customerName(order.getCustomerName())
                .isGuest(order.getUserId() == null)
                .status(order.getStatus())
                .summary(summary)
                .totalPrice(order.getTotalPrice())
                .createdAt(order.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .build();
    }
}
