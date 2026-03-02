package com.new_cafe.app.backend.admin.menu.adapter.out.persistence;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * Admin 컨텍스트 전용 메뉴 엔티티
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "AdminMenu")
@Table(name = "menus")
public class AdminMenuJpaEntity {
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
