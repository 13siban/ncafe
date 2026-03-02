package com.new_cafe.app.backend.admin.menu.application.port.out;

import java.util.List;
import com.new_cafe.app.backend.admin.menu.domain.model.MenuImage;

public interface LoadAdminMenuImagePort {
    List<MenuImage> findByMenuId(Long menuId);
    MenuImage findImageById(Long id);
}
