package com.new_cafe.app.backend.menuoption.adapter.out.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OptionItemJpaRepository extends JpaRepository<OptionItemJpaEntity, Long> {

    List<OptionItemJpaEntity> findByOptionGroupIdOrderBySortOrder(Long optionGroupId);

    List<OptionItemJpaEntity> findByOptionGroupIdInOrderBySortOrder(List<Long> optionGroupIds);
}
