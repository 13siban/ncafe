package com.new_cafe.app.backend.menu.adapter.out.persistence;

import java.util.List;

import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.menu.application.port.out.MenuImageRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.MenuImage;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class MenuImagePersistenceAdapter implements MenuImageRepositoryPort {

    private final MenuImageJpaRepository menuImageJpaRepository;

    @Override
    public List<MenuImage> findAllByMenuId(Long menuId) {
        return menuImageJpaRepository.findAllByMenuIdOrderBySortOrderAsc(menuId).stream()
                .map(this::toDomain)
                .toList();
    }

    private MenuImage toDomain(MenuImageJpaEntity entity) {
        return MenuImage.builder()
                .id(entity.getId())
                .menuId(entity.getMenuId())
                .srcUrl(entity.getSrcUrl())
                .sortOrder(entity.getSortOrder())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
