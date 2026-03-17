package com.new_cafe.app.backend.menuoption.adapter.in.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.new_cafe.app.backend.menuoption.adapter.in.web.dto.CategoryOptionMapRequest;
import com.new_cafe.app.backend.menuoption.adapter.in.web.dto.MenuOptionExclusionRequest;

import com.new_cafe.app.backend.menuoption.application.command.CreateOptionGroupCommand;
import com.new_cafe.app.backend.menuoption.application.command.CreateOptionItemCommand;
import com.new_cafe.app.backend.menuoption.application.command.GetCategoryOptionsCommand;
import com.new_cafe.app.backend.menuoption.application.command.UpdateOptionGroupCommand;
import com.new_cafe.app.backend.menuoption.application.command.UpdateOptionItemCommand;
import com.new_cafe.app.backend.menuoption.application.port.in.GetCategoryOptionsUseCase;
import com.new_cafe.app.backend.menuoption.application.port.in.ManageCategoryOptionMapUseCase;
import com.new_cafe.app.backend.menuoption.application.port.in.ManageMenuOptionExclusionUseCase;
import com.new_cafe.app.backend.menuoption.application.port.in.ManageOptionGroupUseCase;
import com.new_cafe.app.backend.menuoption.application.port.in.ManageOptionItemUseCase;
import com.new_cafe.app.backend.menuoption.application.result.OptionGroupResult;
import com.new_cafe.app.backend.menuoption.application.result.OptionItemResult;

import lombok.RequiredArgsConstructor;

/**
 * 관리자 옵션 관리 API Controller
 *
 * 3-2. GET  /admin/categories/{id}/options
 * 3-3. POST /admin/categories/{id}/options, DELETE /admin/categories/{id}/options/{groupId}
 * 3-4. GET/POST/DELETE /admin/menus/{id}/option-exclusions
 * 3-5. GET/POST/PUT/DELETE /admin/option-groups
 * 3-6. GET/POST/PUT/DELETE /admin/option-groups/{id}/items
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminMenuOptionController {

    private final GetCategoryOptionsUseCase getCategoryOptionsUseCase;
    private final ManageCategoryOptionMapUseCase manageCategoryOptionMapUseCase;
    private final ManageMenuOptionExclusionUseCase manageMenuOptionExclusionUseCase;
    private final ManageOptionGroupUseCase manageOptionGroupUseCase;
    private final ManageOptionItemUseCase manageOptionItemUseCase;

    // ============================================
    // 3-2. 카테고리별 옵션 목록 조회
    // ============================================

    @GetMapping("/categories/{id}/options")
    public List<OptionGroupResult> getCategoryOptions(@PathVariable Long id) {
        GetCategoryOptionsCommand command = GetCategoryOptionsCommand.builder()
                .categoryId(id)
                .build();
        return getCategoryOptionsUseCase.getCategoryOptions(command);
    }

    // ============================================
    // 3-3. 카테고리 옵션 매핑 추가/삭제
    // ============================================

    @PostMapping("/categories/{id}/options")
    public Map<String, String> addCategoryOptionMap(
            @PathVariable Long id,
            @RequestBody CategoryOptionMapRequest request) {
        Integer sortOrder = request.getSortOrder() != null ? request.getSortOrder() : 1;
        manageCategoryOptionMapUseCase.addCategoryOptionMap(id, request.getOptionGroupId(), sortOrder);
        return Map.of("message", "Category option mapping added");
    }

    @DeleteMapping("/categories/{id}/options/{groupId}")
    public Map<String, String> removeCategoryOptionMap(
            @PathVariable Long id,
            @PathVariable Long groupId) {
        manageCategoryOptionMapUseCase.removeCategoryOptionMap(id, groupId);
        return Map.of("message", "Category option mapping removed");
    }

    // ============================================
    // 3-4. 메뉴별 옵션 제외 관리
    // ============================================

    @GetMapping("/menus/{id}/option-exclusions")
    public List<Long> getMenuOptionExclusions(@PathVariable Long id) {
        return manageMenuOptionExclusionUseCase.getExcludedOptionGroupIds(id);
    }

    @PostMapping("/menus/{id}/option-exclusions")
    public Map<String, String> addMenuOptionExclusion(
            @PathVariable Long id,
            @RequestBody MenuOptionExclusionRequest request) {
        manageMenuOptionExclusionUseCase.addExclusion(id, request.getOptionGroupId());
        return Map.of("message", "Menu option exclusion added");
    }

    @DeleteMapping("/menus/{id}/option-exclusions/{groupId}")
    public Map<String, String> removeMenuOptionExclusion(
            @PathVariable Long id,
            @PathVariable Long groupId) {
        manageMenuOptionExclusionUseCase.removeExclusion(id, groupId);
        return Map.of("message", "Menu option exclusion removed");
    }

    // ============================================
    // 3-5. 옵션 그룹 CRUD
    // ============================================

    @GetMapping("/option-groups")
    public List<OptionGroupResult> getAllOptionGroups() {
        return manageOptionGroupUseCase.getAllOptionGroups();
    }

    @PostMapping("/option-groups")
    public OptionGroupResult createOptionGroup(@RequestBody CreateOptionGroupCommand command) {
        return manageOptionGroupUseCase.createOptionGroup(command);
    }

    @PutMapping("/option-groups/{id}")
    public OptionGroupResult updateOptionGroup(
            @PathVariable Long id,
            @RequestBody UpdateOptionGroupCommand command) {
        UpdateOptionGroupCommand finalCommand = UpdateOptionGroupCommand.builder()
                .id(id)
                .name(command.getName())
                .type(command.getType())
                .isRequired(command.getIsRequired())
                .sortOrder(command.getSortOrder())
                .build();
        return manageOptionGroupUseCase.updateOptionGroup(finalCommand);
    }

    @DeleteMapping("/option-groups/{id}")
    public Map<String, String> deleteOptionGroup(@PathVariable Long id) {
        manageOptionGroupUseCase.deleteOptionGroup(id);
        return Map.of("message", "Option group deleted");
    }

    // ============================================
    // 3-6. 옵션 항목 CRUD
    // ============================================

    @GetMapping("/option-groups/{id}/items")
    public List<OptionItemResult> getOptionItems(@PathVariable Long id) {
        return manageOptionItemUseCase.getOptionItems(id);
    }

    @PostMapping("/option-groups/{id}/items")
    public OptionItemResult createOptionItem(
            @PathVariable Long id,
            @RequestBody CreateOptionItemCommand command) {
        CreateOptionItemCommand finalCommand = CreateOptionItemCommand.builder()
                .optionGroupId(id)
                .name(command.getName())
                .priceDelta(command.getPriceDelta())
                .sortOrder(command.getSortOrder())
                .build();
        return manageOptionItemUseCase.createOptionItem(finalCommand);
    }

    @PutMapping("/option-groups/{id}/items/{itemId}")
    public OptionItemResult updateOptionItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @RequestBody UpdateOptionItemCommand command) {
        UpdateOptionItemCommand finalCommand = UpdateOptionItemCommand.builder()
                .id(itemId)
                .name(command.getName())
                .priceDelta(command.getPriceDelta())
                .sortOrder(command.getSortOrder())
                .build();
        return manageOptionItemUseCase.updateOptionItem(finalCommand);
    }

    @DeleteMapping("/option-groups/{id}/items/{itemId}")
    public Map<String, String> deleteOptionItem(
            @PathVariable Long id,
            @PathVariable Long itemId) {
        manageOptionItemUseCase.deleteOptionItem(itemId);
        return Map.of("message", "Option item deleted");
    }
}
