package com.new_cafe.app.backend.order.application.port.in;

import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

public interface GetOrderUseCase {

    OrderDto getOrder(LocalDate date, Integer number);
    OrderDto getOrderById(Long id);
    List<OrderListDto> getMyOrders(String userId);
    List<OrderListDto> getAllOrders(String status, LocalDate date);
    List<OrderListDto> getOrdersByRange(String status, LocalDate start, LocalDate end);
    List<OrderListDto> getOrdersByKeys(List<OrderKey> keys);
    List<TopMenuDto> getTopMenus(String userId, int limit);

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class OrderKey {
        private String date;
        private Integer number;
    }

    @Getter
    @Builder
    class OrderDto {
        private Long id;
        private String orderDate;
        private Integer orderNumber;
        private String displayNumber;
        private String customerName;
        private OrderStatus status;
        private Integer totalPrice;
        private String memo;
        private String rejectReason;
        private String paymentId;
        private String paymentMethod;
        private String paymentStatus;
        private Integer usedPoints;
        private Integer earnPoints;
        private String createdAt;
        private List<CreateOrderUseCase.OrderItemResponse> items;
    }

    @Getter
    @Builder
    class OrderListDto {
        private Long id;
        private String orderDate;
        private Integer orderNumber;
        private String displayNumber;
        private String customerName;
        private Boolean isGuest;
        private OrderStatus status;
        private String summary;
        private Integer totalPrice;
        private Integer usedPoints;
        private Integer earnPoints;
        private String createdAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class TopMenuDto {
        private Long menuId;
        private String menuName;
        private String engName;
        private String imageUrl;
        private Long totalQuantity;
    }
}
