package com.new_cafe.app.backend.category.application.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.category.adapter.in.web.dto.response.CategoryResponse;
import com.new_cafe.app.backend.category.application.port.in.GetCategoryListUseCase;
import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetCategoryListService implements GetCategoryListUseCase {

    private final CategoryRepositoryPort categoryRepositoryPort;

    @Override
    public List<CategoryResponse> getAll() {
        return categoryRepositoryPort.findAllWithMenuCount();
    }
}
