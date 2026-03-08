package com.new_cafe.app.backend.menuoption.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "option_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptionItemJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "option_group_id", nullable = false)
    private Long optionGroupId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "price_delta", nullable = false)
    private Integer priceDelta;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
