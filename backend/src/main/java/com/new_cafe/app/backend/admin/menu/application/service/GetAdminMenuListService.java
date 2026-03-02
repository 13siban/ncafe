package com.new_cafe.app.backend.admin.menu.application.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.command.GetAdminMenuListCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.GetAdminMenuListUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuPort;
import com.new_cafe.app.backend.admin.menu.application.result.AdminMenuListResult;
import com.new_cafe.app.backend.admin.menu.application.result.AdminMenuListResult.AdminMenuSummaryResult;
import com.new_cafe.app.backend.admin.menu.domain.model.Menu;
import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;
import com.new_cafe.app.backend.category.domain.model.Category;
import com.new_cafe.app.backend.menu.application.port.out.MenuImageRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.MenuImage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetAdminMenuListService implements GetAdminMenuListUseCase {

    private final LoadAdminMenuPort loadAdminMenuPort;
    private final CategoryRepositoryPort categoryRepositoryPort;
    private final MenuImageRepositoryPort menuImageRepositoryPort;

    @Override
    public AdminMenuListResult getMenus(GetAdminMenuListCommand command) {
        List<Menu> menus = loadAdminMenuPort.findAll(
                command.getCategoryId(),
                command.getSearchQuery()
        );

        List<AdminMenuSummaryResult> menuResults = menus.stream()
                .map(menu -> {
                    Category category = categoryRepositoryPort.findById(menu.getCategoryId());
                    String categoryName = (category != null) ? category.getName() : "미지정";

                    List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(menu.getId());
                    String imageSrc;
                    if (!images.isEmpty()) {
                        imageSrc = images.get(0).getSrcUrl();
                    } else if (menu.getEngName() != null) {
                        imageSrc = menu.getEngName().toLowerCase().replaceAll("\\s+", "") + ".png";
                    } else {
                        imageSrc = "blank.png";
                    }

                    boolean isOrderable = Boolean.TRUE.equals(menu.getIsAvailable())
                            && !Boolean.TRUE.equals(menu.getIsSoldOut());

                    return AdminMenuSummaryResult.builder()
                            .id(menu.getId())
                            .korName(menu.getKorName())
                            .engName(menu.getEngName())
                            .description(menu.getDescription())
                            .price(menu.getPrice())
                            .categoryName(categoryName)
                            .imageSrc(imageSrc)
                            .isAvailable(menu.getIsAvailable())
                            .isSoldOut(menu.getIsSoldOut())
                            .isOrderable(isOrderable)
                            .sortOrder(menu.getSortOrder())
                            .createdAt(menu.getCreatedAt())
                            .updatedAt(menu.getUpdatedAt())
                            .build();
                })
                .toList();

        return AdminMenuListResult.builder()
                .menus(menuResults)
                .total(menuResults.size())
                .build();
    }
}
