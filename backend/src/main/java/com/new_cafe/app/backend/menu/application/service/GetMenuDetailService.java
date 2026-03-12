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
        Menu menu;
        if (command.getId() != null) {
            menu = menuRepositoryPort.findById(command.getId());
        } else if (command.getEngName() != null) {
            String slug = command.getEngName();
            menu = menuRepositoryPort.findByEngName(slug);
            
            // 만약 하이픈(-)이 포함된 슬러그라면, 공백으로 치환하여 다시 한 번 시도 (예: choco-chip -> choco chip)
            if (menu == null && slug.contains("-")) {
                menu = menuRepositoryPort.findByEngName(slug.replace("-", " "));
            }
        } else {
            return null;
        }

        if (menu == null) return null;
        final Menu resolvedMenu = menu;

        Category category = categoryRepositoryPort.findById(resolvedMenu.getCategoryId());
        String categoryName = (category != null) ? category.getName() : "미지정";
        
        // 4단계: 이미지 목록 통합 조회 (Aggregate)
        List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(resolvedMenu.getId());
        List<MenuImageResult> imageResults;

        if (images.isEmpty()) {
            String baseName = resolvedMenu.getEngName() != null 
                    ? resolvedMenu.getEngName().toLowerCase().replaceAll("\\s+", "") 
                    : "blank";
            // DB에 이미지가 없을 경우 가상 이미지 리스트 반환
            imageResults = List.of(
                MenuImageResult.builder()
                        .id(-1L)
                        .menuId(resolvedMenu.getId())
                        .srcUrl(baseName + ".png")
                        .sortOrder(1)
                        .altText(resolvedMenu.getKorName() + " 이미지")
                        .build(),
                MenuImageResult.builder()
                        .id(-2L)
                        .menuId(resolvedMenu.getId())
                        .srcUrl(baseName + "1.png")
                        .sortOrder(2)
                        .altText(resolvedMenu.getKorName() + " 서브 1")
                        .build(),
                MenuImageResult.builder()
                        .id(-3L)
                        .menuId(resolvedMenu.getId())
                        .srcUrl(baseName + "2.png")
                        .sortOrder(3)
                        .altText(resolvedMenu.getKorName() + " 서브 2")
                        .build()
            );
        } else {
            imageResults = images.stream()
                    .map(img -> MenuImageResult.builder()
                            .id(img.getId())
                            .menuId(img.getMenuId())
                            .srcUrl(img.getSrcUrl())
                            .sortOrder(img.getSortOrder())
                            .altText(resolvedMenu.getKorName() + " 이미지")
                            .build())
                    .toList();
        }

        return GetMenuDetailResult.builder()
                .id(resolvedMenu.getId())
                .korName(resolvedMenu.getKorName())
                .engName(resolvedMenu.getEngName())
                .description(resolvedMenu.getDescription())
                .price(resolvedMenu.getPrice())
                .categoryName(categoryName)
                .isAvailable(resolvedMenu.getIsAvailable())
                .isSoldOut(resolvedMenu.getIsSoldOut())
                // 도메인 로직 활용
                .isOrderable(resolvedMenu.isOrderable())
                .images(imageResults) // 통합된 이미지 결과
                .createdAt(resolvedMenu.getCreatedAt())
                .updatedAt(resolvedMenu.getUpdatedAt())
                .build();
    }
}
