package com.new_cafe.app.backend.repository;

import java.util.List;

import com.new_cafe.app.backend.entity.MenuImage;

public interface MenuImageRepository {
    List<MenuImage> findAllByMenuId(Long menuId);
}
