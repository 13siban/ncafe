package com.new_cafe.app.backend.admin.menu.application.port.out;

import java.util.List;
import com.new_cafe.app.backend.admin.menu.domain.model.Menu;

public interface LoadAdminMenuPort {
    Menu findById(Long id);
    List<Menu> findAll(Long categoryId, String searchQuery);
    boolean existsByEngNameIgnoreCase(String engName);
    boolean existsByEngNameAndIdNotIgnoreCase(String engName, Long id);
}
