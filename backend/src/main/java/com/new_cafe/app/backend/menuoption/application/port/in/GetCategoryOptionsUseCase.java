package com.new_cafe.app.backend.menuoption.application.port.in;

import java.util.List;

import com.new_cafe.app.backend.menuoption.application.command.GetCategoryOptionsCommand;
import com.new_cafe.app.backend.menuoption.application.result.OptionGroupResult;

/**
 * 카테고리별 옵션 목록 조회 유스케이스 (Admin)
 */
public interface GetCategoryOptionsUseCase {
    List<OptionGroupResult> getCategoryOptions(GetCategoryOptionsCommand command);
}
