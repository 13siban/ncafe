package com.new_cafe.app.backend.menu.domain.model;

import lombok.Data;
import lombok.Builder;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuImage {
    private Long id;
    private Long menuId;
    private String srcUrl;
    private LocalDateTime createdAt;
    private Integer sortOrder;
}
