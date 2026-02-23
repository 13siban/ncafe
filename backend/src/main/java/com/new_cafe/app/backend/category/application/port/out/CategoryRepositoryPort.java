package com.new_cafe.app.backend.category.application.port.out;

import java.util.List;

import com.new_cafe.app.backend.category.adapter.in.web.dto.response.CategoryResponse;
import com.new_cafe.app.backend.category.domain.model.Category;

public interface CategoryRepositoryPort {
    List<CategoryResponse> findAllWithMenuCount();

    Category findById(Long id);
}
