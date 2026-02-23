package com.new_cafe.app.backend.menu.application.result;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메뉴 목록 내 개별 메뉴 요약 결과 (도메인 로직 결과 포함)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuSummaryResult {
    private Long id;
    private String korName;
    private String engName;
    private String description;
    private Integer price;
    private String categoryName;
    private String imageSrc;
    
    // 도메인 로직 기반 상태 필드 추가
    private Boolean isOrderable;
    private Boolean isSoldOut;
    private Boolean isNew;
    
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
