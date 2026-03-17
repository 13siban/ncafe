package com.new_cafe.app.backend.order.domain.model;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class Order {
    private Long id;
    private LocalDate orderDate;
    private Integer orderNumber;
    private String userId;
    private String customerName;
    private OrderType orderType;
    private OrderStatus status;
    private Integer totalPrice;
    private Integer usedPoints;
    private Integer earnPoints;
    private String rejectReason;
    private String memo;
    private String paymentId;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    private List<OrderItem> items;

    public void changeStatus(OrderStatus newStatus) {
        this.status = newStatus;
        this.updatedAt = LocalDateTime.now();
    }

    public void reject(String reason) {
        this.status = OrderStatus.REJECTED;
        this.rejectReason = reason;
        this.updatedAt = LocalDateTime.now();
    }
}
