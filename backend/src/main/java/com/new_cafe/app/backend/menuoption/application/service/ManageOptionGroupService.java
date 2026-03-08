package com.new_cafe.app.backend.menuoption.application.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.menuoption.application.command.CreateOptionGroupCommand;
import com.new_cafe.app.backend.menuoption.application.command.UpdateOptionGroupCommand;
import com.new_cafe.app.backend.menuoption.application.port.in.ManageOptionGroupUseCase;
import com.new_cafe.app.backend.menuoption.application.port.out.MenuOptionRepositoryPort;
import com.new_cafe.app.backend.menuoption.application.result.OptionGroupResult;
import com.new_cafe.app.backend.menuoption.application.result.OptionItemResult;
import com.new_cafe.app.backend.menuoption.domain.model.OptionGroup;

import lombok.RequiredArgsConstructor;

/**
 * 옵션 그룹 CRUD 서비스 (Admin)
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ManageOptionGroupService implements ManageOptionGroupUseCase {

    private final MenuOptionRepositoryPort menuOptionRepositoryPort;

    @Override
    @Transactional(readOnly = true)
    public List<OptionGroupResult> getAllOptionGroups() {
        List<OptionGroup> groups = menuOptionRepositoryPort.findAllOptionGroups();
        return groups.stream().map(this::toResult).toList();
    }

    @Override
    public OptionGroupResult createOptionGroup(CreateOptionGroupCommand command) {
        OptionGroup domain = OptionGroup.builder()
                .name(command.getName())
                .type(command.getType())
                .isRequired(command.getIsRequired())
                .sortOrder(command.getSortOrder())
                .build();
        OptionGroup saved = menuOptionRepositoryPort.saveOptionGroup(domain);
        return toResult(saved);
    }

    @Override
    public OptionGroupResult updateOptionGroup(UpdateOptionGroupCommand command) {
        OptionGroup existing = menuOptionRepositoryPort.findOptionGroupById(command.getId());
        if (existing == null) return null;

        OptionGroup updated = OptionGroup.builder()
                .id(command.getId())
                .name(command.getName())
                .type(command.getType())
                .isRequired(command.getIsRequired())
                .sortOrder(command.getSortOrder())
                .build();
        OptionGroup saved = menuOptionRepositoryPort.saveOptionGroup(updated);
        return toResult(saved);
    }

    @Override
    public void deleteOptionGroup(Long groupId) {
        menuOptionRepositoryPort.deleteOptionGroupById(groupId);
    }

    private OptionGroupResult toResult(OptionGroup group) {
        List<OptionItemResult> itemResults = (group.getItems() != null)
                ? group.getItems().stream()
                    .map(item -> OptionItemResult.builder()
                            .id(item.getId())
                            .optionGroupId(item.getOptionGroupId())
                            .name(item.getName())
                            .priceDelta(item.getPriceDelta())
                            .sortOrder(item.getSortOrder())
                            .build())
                    .toList()
                : List.of();

        return OptionGroupResult.builder()
                .id(group.getId())
                .name(group.getName())
                .type(group.getType())
                .isRequired(group.getIsRequired())
                .sortOrder(group.getSortOrder())
                .items(itemResults)
                .build();
    }
}
