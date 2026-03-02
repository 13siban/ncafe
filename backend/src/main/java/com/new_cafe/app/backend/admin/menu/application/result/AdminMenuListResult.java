package com.new_cafe.app.backend.admin.menu.application.result;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * admin 메뉴 목록 조회 결과
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMenuListResult {
    private List<AdminMenuSummaryResult> menus;
    private int total;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminMenuSummaryResult {
        private Long id;
        private String korName;
        private String engName;
        private String description;
        private Integer price;
        private String categoryName;
        private String imageSrc;
        private Boolean isAvailable;
        private Boolean isSoldOut;
        private Boolean isOrderable;
        private Integer sortOrder;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
