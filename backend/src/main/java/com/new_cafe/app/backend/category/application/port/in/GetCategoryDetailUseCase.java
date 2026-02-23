package com.new_cafe.app.backend.category.application.port.in;

import com.new_cafe.app.backend.category.domain.model.Category;

/**
 * 카테고리 상세 조회 단위 기능
 */
public interface GetCategoryDetailUseCase {
    Category getById(Long id);
}
