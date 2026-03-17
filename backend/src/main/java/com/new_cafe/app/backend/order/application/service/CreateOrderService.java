package com.new_cafe.app.backend.order.application.service;

import com.new_cafe.app.backend.auth.application.port.out.LoadUserPort;
import com.new_cafe.app.backend.menu.application.port.out.MenuRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.Menu;
import com.new_cafe.app.backend.menuoption.application.port.out.MenuOptionRepositoryPort;
import com.new_cafe.app.backend.menuoption.domain.model.OptionGroup;
import com.new_cafe.app.backend.menuoption.domain.model.OptionItem;
import com.new_cafe.app.backend.order.application.service.dto.OrderNotificationDto;
import com.new_cafe.app.backend.order.application.port.in.CreateOrderUseCase;
import com.new_cafe.app.backend.order.application.port.out.OrderOptionRepositoryPort;
import com.new_cafe.app.backend.order.application.port.out.OrderRepositoryPort;
import com.new_cafe.app.backend.order.domain.model.Order;
import com.new_cafe.app.backend.order.domain.model.OrderItem;
import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import com.new_cafe.app.backend.user.grade.application.service.UserGradeService;
import com.new_cafe.app.backend.user.grade.adapter.in.web.dto.UserGradeResponse;
import com.new_cafe.app.backend.payment.PaymentVerificationService;
import com.new_cafe.app.backend.store.application.port.in.GetStoreSettingsUseCase;
import com.new_cafe.app.backend.auth.application.port.in.ManageUserPointUseCase;
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

    private final MenuRepositoryPort menuRepository;
    private final MenuOptionRepositoryPort menuOptionRepository;

    private final PaymentVerificationService paymentVerificationService;
    private final UserGradeService userGradeService;
    private final ManageUserPointUseCase userPointUseCase;
    private final OrderNotificationService orderNotificationService;

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderCommand command, String userId) {
        if (!getStoreSettingsUseCase.isStoreOpen()) {
            throw new IllegalStateException("Store is closed");
        }

        LocalDate today = LocalDate.now();
        Integer nextOrderNumber = orderRepository.getNextOrderNumber(today);

        String actualCustomerName = resolveCustomerName(command, userId);

        // --- 1단계: 주문 금액 사전 계산 (결제 검증용) ---
        int originalTotalPrice = calculateTotalPrice(command);

        int usedPoints = validateAndGetUsedPoints(command, userId);
        int finalOrderPrice = Math.max(0, originalTotalPrice - usedPoints);

        // --- 2단계: 결제 검증 ---
        String paymentStatus = verifyPayment(command, finalOrderPrice);

        int earnPoints = calculateEarnPoints(userId, finalOrderPrice);

        Order order = Order.builder()
                .orderDate(today)
                .orderNumber(nextOrderNumber)
                .userId(userId)
                .customerName(actualCustomerName)
                .orderType(command.getOrderType() != null ? command.getOrderType() : com.new_cafe.app.backend.order.domain.model.OrderType.STORE)
                .status(OrderStatus.PREPARING)
                .memo(command.getMemo())
                .paymentId(command.getPaymentId())
                .paymentMethod(command.getPaymentMethod())
                .paymentStatus(paymentStatus)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .totalPrice(finalOrderPrice)
                .usedPoints(usedPoints)
                .earnPoints(earnPoints)
                .build();

        Order savedOrder = orderRepository.save(order);

        // --- 3단계: 주문 아이템 및 옵션 저장 ---
        List<OrderItemResponse> itemResponses = saveOrderItems(command, savedOrder);

        // --- 4단계: 포인트 처리 ---
        processPoints(userId, savedOrder, usedPoints, earnPoints, finalOrderPrice);

        // --- 5단계: 알림 ---
        sendNotification(savedOrder, itemResponses);

        return OrderResponse.builder()
                .orderDate(savedOrder.getOrderDate().toString())
                .orderNumber(savedOrder.getOrderNumber())
                .displayNumber("#" + savedOrder.getOrderNumber())
                .orderType(savedOrder.getOrderType())
                .status(savedOrder.getStatus())
                .customerName(savedOrder.getCustomerName())
                .totalPrice(savedOrder.getTotalPrice())
                .usedPoints(usedPoints)
                .earnPoints(earnPoints)
                .createdAt(savedOrder.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .items(itemResponses)
                .build();
    }

    private String resolveCustomerName(CreateOrderCommand command, String userId) {
        if (userId != null) {
            return loadUserPort.loadUser(userId)
                    .map(u -> u.getNickname() != null ? u.getNickname() : u.getUsername())
                    .orElseGet(() -> command.getCustomerName() != null && !command.getCustomerName().isBlank() ? command.getCustomerName() : "회원");
        }
        return command.getCustomerName() != null && !command.getCustomerName().isBlank() ? command.getCustomerName() : "비회원";
    }

    private int calculateTotalPrice(CreateOrderCommand command) {
        int total = 0;
        for (OrderItemCommand itemCommand : command.getItems()) {
            Menu menu = menuRepository.findById(itemCommand.getMenuId());
            if (menu == null) throw new IllegalArgumentException("Invalid menu ID: " + itemCommand.getMenuId());

            int optionPriceSum = calculateOptionPrice(itemCommand);
            total += (menu.getPrice() + optionPriceSum) * itemCommand.getQuantity();
        }
        return total;
    }

    private int calculateOptionPrice(OrderItemCommand itemCommand) {
        int optionPriceSum = 0;
        if (itemCommand.getSelectedOptions() != null) {
            for (OrderOptionCommand optCmd : itemCommand.getSelectedOptions()) {
                OptionGroup group = menuOptionRepository.findOptionGroupById(optCmd.getOptionGroupId());
                if (group == null || group.getItems() == null) throw new IllegalArgumentException("Invalid option group");
                OptionItem item = group.getItems().stream()
                        .filter(i -> i.getId().equals(optCmd.getOptionItemId()))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Invalid option item"));
                optionPriceSum += item.getPriceDelta();
            }
        }
        return optionPriceSum;
    }

    private int validateAndGetUsedPoints(CreateOrderCommand command, String userId) {
        int usedPoints = (command.getUsePoints() != null && command.getUsePoints() > 0) ? command.getUsePoints() : 0;
        if (userId != null && usedPoints > 0) {
            int currentBalance = userPointUseCase.getPointBalance(userId);
            if (currentBalance < usedPoints) {
                throw new IllegalArgumentException("사용 가능한 포인트가 부족합니다.");
            }
        } else if (userId == null && usedPoints > 0) {
            throw new IllegalArgumentException("포인트 결제는 회원만 가능합니다.");
        }
        return usedPoints;
    }

    private String verifyPayment(CreateOrderCommand command, int finalOrderPrice) {
        if (command.getPaymentMethod() != null && !command.getPaymentMethod().isBlank()) {
            if (command.getPaymentId() == null || command.getPaymentId().isBlank()) {
                throw new IllegalArgumentException("실제 결제 수단 사용 시 결제 ID(Payment ID)가 필수입니다.");
            }
            paymentVerificationService.verifyPayment(command.getPaymentId(), finalOrderPrice);
            return "PAID";
        }
        return "TEST";
    }

    private int calculateEarnPoints(String userId, int finalOrderPrice) {
        if (userId != null && finalOrderPrice > 0) {
            UserGradeResponse gradeInfo = userGradeService.getUserGradeInfo(userId);
            if (gradeInfo.getEarnRate() != null && gradeInfo.getEarnRate() > 0) {
                return (int) (finalOrderPrice * (gradeInfo.getEarnRate() / 100.0));
            }
        }
        return 0;
    }

    private List<OrderItemResponse> saveOrderItems(CreateOrderCommand command, Order savedOrder) {
        List<OrderItemResponse> itemResponses = new ArrayList<>();

        for (OrderItemCommand itemCommand : command.getItems()) {
            Menu menu = menuRepository.findById(itemCommand.getMenuId());
            int optionPriceSum = 0;
            List<OrderOptionResponse> optionResponses = new ArrayList<>();
            List<OrderOptionRepositoryPort.OptionSelectionData> optionDatas = new ArrayList<>();

            if (itemCommand.getSelectedOptions() != null) {
                for (OrderOptionCommand optCmd : itemCommand.getSelectedOptions()) {
                    OptionGroup group = menuOptionRepository.findOptionGroupById(optCmd.getOptionGroupId());
                    OptionItem item = group.getItems().stream()
                            .filter(i -> i.getId().equals(optCmd.getOptionItemId()))
                            .findFirst().orElseThrow();

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

        return itemResponses;
    }

    private void processPoints(String userId, Order savedOrder, int usedPoints, int earnPoints, int finalOrderPrice) {
        if (userId == null) return;
        if (usedPoints > 0) {
            userPointUseCase.usePoints(userId, savedOrder.getId().toString(), usedPoints, "주문 결제 포인트 사용");
        }
        if (earnPoints > 0) {
            userPointUseCase.earnPoints(userId, savedOrder.getId().toString(), earnPoints, "주문 완료 적립");
        }
        userGradeService.addOrderStatsAndCheckGrade(userId, finalOrderPrice);
    }

    private void sendNotification(Order savedOrder, List<OrderItemResponse> itemResponses) {
        String summary = itemResponses.isEmpty() ? "" : itemResponses.get(0).getMenuName() +
                (itemResponses.size() > 1 ? " 외 " + (itemResponses.size() - 1) + "건" : "");

        orderNotificationService.notify(OrderNotificationDto.builder()
                .orderId(savedOrder.getId())
                .displayNumber("#" + savedOrder.getOrderNumber())
                .customerName(savedOrder.getCustomerName())
                .totalPrice(savedOrder.getTotalPrice())
                .summary(summary)
                .createdAt(savedOrder.getCreatedAt())
                .build());
    }
}
