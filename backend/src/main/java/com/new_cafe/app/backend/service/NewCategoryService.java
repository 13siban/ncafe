package com.new_cafe.app.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.new_cafe.app.backend.entity.Category;
import com.new_cafe.app.backend.repository.CategoryRepository;

@Service
public class NewCategoryService implements CategoryService {

    private CategoryRepository categoryRepository;
    public NewCategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public List<Category> getAll() {
        List<Category> list = categoryRepository.findAll();
        return list;
    }

    @Override
    public Category getById(Long id) {
        return categoryRepository.findById(id);
    }
}
