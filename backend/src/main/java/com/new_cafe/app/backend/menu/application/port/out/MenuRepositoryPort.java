package com.new_cafe.app.backend.menu.application.port.out;

import java.util.List;

import com.new_cafe.app.backend.menu.domain.model.Menu;

/**
 * 메뉴 영속성 아웃바운드 포트
 * Application 계층이 DB 기술에 직접 의존하지 않도록 추상화
 */
public interface MenuRepositoryPort {
    List<Menu> findAll();

    List<Menu> findAllByCategoryId(Long categoryId);

    List<Menu> findAllByName(String name);

    List<Menu> findAllByCategoryAndSearchQuery(Long categoryId, String searchQuery);

    Menu findById(Long id);
}
