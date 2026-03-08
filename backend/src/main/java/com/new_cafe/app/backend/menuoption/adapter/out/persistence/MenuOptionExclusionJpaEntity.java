package com.new_cafe.app.backend.menuoption.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_option_exclusion", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"menu_id", "option_group_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuOptionExclusionJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "menu_id", nullable = false)
    private Long menuId;

    @Column(name = "option_group_id", nullable = false)
    private Long optionGroupId;
}
