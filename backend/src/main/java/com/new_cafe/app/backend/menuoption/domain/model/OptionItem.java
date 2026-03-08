package com.new_cafe.app.backend.menuoption.domain.model;

import lombok.Getter;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * 옵션 항목 도메인 모델 — 순수 POJO (JPA 없음)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptionItem {
    private Long id;
    private Long optionGroupId;
    private String name;
    private Integer priceDelta;
    private Integer sortOrder;

    /**
     * 추가 금액이 있는지 확인
     */
    public boolean hasExtraPrice() {
        return priceDelta != null && priceDelta > 0;
    }
}
