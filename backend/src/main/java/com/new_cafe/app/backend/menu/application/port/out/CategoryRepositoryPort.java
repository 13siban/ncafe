package com.new_cafe.app.backend.menu.application.port.out;

import java.util.List;

import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.CategoryResponse;
import com.new_cafe.app.backend.menu.domain.model.Category;

/**
 * 카테고리 영속성 아웃바운드 포트
 */
public interface CategoryRepositoryPort {
    List<CategoryResponse> findAllWithMenuCount();

    Category findById(Long id);
}
