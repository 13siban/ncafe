package com.new_cafe.app.backend.menu.adapter.out.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface MenuJpaRepository extends JpaRepository<MenuJpaEntity, Long>, JpaSpecificationExecutor<MenuJpaEntity> {
    List<MenuJpaEntity> findAllByCategoryId(Long categoryId);
}
