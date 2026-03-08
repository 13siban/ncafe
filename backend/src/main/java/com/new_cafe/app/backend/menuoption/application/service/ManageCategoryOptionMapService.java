package com.new_cafe.app.backend.menuoption.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.menuoption.application.port.in.ManageCategoryOptionMapUseCase;
import com.new_cafe.app.backend.menuoption.application.port.out.MenuOptionRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * 카테고리 옵션 매핑 관리 서비스 (Admin)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ManageCategoryOptionMapService implements ManageCategoryOptionMapUseCase {

    private final MenuOptionRepositoryPort menuOptionRepositoryPort;

    @Override
    public void addCategoryOptionMap(Long categoryId, Long optionGroupId, Integer sortOrder) {
        menuOptionRepositoryPort.addCategoryOptionGroupMap(categoryId, optionGroupId, sortOrder);
    }

    @Override
    public void removeCategoryOptionMap(Long categoryId, Long optionGroupId) {
        menuOptionRepositoryPort.removeCategoryOptionGroupMap(categoryId, optionGroupId);
    }
}
