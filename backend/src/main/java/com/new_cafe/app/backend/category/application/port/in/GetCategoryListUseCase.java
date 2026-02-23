package com.new_cafe.app.backend.category.application.port.in;

import java.util.List;
import com.new_cafe.app.backend.category.adapter.in.web.dto.response.CategoryResponse;

/**
 * 카테고리 목록 조회 단위 기능
 */
public interface GetCategoryListUseCase {
    List<CategoryResponse> getAll();
}
