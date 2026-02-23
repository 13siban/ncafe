package com.new_cafe.app.backend.menu.application.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.category.application.port.out.CategoryRepositoryPort;
import com.new_cafe.app.backend.category.domain.model.Category;
import com.new_cafe.app.backend.menu.application.command.GetMenuDetailCommand;
import com.new_cafe.app.backend.menu.application.port.in.GetMenuDetailUseCase;
import com.new_cafe.app.backend.menu.application.result.GetMenuDetailResult;
import com.new_cafe.app.backend.menu.application.result.MenuImageResult;
import com.new_cafe.app.backend.menu.application.port.out.MenuImageRepositoryPort;
import com.new_cafe.app.backend.menu.application.port.out.MenuRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.Menu;
import com.new_cafe.app.backend.menu.domain.model.MenuImage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetMenuDetailService implements GetMenuDetailUseCase {

    private final MenuRepositoryPort menuRepositoryPort;
    private final CategoryRepositoryPort categoryRepositoryPort;
    private final MenuImageRepositoryPort menuImageRepositoryPort;

    @Override
    public GetMenuDetailResult getMenu(GetMenuDetailCommand command) {
        Menu menu = menuRepositoryPort.findById(command.getId());
        if (menu == null) return null;

        Category category = categoryRepositoryPort.findById(menu.getCategoryId());
        String categoryName = (category != null) ? category.getName() : "미지정";
        
        // 4단계: 이미지 목록 통합 조회 (Aggregate)
        List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(menu.getId());
        List<MenuImageResult> imageResults;

        if (images.isEmpty()) {
            String baseName = menu.getEngName() != null 
                    ? menu.getEngName().toLowerCase().replaceAll("\\s+", "") 
                    : "blank";
            // DB에 이미지가 없을 경우 가상 이미지 리스트 반환
            imageResults = List.of(
                MenuImageResult.builder()
                        .id(-1L)
                        .menuId(menu.getId())
                        .srcUrl(baseName + ".png")
                        .sortOrder(1)
                        .altText(menu.getKorName() + " 이미지")
                        .build(),
                MenuImageResult.builder()
                        .id(-2L)
                        .menuId(menu.getId())
                        .srcUrl(baseName + "1.png")
                        .sortOrder(2)
                        .altText(menu.getKorName() + " 서브 1")
                        .build(),
                MenuImageResult.builder()
                        .id(-3L)
                        .menuId(menu.getId())
                        .srcUrl(baseName + "2.png")
                        .sortOrder(3)
                        .altText(menu.getKorName() + " 서브 2")
                        .build()
            );
        } else {
            imageResults = images.stream()
                    .map(img -> MenuImageResult.builder()
                            .id(img.getId())
                            .menuId(img.getMenuId())
                            .srcUrl(img.getSrcUrl())
                            .sortOrder(img.getSortOrder())
                            .altText(menu.getKorName() + " 이미지")
                            .build())
                    .toList();
        }

        return GetMenuDetailResult.builder()
                .id(menu.getId())
                .korName(menu.getKorName())
                .engName(menu.getEngName())
                .description(menu.getDescription())
                .price(menu.getPrice())
                .categoryName(categoryName)
                .isAvailable(menu.getIsAvailable())
                .isSoldOut(menu.getIsSoldOut())
                // 도메인 로직 활용
                .isOrderable(menu.isOrderable())
                .images(imageResults) // 통합된 이미지 결과
                .createdAt(menu.getCreatedAt())
                .updatedAt(menu.getUpdatedAt())
                .build();
    }
}
