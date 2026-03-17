package com.new_cafe.app.backend.order.application.service;

import com.new_cafe.app.backend.menu.application.port.out.MenuImageRepositoryPort;
import com.new_cafe.app.backend.menu.application.port.out.MenuRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.Menu;
import com.new_cafe.app.backend.menu.domain.model.MenuImage;
import com.new_cafe.app.backend.order.application.port.in.CreateOrderUseCase;
import com.new_cafe.app.backend.order.application.port.in.GetOrderUseCase;
import com.new_cafe.app.backend.order.application.port.out.OrderRepositoryPort;
import com.new_cafe.app.backend.order.domain.model.Order;
import com.new_cafe.app.backend.order.domain.model.OrderItem;
import com.new_cafe.app.backend.order.domain.model.OrderOptionSelection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
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

    private final OrderRepositoryPort orderRepository;
    private final MenuRepositoryPort menuRepository;
    private final MenuImageRepositoryPort menuImageRepositoryPort;

    @Override
    public OrderDto getOrder(LocalDate date, Integer number) {
        Order order = orderRepository.findByOrderDateAndOrderNumber(date, number)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        return mapToDto(order);
    }

    @Override
    public OrderDto getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        return mapToDto(order);
    }

    @Override
    public List<OrderListDto> getMyOrders(String userId) {
        if (userId == null) {
            return List.of();
        }
        return orderRepository.findByUserId(userId).stream()
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderListDto> getAllOrders(String status, LocalDate date) {
        return orderRepository.findByStatusAndOrderDate(status, date).stream()
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderListDto> getOrdersByRange(String status, LocalDate start, LocalDate end) {
        List<Order> orders;
        if (start != null && end != null) {
            orders = orderRepository.findByOrderDateBetween(start, end);
        } else {
            orders = orderRepository.findAll();
        }
        return orders.stream()
                .filter(o -> (status == null || o.getStatus().name().equalsIgnoreCase(status)))
                .map(this::mapToListDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderListDto> getOrdersByKeys(List<OrderKey> keys) {
        if (keys == null || keys.isEmpty()) {
            return List.of();
        }
        List<OrderListDto> result = new ArrayList<>();
        for (OrderKey key : keys) {
            if (key != null && key.getDate() != null && key.getNumber() != null) {
                orderRepository.findByOrderDateAndOrderNumber(LocalDate.parse(key.getDate()), key.getNumber())
                        .map(this::mapToListDto)
                        .ifPresent(result::add);
            }
        }
        return result;
    }

    @Override
    public List<TopMenuDto> getTopMenus(String userId, int limit) {
        if (userId == null) {
            return List.of();
        }
        // This still uses the JPA projection query via the adapter
        // For now, delegate to the repository directly for this specialized query
        return orderRepository.findByUserId(userId).stream()
                .flatMap(o -> orderRepository.findItemsByOrderId(o.getId()).stream())
                .collect(Collectors.groupingBy(OrderItem::getMenuId,
                        Collectors.summingLong(OrderItem::getQuantity)))
                .entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                .limit(limit)
                .map(entry -> {
                    Long menuId = entry.getKey();
                    Long totalQuantity = entry.getValue();
                    String menuName = "Unknown";
                    String engName = null;
                    String imageUrl = "placeholder.jpg";
                    
                    try {
                        Menu menu = menuRepository.findById(menuId);
                        if (menu != null) {
                            menuName = menu.getKorName();
                            engName = menu.getEngName();
                            List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(menuId);
                            if (!images.isEmpty()) {
                                imageUrl = images.get(0).getSrcUrl();
                            } else if (engName != null && !engName.trim().isEmpty()) {
                                imageUrl = engName.toLowerCase().replaceAll("\\s+", "") + ".png";
                            } else {
                                imageUrl = "blank.png";
                            }
                        }
                    } catch (Exception ignored) {}
                    
                    return TopMenuDto.builder()
                            .menuId(menuId)
                            .menuName(menuName)
                            .engName(engName)
                            .imageUrl(imageUrl)
                            .totalQuantity(totalQuantity)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private OrderDto mapToDto(Order order) {
        List<OrderItem> items = orderRepository.findItemsByOrderId(order.getId());

        List<CreateOrderUseCase.OrderItemResponse> itemResponses = new ArrayList<>();
        for (OrderItem item : items) {
            List<OrderOptionSelection> options = orderRepository.findOptionsByOrderItemId(item.getId());

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
                .userId(order.getUserId())
                .orderDate(order.getOrderDate().toString())
                .orderNumber(order.getOrderNumber())
                .displayNumber("#" + order.getOrderNumber())
                .orderType(order.getOrderType())
                .customerName(order.getCustomerName())
                .status(order.getStatus())
                .totalPrice(order.getTotalPrice())
                .memo(order.getMemo())
                .rejectReason(order.getRejectReason())
                .paymentId(order.getPaymentId())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .usedPoints(order.getUsedPoints())
                .earnPoints(order.getEarnPoints())
                .createdAt(order.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .items(itemResponses)
                .build();
    }

    private OrderListDto mapToListDto(Order order) {
        List<OrderItem> items = orderRepository.findItemsByOrderId(order.getId());

        String summary = "";
        if (!items.isEmpty()) {
            summary = items.get(0).getMenuName();
            if (items.size() > 1) {
                summary += " 외 " + (items.size() - 1) + "건";
            }
        }

        return OrderListDto.builder()
                .id(order.getId())
                .orderDate(order.getOrderDate().toString())
                .orderNumber(order.getOrderNumber())
                .displayNumber("#" + order.getOrderNumber())
                .orderType(order.getOrderType())
                .customerName(order.getCustomerName())
                .isGuest(order.getUserId() == null)
                .status(order.getStatus())
                .summary(summary)
                .totalPrice(order.getTotalPrice())
                .usedPoints(order.getUsedPoints())
                .earnPoints(order.getEarnPoints())
                .createdAt(order.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .build();
    }
}
