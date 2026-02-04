package com.new_cafe.app.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.new_cafe.app.backend.dto.MenuCreateRequest;
import com.new_cafe.app.backend.dto.MenuCreateResponse;
import com.new_cafe.app.backend.dto.MenuDetailResponse;
import com.new_cafe.app.backend.dto.MenuListRequest;
import com.new_cafe.app.backend.dto.MenuListResponse;
import com.new_cafe.app.backend.dto.MenuResponse;
import com.new_cafe.app.backend.dto.MenuUpdateRequest;
import com.new_cafe.app.backend.dto.MenuUpdateResponse;
import com.new_cafe.app.backend.entity.Menu;
import com.new_cafe.app.backend.entity.MenuImage;
import com.new_cafe.app.backend.repository.MenuRepository;
import com.new_cafe.app.backend.repository.CategoryRepository;
import com.new_cafe.app.backend.repository.MenuImageRepository;
import com.new_cafe.app.backend.entity.Category;

@Service // new MenuService() 대신 사용
public class NewMenuService implements MenuService {

    private MenuRepository menuRepository;
    private CategoryRepository categoryRepository;
    private MenuImageRepository menuImageRepository;
    public NewMenuService(MenuRepository menuRepository, CategoryRepository categoryRepository, MenuImageRepository menuImageRepository) {
        this.menuRepository = menuRepository;
        this.categoryRepository = categoryRepository;
        this.menuImageRepository = menuImageRepository;
    }

    @Override
    public MenuListResponse getMenus(MenuListRequest request) {
        
        Long categoryId = request.getCategoryId();
        String searchQuery = request.getSearchQuery();

        // menu <---> menuResponse ---> [] ---> MenuListResponse
        List<Menu> menus = menuRepository.findAllByCategoryAndSearchQuery(categoryId, searchQuery);

        List<MenuResponse> menuResponses = menus
            .stream()
            .map(menu -> {
                Category category = categoryRepository.findById(menu.getCategoryId());
                String categoryName = (category != null) ? category.getName() : "미지정";
                List<MenuImage> images = menuImageRepository.findAllByMenuId(menu.getId());
                String imageSrc = images.isEmpty() ? "blank.png" : images.get(0).getSrcUrl();
                // String imageSrc = "blank.png";
                // if (images.size() > 0) {
                //     imageSrc = images.get(0).getSrcUrl();
                // }

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
        return null;
    }

    @Override
    public MenuCreateResponse createMenu(MenuCreateRequest request) {
        return null;
    }

    @Override
    public MenuUpdateResponse updateMenu(MenuUpdateRequest request) {
        return null;
    }

    @Override
    public void deleteMenu(Long id) {
    }
}
