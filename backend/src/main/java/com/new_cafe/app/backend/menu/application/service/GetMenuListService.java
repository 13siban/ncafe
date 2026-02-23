package com.new_cafe.app.backend.menu.application.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;
import com.new_cafe.app.backend.category.domain.model.Category;
import com.new_cafe.app.backend.menu.application.command.GetMenuListCommand;
import com.new_cafe.app.backend.menu.application.port.in.GetMenuListUseCase;
import com.new_cafe.app.backend.menu.application.result.GetMenuListResult;
import com.new_cafe.app.backend.menu.application.result.MenuSummaryResult;
import com.new_cafe.app.backend.menu.application.port.out.MenuImageRepositoryPort;
import com.new_cafe.app.backend.menu.application.port.out.MenuRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.Menu;
import com.new_cafe.app.backend.menu.domain.model.MenuImage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetMenuListService implements GetMenuListUseCase {

    private final MenuRepositoryPort menuRepositoryPort;
    private final CategoryRepositoryPort categoryRepositoryPort;
    private final MenuImageRepositoryPort menuImageRepositoryPort;

    @Override
    public GetMenuListResult getMenus(GetMenuListCommand command) {
        // 강화된 조회 포트 사용
        List<Menu> menus = menuRepositoryPort.findPagedMenus(
                command.getCategoryId(),
                command.getSearchQuery(),
                command.getPage(),
                command.getSize(),
                command.getSortBy(),
                command.getOnlyAvailable()
        );

        List<MenuSummaryResult> menuResults = menus.stream()
                .map(menu -> {
                    Category category = categoryRepositoryPort.findById(menu.getCategoryId());
                    String categoryName = (category != null) ? category.getName() : "미지정";
                    
                    // 대표 이미지 획득
                    List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(menu.getId());
                    String imageSrc;
                    if (!images.isEmpty()) {
                        imageSrc = images.get(0).getSrcUrl();
                    } else if (menu.getEngName() != null) {
                        imageSrc = menu.getEngName().toLowerCase().replaceAll("\\s+", "") + ".png";
                    } else {
                        imageSrc = "blank.png";
                    }

                    return MenuSummaryResult.builder()
                            .id(menu.getId())
                            .korName(menu.getKorName())
                            .engName(menu.getEngName())
                            .description(menu.getDescription())
                            .price(menu.getPrice())
                            .categoryName(categoryName)
                            .imageSrc(imageSrc)
                            // 도메인 로직 활용
                            .isOrderable(menu.isOrderable())
                            .isSoldOut(menu.getIsSoldOut())
                            .isNew(menu.isNew())
                            .sortOrder(menu.getSortOrder())
                            .createdAt(menu.getCreatedAt())
                            .build();
                })
                .toList();

        return GetMenuListResult.builder()
                .menus(menuResults)
                .total(menuResults.size()) // 실제로는 별도의 count 쿼리가 필요할 수 있음
                .build();
    }
}
