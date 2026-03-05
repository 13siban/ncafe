package com.new_cafe.app.backend.admin.category.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuPort;
import com.new_cafe.app.backend.admin.category.application.command.DeleteCategoryCommand;
import com.new_cafe.app.backend.admin.category.application.port.in.DeleteCategoryUseCase;
import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DeleteCategoryService implements DeleteCategoryUseCase {

    private final CategoryRepositoryPort categoryRepositoryPort;
    private final LoadAdminMenuPort loadAdminMenuPort;

    @Override
    public void deleteCategory(DeleteCategoryCommand command) {
        // 해당 카테고리에 속한 메뉴가 있는지 확인
        var menus = loadAdminMenuPort.findAll(command.getId(), null);
        if (menus != null && !menus.isEmpty()) {
            throw new RuntimeException("해당 카테고리에 속한 메뉴가 있어 삭제할 수 없습니다. 먼저 메뉴의 카테고리를 변경하거나 메뉴를 삭제해 주세요.");
        }
        categoryRepositoryPort.deleteById(command.getId());
    }
}
