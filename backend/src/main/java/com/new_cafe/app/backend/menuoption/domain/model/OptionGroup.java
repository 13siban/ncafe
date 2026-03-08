package com.new_cafe.app.backend.menuoption.domain.model;

import java.util.List;

import lombok.Getter;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * 옵션 그룹 도메인 모델 — 순수 POJO (JPA 없음)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptionGroup {
    private Long id;
    private String name;
    private String type;        // "radio" | "checkbox"
    private Boolean isRequired;
    private Integer sortOrder;
    private List<OptionItem> items;

    /**
     * 필수 옵션인지 확인
     */
    public boolean isRequired() {
        return Boolean.TRUE.equals(isRequired);
    }

    /**
     * 단일 선택 옵션인지 확인
     */
    public boolean isSingleChoice() {
        return "radio".equals(type);
    }
}
