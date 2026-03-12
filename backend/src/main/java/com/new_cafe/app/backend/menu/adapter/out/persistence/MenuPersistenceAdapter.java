package com.new_cafe.app.backend.menu.adapter.out.persistence;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

import com.new_cafe.app.backend.menu.application.port.out.MenuRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.Menu;

import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class MenuPersistenceAdapter implements MenuRepositoryPort {

    private final MenuJpaRepository menuJpaRepository;

    @Override
    public List<Menu> findAll() {
        return findPagedMenus(null, null, null, null, "sort_order", null);
    }

    @Override
    public List<Menu> findAllByCategoryId(Long categoryId) {
        return findPagedMenus(categoryId, null, null, null, "sort_order", null);
    }

    @Override
    public List<Menu> findAllByName(String name) {
        return findPagedMenus(null, name, null, null, "sort_order", null);
    }

    @Override
    public List<Menu> findAllByCategoryAndSearchQuery(Long categoryId, String searchQuery) {
        return findPagedMenus(categoryId, searchQuery, null, null, "sort_order", null);
    }

    @Override
    public List<Menu> findPagedMenus(Long categoryId, String searchQuery, Integer page, Integer size, String sortBy, Boolean onlyAvailable) {
        Specification<MenuJpaEntity> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("categoryId"), categoryId));
            }
            if (searchQuery != null && !searchQuery.isEmpty()) {
                predicates.add(cb.like(root.get("korName"), "%" + searchQuery + "%"));
            }
            if (Boolean.TRUE.equals(onlyAvailable)) {
                predicates.add(cb.isTrue(root.get("isAvailable")));
                predicates.add(cb.isFalse(root.get("isSoldOut")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by(Sort.Direction.ASC, "sortOrder", "id");
        if ("price_asc".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "price");
        } else if ("price_desc".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "price");
        } else if ("newest".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        }

        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page - 1, size, sort);
            return menuJpaRepository.findAll(spec, pageable).getContent().stream()
                    .map(this::toDomain)
                    .toList();
        } else {
            return menuJpaRepository.findAll(spec, sort).stream()
                    .map(this::toDomain)
                    .toList();
        }
    }

    @Override
    public Menu findById(Long id) {
        return menuJpaRepository.findById(id)
                .map(this::toDomain)
                .orElse(null);
    }

    @Override
    public Menu findByEngName(String engName) {
        return menuJpaRepository.findByEngNameIgnoreCase(engName)
                .map(this::toDomain)
                .orElse(null);
    }

    // ========== 변환 메서드 ==========

    private Menu toDomain(MenuJpaEntity entity) {
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
}
