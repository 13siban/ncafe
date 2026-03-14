package com.new_cafe.app.backend.menu.domain.model;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Getter;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * public 컨텍스트 도메인 모델 — 조회/주문 관점
 * JPA 없음! 순수 비즈니스 로직만.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Menu {
    private Long id;
    private String korName;
    private String engName;
    private String description;
    private Integer price;
    private Long categoryId;
    private Boolean isAvailable;
    private Boolean isSoldOut;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ========== public 비즈니스 로직 ==========

    /** 최종 주문 가능 여부 (판매 중이며 품절되지 않음) */
    public boolean isOrderable() {
        return Boolean.TRUE.equals(isAvailable) && !Boolean.TRUE.equals(isSoldOut);
    }


    /** 신상품 여부 확인 (최근 7일 이내 등록) */
    public boolean isNew() {
        if (createdAt == null) return false;
        return createdAt.isAfter(LocalDateTime.now().minusDays(7));
    }
}
