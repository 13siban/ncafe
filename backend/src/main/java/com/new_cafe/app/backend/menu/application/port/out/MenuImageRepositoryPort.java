package com.new_cafe.app.backend.menu.application.port.out;

import java.util.List;

import com.new_cafe.app.backend.menu.domain.model.MenuImage;

/**
 * 메뉴 이미지 영속성 아웃바운드 포트
 */
public interface MenuImageRepositoryPort {
    List<MenuImage> findAllByMenuId(Long menuId);
}
