package com.new_cafe.app.backend.menuoption.application.result;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메뉴 옵션 조회 결과
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetMenuOptionsResult {
    private Long menuId;
    private List<OptionGroupResult> optionGroups;
}
