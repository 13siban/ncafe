package com.new_cafe.app.backend.admin.category.adapter.in.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.new_cafe.app.backend.admin.category.application.command.CreateCategoryCommand;
import com.new_cafe.app.backend.admin.category.application.command.DeleteCategoryCommand;
import com.new_cafe.app.backend.admin.category.application.command.UpdateCategoryCommand;
import com.new_cafe.app.backend.admin.category.application.port.in.CreateCategoryUseCase;
import com.new_cafe.app.backend.admin.category.application.port.in.DeleteCategoryUseCase;
import com.new_cafe.app.backend.admin.category.application.port.in.UpdateCategoryUseCase;
import com.new_cafe.app.backend.admin.category.application.result.CreateCategoryResult;
import com.new_cafe.app.backend.category.application.port.in.GetCategoryDetailUseCase;
import com.new_cafe.app.backend.category.application.port.in.GetCategoryListUseCase;
import com.new_cafe.app.backend.category.adapter.in.web.dto.response.CategoryResponse;
import com.new_cafe.app.backend.category.domain.model.Category;

import java.util.List;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final GetCategoryListUseCase getCategoryListUseCase;
    private final GetCategoryDetailUseCase getCategoryDetailUseCase;
    private final CreateCategoryUseCase createCategoryUseCase;
    private final UpdateCategoryUseCase updateCategoryUseCase;
    private final DeleteCategoryUseCase deleteCategoryUseCase;

    // 목록 조회
    @GetMapping
    public List<CategoryResponse> list() {
        return getCategoryListUseCase.getAll();
    }

    // 상세 조회
    @GetMapping("/{id}")
    public Category details(@PathVariable Long id) {
        return getCategoryDetailUseCase.getById(id);
    }

    // 카테고리 생성
    @PostMapping
    public CreateCategoryResult create(@RequestBody CreateCategoryCommand command) {
        return createCategoryUseCase.createCategory(command);
    }

    // 카테고리 수정
    @PutMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void update(@PathVariable Long id, @RequestBody UpdateCategoryCommand command) {
        UpdateCategoryCommand finalCommand = UpdateCategoryCommand.builder()
                .id(id)
                .name(command.getName())
                .sortOrder(command.getSortOrder())
                .build();
        updateCategoryUseCase.updateCategory(finalCommand);
    }

    // 카테고리 삭제
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        deleteCategoryUseCase.deleteCategory(new DeleteCategoryCommand(id));
    }
}
