package com.new_cafe.app.backend.menu.application.result;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메뉴 목록 조회 결과
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetMenuListResult {
    private List<MenuSummaryResult> menus;
    private int total;
}
