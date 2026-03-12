package com.new_cafe.app.backend.menu.adapter.in.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.new_cafe.app.backend.menu.adapter.in.web.dto.request.MenuListRequest;
import com.new_cafe.app.backend.menu.application.command.GetMenuDetailCommand;
import com.new_cafe.app.backend.menu.application.command.GetMenuImagesCommand;
import com.new_cafe.app.backend.menu.application.command.GetMenuListCommand;
import com.new_cafe.app.backend.menu.application.port.in.GetMenuDetailUseCase;
import com.new_cafe.app.backend.menu.application.port.in.GetMenuImagesUseCase;
import com.new_cafe.app.backend.menu.application.port.in.GetMenuListUseCase;
import com.new_cafe.app.backend.menu.application.result.GetMenuDetailResult;
import com.new_cafe.app.backend.menu.application.result.GetMenuImagesResult;
import com.new_cafe.app.backend.menu.application.result.GetMenuListResult;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/menus")
@RequiredArgsConstructor
public class MenuController {

    private final GetMenuListUseCase getMenuListUseCase;
    private final GetMenuDetailUseCase getMenuDetailUseCase;
    private final GetMenuImagesUseCase getMenuImagesUseCase;

    // 메뉴 목록 조회
    @GetMapping
    public GetMenuListResult getMenus(MenuListRequest request) {
        GetMenuListCommand command = GetMenuListCommand.builder()
                .categoryId(request.getCategoryId())
                .searchQuery(request.getSearchQuery())
                .page(request.getPage())
                .size(request.getSize())
                .sortBy(request.getSortBy())
                .onlyAvailable(request.getOnlyAvailable())
                .build();
        return getMenuListUseCase.getMenus(command);
    }

    // 메뉴 상세 조회 (이제 이미지 목록까지 포함된 통합 정보를 반환합니다)
    @GetMapping("/{id}")
    public GetMenuDetailResult getMenu(@PathVariable Long id) {
        GetMenuDetailCommand command = GetMenuDetailCommand.builder()
                .id(id)
                .build();
        return getMenuDetailUseCase.getMenu(command);
    }

    // 메뉴 슬러그(영문이름)로 상세 조회
    @GetMapping("/slug/{slug}")
    public GetMenuDetailResult getMenuBySlug(@PathVariable String slug) {
        GetMenuDetailCommand command = GetMenuDetailCommand.builder()
                .engName(slug)
                .build();
        return getMenuDetailUseCase.getMenu(command);
    }

    // 메뉴 이미지 조회 (상세 조회에서도 나오지만, 필요한 경우 별도 호출 가능)
    @GetMapping("/{id}/menu-images")
    public GetMenuImagesResult getImages(@PathVariable Long id) {
        GetMenuImagesCommand command = GetMenuImagesCommand.builder()
                .menuId(id)
                .build();
        return getMenuImagesUseCase.getImages(command);
    }
}
