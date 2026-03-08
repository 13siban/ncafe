package com.new_cafe.app.backend.order.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class OrderItemJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "menu_id", nullable = false)
    private Long menuId;

    @Column(name = "menu_name", nullable = false, length = 100)
    private String menuName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private Integer unitPrice;

    @Column(name = "option_price", nullable = false)
    private Integer optionPrice;

    @Column(nullable = false)
    private Integer subtotal;

    @PrePersist
    public void prePersist() {
        if (quantity == null) quantity = 1;
        if (optionPrice == null) optionPrice = 0;
    }
}
