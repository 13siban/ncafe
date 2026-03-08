package com.new_cafe.app.backend.order.domain.model;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OrderItem {
    private Long id;
    private Long orderId;
    private Long menuId;
    private String menuName;
    private Integer quantity;
    private Integer unitPrice;
    private Integer optionPrice;
    private Integer subtotal;
}
