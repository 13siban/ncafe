package com.new_cafe.app.backend.menuoption.adapter.out.persistence;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OptionGroupJpaRepository extends JpaRepository<OptionGroupJpaEntity, Long> {

    /**
     * 특정 메뉴의 실제 적용 옵션 그룹 조회
     * = 카테고리에 연결된 옵션 - 메뉴별 제외 옵션
     */
    @Query(value = """
        SELECT og.* FROM option_groups og
        JOIN category_option_group_map cogm ON og.id = cogm.option_group_id
        JOIN menus m ON m.category_id = cogm.category_id
        WHERE m.id = :menuId
          AND og.id NOT IN (
              SELECT moe.option_group_id
              FROM menu_option_exclusion moe
              WHERE moe.menu_id = :menuId
          )
        ORDER BY cogm.sort_order
    """, nativeQuery = true)
    List<OptionGroupJpaEntity> findOptionGroupsByMenuId(@Param("menuId") Long menuId);

    /**
     * 특정 카테고리에 연결된 옵션 그룹 조회
     */
    @Query(value = """
        SELECT og.* FROM option_groups og
        JOIN category_option_group_map cogm ON og.id = cogm.option_group_id
        WHERE cogm.category_id = :categoryId
        ORDER BY cogm.sort_order
    """, nativeQuery = true)
    List<OptionGroupJpaEntity> findOptionGroupsByCategoryId(@Param("categoryId") Long categoryId);
}
