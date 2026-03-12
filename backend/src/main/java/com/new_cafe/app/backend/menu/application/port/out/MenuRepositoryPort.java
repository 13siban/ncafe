package com.new_cafe.app.backend.menu.application.port.out;

import java.util.List;
import com.new_cafe.app.backend.menu.domain.model.Menu;

/**
 * public 컨텍스트 — 조회 전용 Port
 */
public interface MenuRepositoryPort {
    List<Menu> findAll();
    List<Menu> findAllByCategoryId(Long categoryId);
    List<Menu> findAllByName(String name);
    List<Menu> findAllByCategoryAndSearchQuery(Long categoryId, String searchQuery);
    List<Menu> findPagedMenus(Long categoryId, String searchQuery, Integer page, Integer size, String sortBy, Boolean onlyAvailable);
    Menu findById(Long id);
    Menu findByEngName(String engName);
}
