package com.new_cafe.app.backend.menu.adapter.out.persistence;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "ServiceMenuImage")
@Table(name = "menu_images")
public class MenuImageJpaEntity {
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
