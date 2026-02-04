package com.new_cafe.app.backend.service;

import java.util.List;

import com.new_cafe.app.backend.entity.Category;

public interface CategoryService {
    List<Category> getAll();
    Category getById(Long id);
}
