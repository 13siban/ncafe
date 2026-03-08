package com.new_cafe.app.backend.menuoption.application.port.in;

import java.util.List;

/**
 * 메뉴별 옵션 제외 관리 유스케이스 (Admin)
 */
public interface ManageMenuOptionExclusionUseCase {
    List<Long> getExcludedOptionGroupIds(Long menuId);
    void addExclusion(Long menuId, Long optionGroupId);
    void removeExclusion(Long menuId, Long optionGroupId);
}
