package com.new_cafe.app.backend.menuoption.application.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.menuoption.application.port.in.ManageMenuOptionExclusionUseCase;
import com.new_cafe.app.backend.menuoption.application.port.out.MenuOptionRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * 메뉴별 옵션 제외 관리 서비스 (Admin)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ManageMenuOptionExclusionService implements ManageMenuOptionExclusionUseCase {

    private final MenuOptionRepositoryPort menuOptionRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public List<Long> getExcludedOptionGroupIds(Long menuId) {
        return menuOptionRepositoryPort.findExcludedOptionGroupIdsByMenuId(menuId);
    }

    @Override
    public void addExclusion(Long menuId, Long optionGroupId) {
        menuOptionRepositoryPort.addMenuOptionExclusion(menuId, optionGroupId);
    }

    @Override
    public void removeExclusion(Long menuId, Long optionGroupId) {
        menuOptionRepositoryPort.removeMenuOptionExclusion(menuId, optionGroupId);
    }
}
