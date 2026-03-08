package com.new_cafe.app.backend.menuoption.application.port.out;

import java.util.List;

import com.new_cafe.app.backend.menuoption.domain.model.OptionGroup;

/**
 * 메뉴 옵션 아웃바운드 포트 — Persistence 추상화
 */
public interface MenuOptionRepositoryPort {

    /**
     * 특정 메뉴의 실제 적용 옵션 조회
     * (카테고리 기본 옵션 - 메뉴별 제외 옵션)
     * 각 OptionGroup에 items가 포함된 상태로 반환
     */
    List<OptionGroup> findOptionGroupsByMenuId(Long menuId);

    /**
     * 특정 카테고리에 연결된 옵션 그룹 목록 조회
     */
    List<OptionGroup> findOptionGroupsByCategoryId(Long categoryId);

    /**
     * 전체 옵션 그룹 목록 조회 (items 포함)
     */
    List<OptionGroup> findAllOptionGroups();

    /**
     * 옵션 그룹 단건 조회
     */
    OptionGroup findOptionGroupById(Long groupId);

    /**
     * 옵션 그룹 저장 (생성/수정)
     */
    OptionGroup saveOptionGroup(OptionGroup optionGroup);

    /**
     * 옵션 그룹 삭제
     */
    void deleteOptionGroupById(Long groupId);

    /**
     * 옵션 항목 저장
     */
    com.new_cafe.app.backend.menuoption.domain.model.OptionItem saveOptionItem(com.new_cafe.app.backend.menuoption.domain.model.OptionItem optionItem);

    /**
     * 옵션 항목 수정
     */
    com.new_cafe.app.backend.menuoption.domain.model.OptionItem updateOptionItem(com.new_cafe.app.backend.menuoption.domain.model.OptionItem optionItem);

    /**
     * 옵션 항목 삭제
     */
    void deleteOptionItemById(Long itemId);

    /**
     * 카테고리에 옵션 그룹 연결
     */
    void addCategoryOptionGroupMap(Long categoryId, Long optionGroupId, Integer sortOrder);

    /**
     * 카테고리에서 옵션 그룹 연결 해제
     */
    void removeCategoryOptionGroupMap(Long categoryId, Long optionGroupId);

    /**
     * 메뉴에 옵션 제외 추가
     */
    void addMenuOptionExclusion(Long menuId, Long optionGroupId);

    /**
     * 메뉴에서 옵션 제외 해제
     */
    void removeMenuOptionExclusion(Long menuId, Long optionGroupId);

    /**
     * 특정 메뉴의 제외된 옵션 그룹 ID 목록 조회
     */
    List<Long> findExcludedOptionGroupIdsByMenuId(Long menuId);
}
