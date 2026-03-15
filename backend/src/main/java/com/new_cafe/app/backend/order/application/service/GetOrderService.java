package com.new_cafe.app.backend.order.application.service;

import com.new_cafe.app.backend.menu.adapter.out.persistence.MenuJpaRepository;
import com.new_cafe.app.backend.menu.application.port.out.MenuImageRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.MenuImage;
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
import org.springframework.data.domain.PageRequest;
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
    private final MenuJpaRepository menuRepository;
    private final MenuImageRepositoryPort menuImageRepositoryPort;

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

    @Override
    public List<TopMenuDto> getTopMenus(String userId, int limit) {
        if (userId == null) {
            return List.of();
        }
        return orderRepository.findTopMenusByUserId(userId, PageRequest.of(0, limit))
                .stream()
                .map(proj -> {
                    String engName = null;
                    String imageUrl = "placeholder.jpg";
                    var optMenu = menuRepository.findById(proj.getMenuId());
                    if (optMenu.isPresent()) {
                        engName = optMenu.get().getEngName();
                        // menu_images 테이블 우선 조회 (GetMenuListService와 동일 로직)
                        List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(proj.getMenuId());
                        if (!images.isEmpty()) {
                            imageUrl = images.get(0).getSrcUrl();
                        } else if (engName != null && !engName.trim().isEmpty()) {
                            imageUrl = engName.toLowerCase().replaceAll("\\s+", "") + ".png";
                        } else {
                            imageUrl = "blank.png";
                        }
                    }
                    
                    return TopMenuDto.builder()
                            .menuId(proj.getMenuId())
                            .menuName(proj.getMenuName())
                            .engName(engName)
                            .imageUrl(imageUrl)
                            .totalQuantity(proj.getTotalQuantity())
                            .build();
                })
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
