package com.new_cafe.app.backend.menu.application.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.new_cafe.app.backend.menu.adapter.in.web.dto.request.MenuCreateRequest;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.request.MenuListRequest;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.request.MenuUpdateRequest;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuCreateResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuDetailResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuImageListResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuImageResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuListResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuUpdateResponse;
import com.new_cafe.app.backend.menu.application.port.in.AdminMenuUseCase;
import com.new_cafe.app.backend.menu.application.port.in.ViewMenuUseCase;
import com.new_cafe.app.backend.menu.application.port.out.CategoryRepositoryPort;
import com.new_cafe.app.backend.menu.application.port.out.MenuImageRepositoryPort;
import com.new_cafe.app.backend.menu.application.port.out.MenuRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.Category;
import com.new_cafe.app.backend.menu.domain.model.Menu;
import com.new_cafe.app.backend.menu.domain.model.MenuImage;

@Service
public class MenuService implements ViewMenuUseCase, AdminMenuUseCase {

    private final MenuRepositoryPort menuRepositoryPort;
    private final CategoryRepositoryPort categoryRepositoryPort;
    private final MenuImageRepositoryPort menuImageRepositoryPort;

    public MenuService(MenuRepositoryPort menuRepositoryPort,
            CategoryRepositoryPort categoryRepositoryPort,
            MenuImageRepositoryPort menuImageRepositoryPort) {
        this.menuRepositoryPort = menuRepositoryPort;
        this.categoryRepositoryPort = categoryRepositoryPort;
        this.menuImageRepositoryPort = menuImageRepositoryPort;
    }

    // ========== ViewMenuUseCase 구현 (조회) ==========

    @Override
    public MenuListResponse getMenus(MenuListRequest request) {
        Long categoryId = request.getCategoryId();
        String searchQuery = request.getSearchQuery();

        List<Menu> menus = menuRepositoryPort.findAllByCategoryAndSearchQuery(categoryId, searchQuery);

        List<MenuResponse> menuResponses = menus
                .stream()
                .map(menu -> {
                    Category category = categoryRepositoryPort.findById(menu.getCategoryId());
                    String categoryName = (category != null) ? category.getName() : "미지정";
                    List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(menu.getId());
                    String imageSrc = images.isEmpty() ? "blank.png" : images.get(0).getSrcUrl();

                    return MenuResponse.builder()
                            .id(menu.getId())
                            .korName(menu.getKorName())
                            .engName(menu.getEngName())
                            .description(menu.getDescription())
                            .price(menu.getPrice())
                            .categoryName(categoryName)
                            .imageSrc(imageSrc)
                            .isAvailable(menu.getIsAvailable())
                            .isSoldOut(false)
                            .sortOrder(1)
                            .createdAt(menu.getCreatedAt())
                            .updatedAt(menu.getUpdatedAt())
                            .build();
                })
                .toList();

        return MenuListResponse
                .builder()
                .menus(menuResponses)
                .total(menus.size())
                .build();
    }

    @Override
    public MenuDetailResponse getMenu(Long id) {
        Menu menu = menuRepositoryPort.findById(id);
        if (menu == null) {
            return null;
        }

        Category category = categoryRepositoryPort.findById(menu.getCategoryId());
        String categoryName = (category != null) ? category.getName() : "미지정";
        List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(menu.getId());
        String imageSrc = images.isEmpty() ? "blank.png" : images.get(0).getSrcUrl();

        return MenuDetailResponse.builder()
                .id(menu.getId())
                .korName(menu.getKorName())
                .engName(menu.getEngName())
                .description(menu.getDescription())
                .price(menu.getPrice())
                .categoryName(categoryName)
                .isAvailable(menu.getIsAvailable())
                .isSoldOut(false)
                .createdAt(menu.getCreatedAt())
                .updatedAt(menu.getUpdatedAt())
                .build();
    }

    @Override
    public MenuImageListResponse getImages(Long id) {
        Menu menu = menuRepositoryPort.findById(id);
        String korName = (menu != null) ? menu.getKorName() : "알 수 없는 메뉴";

        List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(id);

        List<MenuImageResponse> imageResponses = images.stream()
                .map(img -> MenuImageResponse.builder()
                        .id(img.getId())
                        .menuId(img.getMenuId())
                        .srcUrl(img.getSrcUrl())
                        .sortOrder(img.getSortOrder())
                        .altText(korName)
                        .build())
                .toList();

        return MenuImageListResponse.builder()
                .images(imageResponses)
                .build();
    }

    // ========== AdminMenuUseCase 구현 (CUD) ==========

    @Override
    public MenuCreateResponse createMenu(MenuCreateRequest request) {
        // TODO: CRUD 구현 예정
        return null;
    }

    @Override
    public MenuUpdateResponse updateMenu(MenuUpdateRequest request) {
        // TODO: CRUD 구현 예정
        return null;
    }

    @Override
    public void deleteMenu(Long id) {
        // TODO: CRUD 구현 예정
    }
}
