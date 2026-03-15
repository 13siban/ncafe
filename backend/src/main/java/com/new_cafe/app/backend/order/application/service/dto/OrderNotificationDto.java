package com.new_cafe.app.backend.order.application.service.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class OrderNotificationDto {
    private Long orderId;
    private String displayNumber;
    private String customerName;
    private Integer totalPrice;
    private String summary;
    private LocalDateTime createdAt;
}
