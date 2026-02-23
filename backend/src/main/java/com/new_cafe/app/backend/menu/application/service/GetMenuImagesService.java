package com.new_cafe.app.backend.menu.application.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.menu.application.command.GetMenuImagesCommand;
import com.new_cafe.app.backend.menu.application.port.in.GetMenuImagesUseCase;
import com.new_cafe.app.backend.menu.application.result.GetMenuImagesResult;
import com.new_cafe.app.backend.menu.application.result.MenuImageResult;
import com.new_cafe.app.backend.menu.application.port.out.MenuImageRepositoryPort;
import com.new_cafe.app.backend.menu.application.port.out.MenuRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.Menu;
import com.new_cafe.app.backend.menu.domain.model.MenuImage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetMenuImagesService implements GetMenuImagesUseCase {

    private final MenuImageRepositoryPort menuImageRepositoryPort;
    private final MenuRepositoryPort menuRepositoryPort;

    @Override
    public GetMenuImagesResult getImages(GetMenuImagesCommand command) {
        Menu menu = menuRepositoryPort.findById(command.getMenuId());
        String korName = (menu != null) ? menu.getKorName() : "Unknown";

        List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(command.getMenuId());
        List<MenuImageResult> imageResults;

        if (images.isEmpty() && menu != null) {
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
                        .altText(menu.getKorName())
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
                            .altText(korName)
                            .build())
                    .toList();
        }

        return GetMenuImagesResult.builder()
                .korName(korName)
                .images(imageResults)
                .build();
    }
}
