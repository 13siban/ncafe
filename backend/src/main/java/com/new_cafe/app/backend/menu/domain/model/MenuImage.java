package com.new_cafe.app.backend.menu.domain.model;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * MenuImage 도메인 모델 — 순수 POJO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuImage {
    private Long id;
    private Long menuId;
    private String srcUrl;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
