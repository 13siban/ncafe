package com.new_cafe.app.backend.menu.adapter.out.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenuImageJpaRepository extends JpaRepository<MenuImageJpaEntity, Long> {
    List<MenuImageJpaEntity> findAllByMenuIdOrderBySortOrderAsc(Long menuId);
}
