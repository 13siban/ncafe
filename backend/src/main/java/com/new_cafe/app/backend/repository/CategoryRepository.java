package com.new_cafe.app.backend.repository;

import java.util.List;

import com.new_cafe.app.backend.dto.CategoryResponse;
import com.new_cafe.app.backend.entity.Category;

public interface CategoryRepository {
    List<CategoryResponse> findAllWithMenuCount();
    Category findById(Long id);
}
