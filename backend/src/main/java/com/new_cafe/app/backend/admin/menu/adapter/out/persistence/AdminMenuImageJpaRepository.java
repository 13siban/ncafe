package com.new_cafe.app.backend.admin.menu.adapter.out.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminMenuImageJpaRepository extends JpaRepository<AdminMenuImageJpaEntity, Long> {
    List<AdminMenuImageJpaEntity> findByMenuIdOrderBySortOrderAsc(Long menuId);
}
