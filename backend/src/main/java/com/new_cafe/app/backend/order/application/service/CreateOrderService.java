package com.new_cafe.app.backend.order.application.service;

import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaEntity;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaRepository;
import com.new_cafe.app.backend.auth.application.port.out.LoadUserPort;
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
import com.new_cafe.app.backend.payment.PaymentVerificationService;
import com.new_cafe.app.backend.store.application.port.in.GetStoreSettingsUseCase;
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

    private final GetStoreSettingsUseCase getStoreSettingsUseCase;
    private final OrderRepositoryPort orderRepository;
    private final OrderOptionRepositoryPort orderOptionRepository;
    private final LoadUserPort loadUserPort;
    
    private final AdminMenuJpaRepository menuRepository;
    private final OptionGroupJpaRepository optionGroupRepository;
    private final OptionItemJpaRepository optionItemRepository;

    private final PaymentVerificationService paymentVerificationService;

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderCommand command, String userId) {
        if (!getStoreSettingsUseCase.isStoreOpen()) {
            throw new IllegalStateException("Store is closed");
        }

        LocalDate today = LocalDate.now();
        Integer nextOrderNumber = orderRepository.getNextOrderNumber(today);

        String actualCustomerName = "비회원";

        if (userId != null) {
            actualCustomerName = loadUserPort.loadUser(userId)
                    .map(u -> u.getNickname() != null ? u.getNickname() : u.getUsername())
                    .orElseGet(() -> command.getCustomerName() != null && !command.getCustomerName().isBlank() ? command.getCustomerName() : "회원");
        } else {
            actualCustomerName = command.getCustomerName() != null && !command.getCustomerName().isBlank() ? command.getCustomerName() : "비회원";
        }

        List<OrderItem> savedItems = new ArrayList<>();
        List<OrderItemResponse> itemResponses = new ArrayList<>();
        int totalOrderPrice = 0;

        // --- 1단계: 주문 금액 사전 계산 (결제 검증용) ---
        for (OrderItemCommand itemCommand : command.getItems()) {
            AdminMenuJpaEntity menu = menuRepository.findById(itemCommand.getMenuId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid menu ID"));
            int optionPriceSum = 0;
            if (itemCommand.getSelectedOptions() != null) {
                for (OrderOptionCommand optCmd : itemCommand.getSelectedOptions()) {
                    OptionItemJpaEntity item = optionItemRepository.findById(optCmd.getOptionItemId()).orElseThrow();
                    optionPriceSum += item.getPriceDelta();
                }
            }
            totalOrderPrice += (menu.getPrice() + optionPriceSum) * itemCommand.getQuantity();
        }

        // --- 2단계: 결제 검증 (실제 결제 수단 선택 시 필수) ---
        String paymentStatus = "NONE";
        if (command.getPaymentMethod() != null && !command.getPaymentMethod().isBlank()) {
            if (command.getPaymentId() == null || command.getPaymentId().isBlank()) {
                throw new IllegalArgumentException("실제 결제 수단 사용 시 결제 ID(Payment ID)가 필수입니다.");
            }
            paymentVerificationService.verifyPayment(command.getPaymentId(), totalOrderPrice);
            paymentStatus = "PAID";
        } else {
            paymentStatus = "TEST"; // 테스트 주문임을 표시
        }

        Order order = Order.builder()
                .orderDate(today)
                .orderNumber(nextOrderNumber)
                .userId(userId)
                .customerName(actualCustomerName)
                .status(OrderStatus.PREPARING)
                .memo(command.getMemo())
                .paymentId(command.getPaymentId())
                .paymentMethod(command.getPaymentMethod())
                .paymentStatus(paymentStatus)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .totalPrice(totalOrderPrice)
                .build();

        Order savedOrder = orderRepository.save(order);

        // --- 3단계: 주문 아이템 및 옵션 저장 ---
        for (OrderItemCommand itemCommand : command.getItems()) {
            AdminMenuJpaEntity menu = menuRepository.findById(itemCommand.getMenuId()).orElseThrow();
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

        return OrderResponse.builder()
                .orderDate(savedOrder.getOrderDate().toString())
                .orderNumber(savedOrder.getOrderNumber())
                .displayNumber("#" + savedOrder.getOrderNumber())
                .status(savedOrder.getStatus())
                .customerName(savedOrder.getCustomerName())
                .totalPrice(savedOrder.getTotalPrice())
                .createdAt(savedOrder.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .items(itemResponses)
                .build();
    }
}
