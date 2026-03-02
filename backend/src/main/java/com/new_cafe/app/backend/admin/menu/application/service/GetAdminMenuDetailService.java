package com.new_cafe.app.backend.admin.menu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.command.GetAdminMenuDetailCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.GetAdminMenuDetailUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuPort;
import com.new_cafe.app.backend.admin.menu.application.result.AdminMenuDetailResult;
import com.new_cafe.app.backend.admin.menu.domain.model.Menu;
import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;
import com.new_cafe.app.backend.category.domain.model.Category;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetAdminMenuDetailService implements GetAdminMenuDetailUseCase {

    private final LoadAdminMenuPort loadAdminMenuPort;
    private final CategoryRepositoryPort categoryRepositoryPort;

    @Override
    public AdminMenuDetailResult getMenu(GetAdminMenuDetailCommand command) {
        Menu menu = loadAdminMenuPort.findById(command.getId());
        if (menu == null) {
            throw new IllegalArgumentException("메뉴를 찾을 수 없습니다.");
        }

        Category category = categoryRepositoryPort.findById(menu.getCategoryId());
        String categoryName = (category != null) ? category.getName() : "미지정";

        return AdminMenuDetailResult.builder()
                .id(menu.getId())
                .korName(menu.getKorName())
                .engName(menu.getEngName())
                .description(menu.getDescription())
                .price(menu.getPrice())
                .categoryId(menu.getCategoryId())
                .categoryName(categoryName)
                .isAvailable(menu.getIsAvailable())
                .isSoldOut(menu.getIsSoldOut())
                .sortOrder(menu.getSortOrder())
                .createdAt(menu.getCreatedAt())
                .updatedAt(menu.getUpdatedAt())
                .build();
    }
}
