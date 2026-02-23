package com.new_cafe.app.backend.category.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.category.application.port.in.GetCategoryDetailUseCase;
import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;
import com.new_cafe.app.backend.category.domain.model.Category;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetCategoryDetailService implements GetCategoryDetailUseCase {

    private final CategoryRepositoryPort categoryRepositoryPort;

    @Override
    public Category getById(Long id) {
        return categoryRepositoryPort.findById(id);
    }
}
