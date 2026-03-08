package com.new_cafe.app.backend.menuoption.adapter.out.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MenuOptionExclusionJpaRepository extends JpaRepository<MenuOptionExclusionJpaEntity, Long> {

    List<MenuOptionExclusionJpaEntity> findByMenuId(Long menuId);

    Optional<MenuOptionExclusionJpaEntity> findByMenuIdAndOptionGroupId(Long menuId, Long optionGroupId);

    void deleteByMenuIdAndOptionGroupId(Long menuId, Long optionGroupId);
}
