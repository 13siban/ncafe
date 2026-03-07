package com.new_cafe.app.backend.admin.menu.application.port.out;

import com.new_cafe.app.backend.admin.menu.domain.model.MenuImage;

public interface DeleteAdminMenuImagePort {
    void deleteImageById(Long id);
    void deleteImagesByMenuId(Long menuId);
}
