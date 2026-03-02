package com.new_cafe.app.backend.admin.category.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.category.application.command.UpdateCategoryCommand;
import com.new_cafe.app.backend.admin.category.application.port.in.UpdateCategoryUseCase;
import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UpdateCategoryService implements UpdateCategoryUseCase {

    private final CategoryRepositoryPort categoryRepositoryPort;

    @Override
    public void updateCategory(UpdateCategoryCommand command) {
        var category = categoryRepositoryPort.findById(command.getId());
        if (category == null) {
            throw new IllegalArgumentException("Category not found: " + command.getId());
        }
        
        category.setName(command.getName());
        category.setSortOrder(command.getSortOrder());
        
        categoryRepositoryPort.save(category);
    }
}
