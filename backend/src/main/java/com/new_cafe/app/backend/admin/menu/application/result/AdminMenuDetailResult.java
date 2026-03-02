package com.new_cafe.app.backend.admin.menu.application.result;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * admin 메뉴 상세 조회 결과
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMenuDetailResult {
    private Long id;
    private String korName;
    private String engName;
    private String description;
    private Integer price;
    private Long categoryId;
    private String categoryName;
    private Boolean isAvailable;
    private Boolean isSoldOut;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
