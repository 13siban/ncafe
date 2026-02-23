package com.new_cafe.app.backend.admin.menu.adapter.in.web;

import org.springframework.web.bind.annotation.*;

import com.new_cafe.app.backend.admin.menu.application.port.in.CreateMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.in.DeleteMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.in.UpdateMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.command.DeleteMenuCommand;
import com.new_cafe.app.backend.menu.application.port.in.GetMenuDetailUseCase;
import com.new_cafe.app.backend.menu.application.port.in.GetMenuImagesUseCase;
import com.new_cafe.app.backend.menu.application.port.in.GetMenuListUseCase;
import com.new_cafe.app.backend.menu.application.command.GetMenuDetailCommand;
import com.new_cafe.app.backend.menu.application.command.GetMenuImagesCommand;
import com.new_cafe.app.backend.menu.application.command.GetMenuListCommand;
import com.new_cafe.app.backend.menu.application.result.GetMenuDetailResult;
import com.new_cafe.app.backend.menu.application.result.GetMenuImagesResult;
import com.new_cafe.app.backend.menu.application.result.GetMenuListResult;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.request.MenuListRequest;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/menus")
@RequiredArgsConstructor
public class AdminMenuController {

    private final GetMenuListUseCase getMenuListUseCase;
    private final GetMenuDetailUseCase getMenuDetailUseCase;
    private final CreateMenuUseCase createMenuUseCase;
    private final UpdateMenuUseCase updateMenuUseCase;
    private final DeleteMenuUseCase deleteMenuUseCase;
    private final GetMenuImagesUseCase getMenuImagesUseCase;

    @GetMapping
    public GetMenuListResult getMenus(MenuListRequest request) {
        GetMenuListCommand command = GetMenuListCommand.builder()
                .categoryId(request.getCategoryId())
                .searchQuery(request.getSearchQuery())
                .build();
        return getMenuListUseCase.getMenus(command);
    }

    @GetMapping("/{id}")
    public GetMenuDetailResult getMenu(@PathVariable Long id) {
        GetMenuDetailCommand command = GetMenuDetailCommand.builder()
                .id(id)
                .build();
        return getMenuDetailUseCase.getMenu(command);
    }

    @GetMapping("/{id}/menu-images")
    public GetMenuImagesResult getImages(@PathVariable Long id) {
        GetMenuImagesCommand command = GetMenuImagesCommand.builder()
                .menuId(id)
                .build();
        return getMenuImagesUseCase.getImages(command);
    }

    @DeleteMapping("/{id}")
    public String deleteMenu(@PathVariable Long id) {
        DeleteMenuCommand command = DeleteMenuCommand.builder()
                .id(id)
                .build();
        deleteMenuUseCase.deleteMenu(command);
        return "Delete Success";
    }
}
