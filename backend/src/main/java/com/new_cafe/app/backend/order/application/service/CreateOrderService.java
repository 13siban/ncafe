package com.new_cafe.app.backend.order.application.service;

import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaEntity;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaRepository;
import com.new_cafe.app.backend.auth.application.port.out.LoadUserPort;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionGroupJpaEntity;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionGroupJpaRepository;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionItemJpaEntity;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionItemJpaRepository;
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
import com.new_cafe.app.backend.store.application.port.out.StoreSettingsRepositoryPort;
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
    
    private final AdminMenuJpaRepository menuRepository;
    private final OptionGroupJpaRepository optionGroupRepository;
    private final OptionItemJpaRepository optionItemRepository;

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
        int originalTotalPrice = 0;

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
            originalTotalPrice += (menu.getPrice() + optionPriceSum) * itemCommand.getQuantity();
        }

        int usedPoints = (command.getUsePoints() != null && command.getUsePoints() > 0) ? command.getUsePoints() : 0;
        
        // 포인트 잔액 확인 로직
        if (userId != null && usedPoints > 0) {
            int currentBalance = userPointUseCase.getPointBalance(userId);
            if (currentBalance < usedPoints) {
                throw new IllegalArgumentException("사용 가능한 포인트가 부족합니다.");
            }
        } else if (userId == null && usedPoints > 0) {
            throw new IllegalArgumentException("포인트 결제는 회원만 가능합니다.");
        }

        int finalOrderPrice = Math.max(0, originalTotalPrice - usedPoints);

        // --- 2단계: 결제 검증 (실제 결제 수단 선택 시 필수) ---
        String paymentStatus = "NONE";
        if (command.getPaymentMethod() != null && !command.getPaymentMethod().isBlank()) {
            if (command.getPaymentId() == null || command.getPaymentId().isBlank()) {
                throw new IllegalArgumentException("실제 결제 수단 사용 시 결제 ID(Payment ID)가 필수입니다.");
            }
            paymentVerificationService.verifyPayment(command.getPaymentId(), finalOrderPrice);
            paymentStatus = "PAID";
        } else {
            paymentStatus = "TEST"; // 테스트 주문임을 표시
        }

        int earnPoints = 0;
        if (userId != null && finalOrderPrice > 0) {
            UserGradeResponse gradeInfo = userGradeService.getUserGradeInfo(userId);
            if (gradeInfo.getEarnRate() != null && gradeInfo.getEarnRate() > 0) {
                earnPoints = (int) (finalOrderPrice * (gradeInfo.getEarnRate() / 100.0));
            }
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
                .totalPrice(finalOrderPrice)
                .usedPoints(usedPoints)
                .earnPoints(earnPoints)
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

        if (userId != null) {
            // 포인트 사용
            if (usedPoints > 0) {
                userPointUseCase.usePoints(userId, savedOrder.getId().toString(), usedPoints, "주문 결제 포인트 사용");
            }

            // 포인트 적립 (실 결제 금액 기준)
            if (earnPoints > 0) {
                userPointUseCase.earnPoints(userId, savedOrder.getId().toString(), earnPoints, "주문 완료 적립");
            }
            
            userGradeService.addOrderStatsAndCheckGrade(userId, finalOrderPrice);
        }

        
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

        return OrderResponse.builder()
                .orderDate(savedOrder.getOrderDate().toString())
                .orderNumber(savedOrder.getOrderNumber())
                .displayNumber("#" + savedOrder.getOrderNumber())
                .status(savedOrder.getStatus())
                .customerName(savedOrder.getCustomerName())
                .totalPrice(savedOrder.getTotalPrice())
                .usedPoints(usedPoints)
                .earnPoints(earnPoints)
                .createdAt(savedOrder.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .items(itemResponses)
                .build();
    }
}
