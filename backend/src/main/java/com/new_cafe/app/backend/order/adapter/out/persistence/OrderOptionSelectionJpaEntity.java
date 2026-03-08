package com.new_cafe.app.backend.order.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "order_option_selections")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class OrderOptionSelectionJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_item_id", nullable = false)
    private Long orderItemId;

    @Column(name = "option_group_name", nullable = false, length = 100)
    private String optionGroupName;

    @Column(name = "option_item_name", nullable = false, length = 100)
    private String optionItemName;

    @Column(name = "price_delta", nullable = false)
    private Integer priceDelta;

    @PrePersist
    public void prePersist() {
        if (priceDelta == null) priceDelta = 0;
    }
}
