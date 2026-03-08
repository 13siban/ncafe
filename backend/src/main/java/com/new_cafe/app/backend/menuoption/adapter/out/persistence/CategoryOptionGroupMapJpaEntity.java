package com.new_cafe.app.backend.menuoption.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "category_option_group_map", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"category_id", "option_group_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryOptionGroupMapJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "option_group_id", nullable = false)
    private Long optionGroupId;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
