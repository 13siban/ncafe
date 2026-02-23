package com.new_cafe.app.backend.menu.application.result;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메뉴 상세 조회 결과 (이미지 목록 통합)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetMenuDetailResult {
    private Long id;
    private String korName;
    private String engName;
    private String description;
    private Integer price;
    private String categoryName;
    private Boolean isAvailable;
    private Boolean isSoldOut;
    private Boolean isOrderable;
    
    // 4단계: 이미지 리스트 통합 (Aggregate)
    private List<MenuImageResult> images;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
