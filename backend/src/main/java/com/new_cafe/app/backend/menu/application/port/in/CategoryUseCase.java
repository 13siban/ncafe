package com.new_cafe.app.backend.menu.application.port.in;

import java.util.List;

import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.CategoryResponse;
import com.new_cafe.app.backend.menu.domain.model.Category;

/**
 * 카테고리 조회/관리 유스케이스
 */
public interface CategoryUseCase {
    List<CategoryResponse> getAll();

    Category getById(Long id);
}
