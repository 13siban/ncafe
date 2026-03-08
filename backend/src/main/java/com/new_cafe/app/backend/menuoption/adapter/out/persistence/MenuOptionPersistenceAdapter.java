package com.new_cafe.app.backend.menuoption.adapter.out.persistence;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.menuoption.application.port.out.MenuOptionRepositoryPort;
import com.new_cafe.app.backend.menuoption.domain.model.OptionGroup;
import com.new_cafe.app.backend.menuoption.domain.model.OptionItem;

import lombok.RequiredArgsConstructor;

/**
 * 메뉴 옵션 Persistence Adapter
 * JpaEntity ↔ Domain 변환을 담당
 */
@Repository
@RequiredArgsConstructor
public class MenuOptionPersistenceAdapter implements MenuOptionRepositoryPort {

    private final OptionGroupJpaRepository optionGroupRepo;
    private final OptionItemJpaRepository optionItemRepo;
    private final CategoryOptionGroupMapJpaRepository categoryOptionGroupMapRepo;
    private final MenuOptionExclusionJpaRepository menuOptionExclusionRepo;

    @Override
    public List<OptionGroup> findOptionGroupsByMenuId(Long menuId) {
        List<OptionGroupJpaEntity> groups = optionGroupRepo.findOptionGroupsByMenuId(menuId);
        return toDomainsWithItems(groups);
    }

    @Override
    public List<OptionGroup> findOptionGroupsByCategoryId(Long categoryId) {
        List<OptionGroupJpaEntity> groups = optionGroupRepo.findOptionGroupsByCategoryId(categoryId);
        return toDomainsWithItems(groups);
    }

    @Override
    public List<OptionGroup> findAllOptionGroups() {
        List<OptionGroupJpaEntity> groups = optionGroupRepo.findAll();
        return toDomainsWithItems(groups);
    }

    @Override
    public OptionGroup findOptionGroupById(Long groupId) {
        return optionGroupRepo.findById(groupId)
                .map(entity -> {
                    List<OptionItemJpaEntity> items = optionItemRepo.findByOptionGroupIdOrderBySortOrder(entity.getId());
                    return toDomain(entity, items);
                })
                .orElse(null);
    }

    @Override
    public OptionGroup saveOptionGroup(OptionGroup optionGroup) {
        OptionGroupJpaEntity entity = OptionGroupJpaEntity.builder()
                .name(optionGroup.getName())
                .type(optionGroup.getType())
                .isRequired(optionGroup.getIsRequired())
                .sortOrder(optionGroup.getSortOrder())
                .build();
        OptionGroupJpaEntity saved = optionGroupRepo.save(entity);
        return toDomain(saved, List.of());
    }

    @Override
    public void deleteOptionGroupById(Long groupId) {
        optionGroupRepo.deleteById(groupId);
    }

    @Override
    public OptionItem saveOptionItem(OptionItem optionItem) {
        OptionItemJpaEntity entity = OptionItemJpaEntity.builder()
                .optionGroupId(optionItem.getOptionGroupId())
                .name(optionItem.getName())
                .priceDelta(optionItem.getPriceDelta())
                .sortOrder(optionItem.getSortOrder())
                .build();
        OptionItemJpaEntity saved = optionItemRepo.save(entity);
        return toItemDomain(saved);
    }

    @Override
    public OptionItem updateOptionItem(OptionItem optionItem) {
        OptionItemJpaEntity entity = optionItemRepo.findById(optionItem.getId()).orElse(null);
        if (entity == null) return null;
        entity.setName(optionItem.getName());
        entity.setPriceDelta(optionItem.getPriceDelta());
        entity.setSortOrder(optionItem.getSortOrder());
        OptionItemJpaEntity saved = optionItemRepo.save(entity);
        return toItemDomain(saved);
    }

    @Override
    public void deleteOptionItemById(Long itemId) {
        optionItemRepo.deleteById(itemId);
    }

    @Override
    public void addCategoryOptionGroupMap(Long categoryId, Long optionGroupId, Integer sortOrder) {
        // 이미 존재하면 무시
        if (categoryOptionGroupMapRepo.findByCategoryIdAndOptionGroupId(categoryId, optionGroupId).isPresent()) {
            return;
        }
        CategoryOptionGroupMapJpaEntity entity = CategoryOptionGroupMapJpaEntity.builder()
                .categoryId(categoryId)
                .optionGroupId(optionGroupId)
                .sortOrder(sortOrder)
                .build();
        categoryOptionGroupMapRepo.save(entity);
    }

    @Override
    @Transactional
    public void removeCategoryOptionGroupMap(Long categoryId, Long optionGroupId) {
        categoryOptionGroupMapRepo.deleteByCategoryIdAndOptionGroupId(categoryId, optionGroupId);
    }

    @Override
    public void addMenuOptionExclusion(Long menuId, Long optionGroupId) {
        // 이미 존재하면 무시
        if (menuOptionExclusionRepo.findByMenuIdAndOptionGroupId(menuId, optionGroupId).isPresent()) {
            return;
        }
        MenuOptionExclusionJpaEntity entity = MenuOptionExclusionJpaEntity.builder()
                .menuId(menuId)
                .optionGroupId(optionGroupId)
                .build();
        menuOptionExclusionRepo.save(entity);
    }

    @Override
    @Transactional
    public void removeMenuOptionExclusion(Long menuId, Long optionGroupId) {
        menuOptionExclusionRepo.deleteByMenuIdAndOptionGroupId(menuId, optionGroupId);
    }

    @Override
    public List<Long> findExcludedOptionGroupIdsByMenuId(Long menuId) {
        return menuOptionExclusionRepo.findByMenuId(menuId).stream()
                .map(MenuOptionExclusionJpaEntity::getOptionGroupId)
                .toList();
    }

    // ========== 변환 메서드 ==========

    /**
     * 옵션 그룹 리스트를 도메인으로 변환 (items 포함, 일괄 조회)
     */
    private List<OptionGroup> toDomainsWithItems(List<OptionGroupJpaEntity> groups) {
        if (groups.isEmpty()) return List.of();

        List<Long> groupIds = groups.stream().map(OptionGroupJpaEntity::getId).toList();
        List<OptionItemJpaEntity> allItems = optionItemRepo.findByOptionGroupIdInOrderBySortOrder(groupIds);

        // groupId → items 매핑
        Map<Long, List<OptionItemJpaEntity>> itemsByGroupId = allItems.stream()
                .collect(Collectors.groupingBy(OptionItemJpaEntity::getOptionGroupId));

        return groups.stream()
                .map(group -> toDomain(group, itemsByGroupId.getOrDefault(group.getId(), List.of())))
                .toList();
    }

    private OptionGroup toDomain(OptionGroupJpaEntity entity, List<OptionItemJpaEntity> itemEntities) {
        List<OptionItem> items = itemEntities.stream()
                .map(this::toItemDomain)
                .toList();

        return OptionGroup.builder()
                .id(entity.getId())
                .name(entity.getName())
                .type(entity.getType())
                .isRequired(entity.getIsRequired())
                .sortOrder(entity.getSortOrder())
                .items(items)
                .build();
    }

    private OptionItem toItemDomain(OptionItemJpaEntity entity) {
        return OptionItem.builder()
                .id(entity.getId())
                .optionGroupId(entity.getOptionGroupId())
                .name(entity.getName())
                .priceDelta(entity.getPriceDelta())
                .sortOrder(entity.getSortOrder())
                .build();
    }
}
