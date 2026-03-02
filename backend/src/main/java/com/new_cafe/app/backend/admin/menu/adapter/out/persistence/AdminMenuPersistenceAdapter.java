package com.new_cafe.app.backend.admin.menu.adapter.out.persistence;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.admin.menu.application.port.out.*;
import com.new_cafe.app.backend.admin.menu.domain.model.Menu;
import com.new_cafe.app.backend.admin.menu.domain.model.MenuImage;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

/**
 * Admin 컨텍스트의 메뉴 및 이미지 관련 모든 영속성 작업을 통합 처리하는 어댑터
 */
@Repository
@RequiredArgsConstructor
public class AdminMenuPersistenceAdapter implements 
        LoadAdminMenuPort, SaveAdminMenuPort, DeleteAdminMenuPort,
        LoadAdminMenuImagePort, SaveAdminMenuImagePort, DeleteAdminMenuImagePort {

    private final AdminMenuJpaRepository adminMenuJpaRepository;
    private final AdminMenuImageJpaRepository adminMenuImageJpaRepository;

    // ========== Menu Operations (LoadAdminMenuPort, SaveAdminMenuPort, DeleteAdminMenuPort) ==========

    @Override
    public Menu findById(Long id) {
        return adminMenuJpaRepository.findById(id)
                .map(this::toMenuDomain)
                .orElse(null);
    }

    @Override
    public List<Menu> findAll(Long categoryId, String searchQuery) {
        Specification<AdminMenuJpaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("categoryId"), categoryId));
            }
            if (searchQuery != null && !searchQuery.isEmpty()) {
                predicates.add(cb.like(root.get("korName"), "%" + searchQuery + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by(Sort.Direction.ASC, "sortOrder", "id");

        return adminMenuJpaRepository.findAll(spec, sort).stream()
                .map(this::toMenuDomain)
                .toList();
    }

    @Override
    public Menu save(Menu menu) {
        AdminMenuJpaEntity entity = toMenuJpaEntity(menu);
        AdminMenuJpaEntity saved = adminMenuJpaRepository.save(entity);
        return toMenuDomain(saved);
    }

    @Override
    public void deleteById(Long id) {
        adminMenuJpaRepository.deleteById(id);
    }

    // ========== MenuImage Operations (LoadAdminMenuImagePort, SaveAdminMenuImagePort, DeleteAdminMenuImagePort) ==========

    @Override
    public List<MenuImage> findByMenuId(Long menuId) {
        return adminMenuImageJpaRepository.findByMenuIdOrderBySortOrderAsc(menuId).stream()
                .map(this::toImageDomain)
                .collect(Collectors.toList());
    }

    @Override
    public MenuImage findImageById(Long id) {
        return adminMenuImageJpaRepository.findById(id)
                .map(this::toImageDomain)
                .orElse(null);
    }

    @Override
    public MenuImage save(MenuImage menuImage) {
        AdminMenuImageJpaEntity entity = toImageJpaEntity(menuImage);
        return toImageDomain(adminMenuImageJpaRepository.save(entity));
    }

    @Override
    public void saveAll(List<MenuImage> menuImages) {
        List<AdminMenuImageJpaEntity> entities = menuImages.stream()
                .map(this::toImageJpaEntity)
                .collect(Collectors.toList());
        adminMenuImageJpaRepository.saveAll(entities);
    }

    @Override
    public void deleteImageById(Long id) {
        adminMenuImageJpaRepository.deleteById(id);
    }

    // ========== Mappers ==========

    private Menu toMenuDomain(AdminMenuJpaEntity entity) {
        return Menu.builder()
                .id(entity.getId())
                .korName(entity.getKorName())
                .engName(entity.getEngName())
                .description(entity.getDescription())
                .price(entity.getPrice())
                .categoryId(entity.getCategoryId())
                .isAvailable(entity.getIsAvailable())
                .isSoldOut(entity.getIsSoldOut())
                .sortOrder(entity.getSortOrder())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private AdminMenuJpaEntity toMenuJpaEntity(Menu menu) {
        return AdminMenuJpaEntity.builder()
                .id(menu.getId())
                .korName(menu.getKorName())
                .engName(menu.getEngName())
                .description(menu.getDescription())
                .price(menu.getPrice())
                .categoryId(menu.getCategoryId())
                .isAvailable(menu.getIsAvailable())
                .isSoldOut(menu.getIsSoldOut())
                .sortOrder(menu.getSortOrder())
                .createdAt(menu.getCreatedAt())
                .updatedAt(menu.getUpdatedAt())
                .build();
    }

    private MenuImage toImageDomain(AdminMenuImageJpaEntity entity) {
        return MenuImage.builder()
                .id(entity.getId())
                .menuId(entity.getMenuId())
                .srcUrl(entity.getSrcUrl())
                .sortOrder(entity.getSortOrder())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private AdminMenuImageJpaEntity toImageJpaEntity(MenuImage domain) {
        return AdminMenuImageJpaEntity.builder()
                .id(domain.getId())
                .menuId(domain.getMenuId())
                .srcUrl(domain.getSrcUrl())
                .sortOrder(domain.getSortOrder())
                .createdAt(domain.getCreatedAt())
                .build();
    }
}
