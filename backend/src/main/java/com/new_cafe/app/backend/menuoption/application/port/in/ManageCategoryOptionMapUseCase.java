package com.new_cafe.app.backend.menuoption.application.port.in;

/**
 * 카테고리 옵션 매핑 관리 유스케이스 (Admin)
 */
public interface ManageCategoryOptionMapUseCase {
    void addCategoryOptionMap(Long categoryId, Long optionGroupId, Integer sortOrder);
    void removeCategoryOptionMap(Long categoryId, Long optionGroupId);
}
