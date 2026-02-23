package com.new_cafe.app.backend.menu.adapter.out.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.menu.domain.model.Menu;

@Repository
public interface MenuJpaRepository extends JpaRepository<Menu, Long>, JpaSpecificationExecutor<Menu> {
    List<Menu> findAllByCategoryId(Long categoryId);
}
