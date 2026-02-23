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
        // 카테고리 수정 로직 (현재는 스켈레톤)
    }
}
