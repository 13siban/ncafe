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
 * Admin 컨텍스트 전용 메뉴 이미지 엔티티
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "AdminMenuImage")
@Table(name = "menu_images")
public class AdminMenuImageJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "menu_id")
    private Long menuId;
    
    @Column(name = "src_url")
    private String srcUrl;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
