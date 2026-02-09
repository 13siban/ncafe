package com.new_cafe.app.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private Long id;
    private String name;
    private String icon;
    private Integer sortOrder;
    private Integer menuCount; // 메뉴 개수 추가
}