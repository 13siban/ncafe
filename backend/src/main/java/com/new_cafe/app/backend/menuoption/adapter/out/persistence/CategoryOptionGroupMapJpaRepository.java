package com.new_cafe.app.backend.menuoption.adapter.out.persistence;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryOptionGroupMapJpaRepository extends JpaRepository<CategoryOptionGroupMapJpaEntity, Long> {

    Optional<CategoryOptionGroupMapJpaEntity> findByCategoryIdAndOptionGroupId(Long categoryId, Long optionGroupId);

    void deleteByCategoryIdAndOptionGroupId(Long categoryId, Long optionGroupId);
}
