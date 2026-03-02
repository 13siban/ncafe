package com.new_cafe.app.backend.admin.menu.adapter.in.web;

import org.springframework.web.bind.annotation.*;

import com.new_cafe.app.backend.admin.menu.application.port.in.CreateMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.in.DeleteMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.in.GetAdminMenuDetailUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.in.GetAdminMenuListUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.in.UpdateMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.command.CreateMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.command.DeleteMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.command.GetAdminMenuDetailCommand;
import com.new_cafe.app.backend.admin.menu.application.command.GetAdminMenuListCommand;
import com.new_cafe.app.backend.admin.menu.application.command.UpdateMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.command.SetPrimaryMenuImageCommand;
import com.new_cafe.app.backend.admin.menu.application.command.DeleteMenuImageCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.SetPrimaryMenuImageUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.in.DeleteMenuImageUseCase;
import com.new_cafe.app.backend.admin.menu.application.result.AdminMenuDetailResult;
import com.new_cafe.app.backend.admin.menu.application.result.AdminMenuListResult;
import com.new_cafe.app.backend.admin.menu.application.result.CreateMenuResult;
import com.new_cafe.app.backend.admin.menu.application.result.UpdateMenuResult;
import com.new_cafe.app.backend.menu.application.port.in.GetMenuImagesUseCase;
import com.new_cafe.app.backend.menu.application.command.GetMenuImagesCommand;
import com.new_cafe.app.backend.menu.application.result.GetMenuImagesResult;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/menus")
@RequiredArgsConstructor
public class AdminMenuController {

    // admin 전용 UseCase만 사용 — public 컨텍스트 의존 없음!
    private final GetAdminMenuListUseCase getAdminMenuListUseCase;
    private final GetAdminMenuDetailUseCase getAdminMenuDetailUseCase;
    private final CreateMenuUseCase createMenuUseCase;
    private final UpdateMenuUseCase updateMenuUseCase;
    private final DeleteMenuUseCase deleteMenuUseCase;
    private final GetMenuImagesUseCase getMenuImagesUseCase; // public context image loader
    private final SetPrimaryMenuImageUseCase setPrimaryMenuImageUseCase;
    private final DeleteMenuImageUseCase deleteMenuImageUseCase;
    private final com.new_cafe.app.backend.admin.menu.application.port.in.UploadMenuImageUseCase uploadMenuImageUseCase;

    @GetMapping
    public AdminMenuListResult getMenus(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String searchQuery) {
        GetAdminMenuListCommand command = GetAdminMenuListCommand.builder()
                .categoryId(categoryId)
                .searchQuery(searchQuery)
                .build();
        return getAdminMenuListUseCase.getMenus(command);
    }

    @GetMapping("/{id}")
    public AdminMenuDetailResult getMenu(@PathVariable Long id) {
        GetAdminMenuDetailCommand command = GetAdminMenuDetailCommand.builder()
                .id(id)
                .build();
        return getAdminMenuDetailUseCase.getMenu(command);
    }

    @GetMapping("/{id}/menu-images")
    public GetMenuImagesResult getImages(@PathVariable Long id) {
        GetMenuImagesCommand command = GetMenuImagesCommand.builder()
                .menuId(id)
                .build();
        return getMenuImagesUseCase.getImages(command);
    }

    @PostMapping
    public CreateMenuResult createMenu(@RequestBody CreateMenuCommand command) {
        return createMenuUseCase.createMenu(command);
    }

    @PostMapping("/{id}/menu-images")
    public java.util.Map<String, String> uploadImages(@PathVariable Long id, @RequestParam("files") java.util.List<org.springframework.web.multipart.MultipartFile> files) {
        com.new_cafe.app.backend.admin.menu.application.command.UploadMenuImageCommand command = 
            com.new_cafe.app.backend.admin.menu.application.command.UploadMenuImageCommand.builder()
                .menuId(id)
                .files(files)
                .build();
        uploadMenuImageUseCase.uploadMenuImages(command);
        return java.util.Map.of("message", "Upload Success");
    }

    @PutMapping("/{id}")
    public UpdateMenuResult updateMenu(@PathVariable Long id, @RequestBody UpdateMenuCommand command) {
        UpdateMenuCommand finalCommand = UpdateMenuCommand.builder()
                .id(id)
                .korName(command.getKorName())
                .engName(command.getEngName())
                .description(command.getDescription())
                .price(command.getPrice())
                .categoryId(command.getCategoryId())
                .isAvailable(command.getIsAvailable())
                .build();
        return updateMenuUseCase.updateMenu(finalCommand);
    }

    @DeleteMapping("/{id}")
    public java.util.Map<String, String> deleteMenu(@PathVariable Long id) {
        DeleteMenuCommand command = DeleteMenuCommand.builder()
                .id(id)
                .build();
        deleteMenuUseCase.deleteMenu(command);
        return java.util.Map.of("message", "Delete Success");
    }

    @PutMapping("/{id}/menu-images/{imageId}/set-primary")
    public java.util.Map<String, String> setPrimaryImage(@PathVariable Long id, @PathVariable Long imageId) {
        SetPrimaryMenuImageCommand command = SetPrimaryMenuImageCommand.builder()
                .menuId(id)
                .menuImageId(imageId)
                .build();
        setPrimaryMenuImageUseCase.setPrimaryMenuImage(command);
        return java.util.Map.of("message", "Set Primary Success");
    }

    @DeleteMapping("/{id}/menu-images/{imageId}")
    public java.util.Map<String, String> deleteImage(@PathVariable Long id, @PathVariable Long imageId) {
        DeleteMenuImageCommand command = DeleteMenuImageCommand.builder()
                .menuId(id)
                .menuImageId(imageId)
                .build();
        deleteMenuImageUseCase.deleteMenuImage(command);
        return java.util.Map.of("message", "Delete Image Success");
    }
}
