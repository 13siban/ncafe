package com.new_cafe.app.backend.menu.application.port.out;

import java.util.List;
import com.new_cafe.app.backend.menu.domain.model.Menu;

public interface MenuRepositoryPort {
    List<Menu> findAll();
    List<Menu> findAllByCategoryId(Long categoryId);
    List<Menu> findAllByName(String name);
    List<Menu> findAllByCategoryAndSearchQuery(Long categoryId, String searchQuery);
    
    // 고도화된 조회 포트 추가
    List<Menu> findPagedMenus(Long categoryId, String searchQuery, Integer page, Integer size, String sortBy, Boolean onlyAvailable);
    
    Menu findById(Long id);
}
