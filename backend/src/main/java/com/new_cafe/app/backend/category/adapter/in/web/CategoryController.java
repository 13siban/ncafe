package com.new_cafe.app.backend.category.adapter.in.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.new_cafe.app.backend.category.adapter.in.web.dto.response.CategoryResponse;
import com.new_cafe.app.backend.category.application.port.in.GetCategoryDetailUseCase;
import com.new_cafe.app.backend.category.application.port.in.GetCategoryListUseCase;
import com.new_cafe.app.backend.category.domain.model.Category;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final GetCategoryListUseCase getCategoryListUseCase;
    private final GetCategoryDetailUseCase getCategoryDetailUseCase;

    // 카테고리 목록 조회
    @GetMapping
    public List<CategoryResponse> list() {
        return getCategoryListUseCase.getAll();
    }

    // 카테고리 상세 조회
    @GetMapping("/{id}")
    public Category details(@PathVariable Long id) {
        return getCategoryDetailUseCase.getById(id);
    }
}
