package com.new_cafe.app.backend.menuoption.application.result;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 옵션 항목 결과
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptionItemResult {
    private Long id;
    private Long optionGroupId;
    private String name;
    private Integer priceDelta;
    private Integer sortOrder;
}
