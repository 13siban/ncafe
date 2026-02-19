package com.new_cafe.app.backend.menu.application.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.CategoryResponse;
import com.new_cafe.app.backend.menu.application.port.in.CategoryUseCase;
import com.new_cafe.app.backend.menu.application.port.out.CategoryRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.Category;

@Service
public class CategoryService implements CategoryUseCase {

    private final CategoryRepositoryPort categoryRepositoryPort;

    public CategoryService(CategoryRepositoryPort categoryRepositoryPort) {
        this.categoryRepositoryPort = categoryRepositoryPort;
    }

    @Override
    public List<CategoryResponse> getAll() {
        return categoryRepositoryPort.findAllWithMenuCount();
    }

    @Override
    public Category getById(Long id) {
        return categoryRepositoryPort.findById(id);
    }
}
