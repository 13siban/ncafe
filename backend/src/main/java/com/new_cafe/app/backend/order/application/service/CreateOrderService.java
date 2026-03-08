package com.new_cafe.app.backend.order.application.service;

import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaEntity;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaRepository;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionGroupJpaEntity;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionGroupJpaRepository;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionItemJpaEntity;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionItemJpaRepository;
import com.new_cafe.app.backend.order.application.port.in.CreateOrderUseCase;
import com.new_cafe.app.backend.order.application.port.out.OrderOptionRepositoryPort;
import com.new_cafe.app.backend.order.application.port.out.OrderRepositoryPort;
import com.new_cafe.app.backend.order.domain.model.Order;
import com.new_cafe.app.backend.order.domain.model.OrderItem;
import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import com.new_cafe.app.backend.store.application.port.out.StoreSettingsRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CreateOrderService implements CreateOrderUseCase {

    private final StoreSettingsRepositoryPort storeSettingsRepository;
    private final OrderRepositoryPort orderRepository;
    private final OrderOptionRepositoryPort orderOptionRepository;
    
    private final AdminMenuJpaRepository menuRepository;
    private final OptionGroupJpaRepository optionGroupRepository;
    private final OptionItemJpaRepository optionItemRepository;

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderCommand command, String userId) {
        if (!storeSettingsRepository.getStoreSettings().getIsOpen()) {
            throw new IllegalStateException("Store is closed");
        }

        LocalDate today = LocalDate.now();
        Integer nextOrderNumber = orderRepository.getNextOrderNumber(today);

        String actualCustomerName = userId != null ? command.getCustomerName() : "비회원";
        if (userId != null && (actualCustomerName == null || actualCustomerName.isBlank())) {
            actualCustomerName = "회원"; // Fallback
        }

        List<OrderItem> savedItems = new ArrayList<>();
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        int totalOrderPrice = 0;

        Order order = Order.builder()
                .orderDate(today)
                .orderNumber(nextOrderNumber)
                .userId(userId)
                .customerName(actualCustomerName)
                .status(OrderStatus.PREPARING)
                .memo(command.getMemo())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .totalPrice(0) // Will update
                .build();

        Order savedOrder = orderRepository.save(order);

        for (OrderItemCommand itemCommand : command.getItems()) {
            AdminMenuJpaEntity menu = menuRepository.findById(itemCommand.getMenuId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid menu ID"));

            int optionPriceSum = 0;
            List<OrderOptionResponse> optionResponses = new ArrayList<>();
            List<OrderOptionRepositoryPort.OptionSelectionData> optionDatas = new ArrayList<>();

            if (itemCommand.getSelectedOptions() != null) {
                for (OrderOptionCommand optCmd : itemCommand.getSelectedOptions()) {
                    OptionGroupJpaEntity group = optionGroupRepository.findById(optCmd.getOptionGroupId()).orElseThrow();
                    OptionItemJpaEntity item = optionItemRepository.findById(optCmd.getOptionItemId()).orElseThrow();

                    optionPriceSum += item.getPriceDelta();
                    optionResponses.add(OrderOptionResponse.builder()
                            .groupName(group.getName())
                            .itemName(item.getName())
                            .priceDelta(item.getPriceDelta())
                            .build());

                    optionDatas.add(new OrderOptionRepositoryPort.OptionSelectionData(
                            group.getName(), item.getName(), item.getPriceDelta()
                    ));
                }
            }

            int subtotal = (menu.getPrice() + optionPriceSum) * itemCommand.getQuantity();
            totalOrderPrice += subtotal;

            OrderItem orderItem = OrderItem.builder()
                    .orderId(savedOrder.getId())
                    .menuId(menu.getId())
                    .menuName(menu.getKorName())
                    .quantity(itemCommand.getQuantity())
                    .unitPrice(menu.getPrice())
                    .optionPrice(optionPriceSum)
                    .subtotal(subtotal)
                    .build();

            OrderItem savedItem = orderRepository.saveItem(orderItem);
            savedItems.add(savedItem);

            if (!optionDatas.isEmpty()) {
                orderOptionRepository.saveSelections(savedItem.getId(), optionDatas);
            }

            itemResponses.add(OrderItemResponse.builder()
                    .menuName(menu.getKorName())
                    .quantity(itemCommand.getQuantity())
                    .unitPrice(menu.getPrice())
                    .optionPrice(optionPriceSum)
                    .subtotal(subtotal)
                    .options(optionResponses)
                    .build());
        }

        Order orderToUpdate = Order.builder()
                .id(savedOrder.getId())
                .orderDate(savedOrder.getOrderDate())
                .orderNumber(savedOrder.getOrderNumber())
                .userId(savedOrder.getUserId())
                .customerName(savedOrder.getCustomerName())
                .status(savedOrder.getStatus())
                .memo(savedOrder.getMemo())
                .totalPrice(totalOrderPrice)
                .createdAt(savedOrder.getCreatedAt())
                .updatedAt(savedOrder.getUpdatedAt())
                .items(savedItems)
                .build();

        Order finalOrder = orderRepository.save(orderToUpdate); 
        
        return OrderResponse.builder()
                .orderDate(finalOrder.getOrderDate().toString())
                .orderNumber(finalOrder.getOrderNumber())
                .displayNumber("#" + finalOrder.getOrderNumber())
                .status(finalOrder.getStatus())
                .customerName(finalOrder.getCustomerName())
                .totalPrice(finalOrder.getTotalPrice())
                .createdAt(finalOrder.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .items(itemResponses)
                .build();
    }
}
