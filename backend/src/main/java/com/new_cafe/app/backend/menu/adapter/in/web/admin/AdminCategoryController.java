package com.new_cafe.app.backend.menu.adapter.in.web.admin;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RestController;

import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.CategoryResponse;
import com.new_cafe.app.backend.menu.application.port.in.CategoryUseCase;
import com.new_cafe.app.backend.menu.domain.model.Category;

@RestController
public class AdminCategoryController {

    private final CategoryUseCase categoryUseCase;

    public AdminCategoryController(CategoryUseCase categoryUseCase) {
        this.categoryUseCase = categoryUseCase;
    }

    // 목록 조회 데이터 반환
    @GetMapping("/admin/categories")
    public List<CategoryResponse> list() {
        return categoryUseCase.getAll();
    }

    // 상세 조회 데이터 반환
    @GetMapping("/admin/categories/{id}")
    public String details() {
        return "Category Details";
    }

    // 카테고리 생성
    @PostMapping("/admin/categories")
    public String create(Category category) {
        return "Create Category";
    }

    // 카테고리 수정
    @PutMapping("/admin/categories/{id}")
    public String update(Category category) {
        return "Update Category";
    }

    // 카테고리 삭제
    @DeleteMapping("/admin/categories/{id}")
    public String delete() {
        return "Delete Category";
    }
}
