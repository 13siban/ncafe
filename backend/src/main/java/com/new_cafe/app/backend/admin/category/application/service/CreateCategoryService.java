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
        Category category = Category.builder()
                .name(command.getName())
                .sortOrder(command.getSortOrder())
                .build();
        
        Category saved = categoryRepositoryPort.save(category);
        
        return CreateCategoryResult.builder()
                .id(saved.getId())
                .name(saved.getName())
                .build();
    }
}
