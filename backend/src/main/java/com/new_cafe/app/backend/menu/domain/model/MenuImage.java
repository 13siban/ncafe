package com.new_cafe.app.backend.menu.domain.model;

import lombok.Data;
import lombok.Builder;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "ServiceMenuImage")
@Table(name = "menu_images")
public class MenuImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "menu_id")
    private Long menuId;
    @Column(name = "src_url")
    private String srcUrl;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "sort_order")
    private Integer sortOrder;
}
