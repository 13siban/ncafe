package com.new_cafe.app.backend.admin.category.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.category.application.command.DeleteCategoryCommand;
import com.new_cafe.app.backend.admin.category.application.port.in.DeleteCategoryUseCase;
import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DeleteCategoryService implements DeleteCategoryUseCase {

    private final CategoryRepositoryPort categoryRepositoryPort;

    @Override
    public void deleteCategory(DeleteCategoryCommand command) {
        // 카테고리 삭제 로직 (현재는 스켈레톤)
    }
}
