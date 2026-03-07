package com.new_cafe.app.backend.admin.menu.adapter.out.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface AdminMenuImageJpaRepository extends JpaRepository<AdminMenuImageJpaEntity, Long> {
    List<AdminMenuImageJpaEntity> findByMenuIdOrderBySortOrderAsc(Long menuId);
    
    @Modifying
    @Transactional
    void deleteByMenuId(Long menuId);
}
