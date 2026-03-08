package com.new_cafe.app.backend.menuoption.application.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.menuoption.application.command.CreateOptionItemCommand;
import com.new_cafe.app.backend.menuoption.application.command.UpdateOptionItemCommand;
import com.new_cafe.app.backend.menuoption.application.port.in.ManageOptionItemUseCase;
import com.new_cafe.app.backend.menuoption.application.port.out.MenuOptionRepositoryPort;
import com.new_cafe.app.backend.menuoption.application.result.OptionItemResult;
import com.new_cafe.app.backend.menuoption.domain.model.OptionGroup;
import com.new_cafe.app.backend.menuoption.domain.model.OptionItem;

import lombok.RequiredArgsConstructor;

/**
 * 옵션 항목 CRUD 서비스 (Admin)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ManageOptionItemService implements ManageOptionItemUseCase {

    private final MenuOptionRepositoryPort menuOptionRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public List<OptionItemResult> getOptionItems(Long groupId) {
        OptionGroup group = menuOptionRepositoryPort.findOptionGroupById(groupId);
        if (group == null || group.getItems() == null) return List.of();

        return group.getItems().stream()
                .map(this::toResult)
                .toList();
    }

    @Override
    public OptionItemResult createOptionItem(CreateOptionItemCommand command) {
        OptionItem domain = OptionItem.builder()
                .optionGroupId(command.getOptionGroupId())
                .name(command.getName())
                .priceDelta(command.getPriceDelta())
                .sortOrder(command.getSortOrder())
                .build();
        OptionItem saved = menuOptionRepositoryPort.saveOptionItem(domain);
        return toResult(saved);
    }

    @Override
    public OptionItemResult updateOptionItem(UpdateOptionItemCommand command) {
        OptionItem domain = OptionItem.builder()
                .id(command.getId())
                .name(command.getName())
                .priceDelta(command.getPriceDelta())
                .sortOrder(command.getSortOrder())
                .build();
        OptionItem updated = menuOptionRepositoryPort.updateOptionItem(domain);
        return updated != null ? toResult(updated) : null;
    }

    @Override
    public void deleteOptionItem(Long itemId) {
        menuOptionRepositoryPort.deleteOptionItemById(itemId);
    }

    private OptionItemResult toResult(OptionItem item) {
        return OptionItemResult.builder()
                .id(item.getId())
                .optionGroupId(item.getOptionGroupId())
                .name(item.getName())
                .priceDelta(item.getPriceDelta())
                .sortOrder(item.getSortOrder())
                .build();
    }
}
