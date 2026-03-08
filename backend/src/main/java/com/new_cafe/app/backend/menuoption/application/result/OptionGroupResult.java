package com.new_cafe.app.backend.menuoption.application.result;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 옵션 그룹 결과 (items 포함)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptionGroupResult {
    private Long id;
    private String name;
    private String type;
    private Boolean isRequired;
    private Integer sortOrder;
    private List<OptionItemResult> items;
}
