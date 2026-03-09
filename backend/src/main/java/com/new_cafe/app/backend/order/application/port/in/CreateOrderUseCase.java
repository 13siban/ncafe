package com.new_cafe.app.backend.order.application.port.in;

import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public interface CreateOrderUseCase {

    OrderResponse createOrder(CreateOrderCommand command, String userId);

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class CreateOrderCommand {
        private String customerName;
        private String memo;
        private List<OrderItemCommand> items;
        private String paymentId;
        private String paymentMethod;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class OrderItemCommand {
        private Long menuId;
        private Integer quantity;
        private List<OrderOptionCommand> selectedOptions;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class OrderOptionCommand {
        private Long optionGroupId;
        private Long optionItemId;
    }

    @Getter
    @Builder
    class OrderResponse {
        private String orderDate;
        private Integer orderNumber;
        private String displayNumber;
        private OrderStatus status;
        private String customerName;
        private Integer totalPrice;
        private String createdAt;
        private List<OrderItemResponse> items;
    }

    @Getter
    @Builder
    class OrderItemResponse {
        private String menuName;
        private Integer quantity;
        private Integer unitPrice;
        private Integer optionPrice;
        private Integer subtotal;
        private List<OrderOptionResponse> options;
    }

    @Getter
    @Builder
    class OrderOptionResponse {
        private String groupName;
        private String itemName;
        private Integer priceDelta;
    }
}
