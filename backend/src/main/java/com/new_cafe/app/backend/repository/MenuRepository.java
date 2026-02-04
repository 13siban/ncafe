package com.new_cafe.app.backend.repository;

import java.util.List;

import com.new_cafe.app.backend.entity.Menu;

public interface MenuRepository {
    List<Menu> findAll();
    
    List<Menu> findAllByCategoryId(Long categoryId);

	List<Menu> findAllByName(String name);

    List<Menu> findAllByCategoryAndSearchQuery(Long categoryId, String searchQuery);
}
