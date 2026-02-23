package com.new_cafe.app.backend.admin.category.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.category.application.command.CreateCategoryCommand;
import com.new_cafe.app.backend.admin.category.application.port.in.CreateCategoryUseCase;
import com.new_cafe.app.backend.admin.category.application.result.CreateCategoryResult;
import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;
import com.new_cafe.app.backend.category.domain.model.Category;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CreateCategoryService implements CreateCategoryUseCase {

    private final CategoryRepositoryPort categoryRepositoryPort;

    @Override
    public CreateCategoryResult createCategory(CreateCategoryCommand command) {
        // 카테고리 생성 로직 (현재는 스켈레톤)
        return null;
    }
}
