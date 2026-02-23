package com.new_cafe.app.backend.menu.adapter.out.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.menu.domain.model.MenuImage;

@Repository
public interface MenuImageJpaRepository extends JpaRepository<MenuImage, Long> {
    List<MenuImage> findAllByMenuIdOrderBySortOrderAsc(Long menuId);
}
