package com.new_cafe.app.backend.menu.adapter.out.persistence;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * public 컨텍스트 JPA 엔티티 — 조회 전용
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "ServiceMenu")
@Table(name = "menus")
public class MenuJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String korName;
    private String engName;
    private String description;
    private Integer price;
    @Column(name = "category_id")
    private Long categoryId;
    private Boolean isAvailable;
    private Boolean isSoldOut;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
