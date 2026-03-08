package com.new_cafe.app.backend.menuoption.application.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.menuoption.application.command.GetMenuOptionsCommand;
import com.new_cafe.app.backend.menuoption.application.port.in.GetMenuOptionsUseCase;
import com.new_cafe.app.backend.menuoption.application.port.out.MenuOptionRepositoryPort;
import com.new_cafe.app.backend.menuoption.application.result.GetMenuOptionsResult;
import com.new_cafe.app.backend.menuoption.application.result.OptionGroupResult;
import com.new_cafe.app.backend.menuoption.application.result.OptionItemResult;
import com.new_cafe.app.backend.menuoption.domain.model.OptionGroup;

import lombok.RequiredArgsConstructor;

/**
 * 메뉴 옵션 조회 서비스 (Public API)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetMenuOptionsService implements GetMenuOptionsUseCase {

    private final MenuOptionRepositoryPort menuOptionRepositoryPort;

    @Override
    public GetMenuOptionsResult getMenuOptions(GetMenuOptionsCommand command) {
        List<OptionGroup> groups = menuOptionRepositoryPort.findOptionGroupsByMenuId(command.getMenuId());

        List<OptionGroupResult> groupResults = groups.stream()
                .map(this::toResult)
                .toList();

        return GetMenuOptionsResult.builder()
                .menuId(command.getMenuId())
                .optionGroups(groupResults)
                .build();
    }

    private OptionGroupResult toResult(OptionGroup group) {
        List<OptionItemResult> itemResults = group.getItems().stream()
                .map(item -> OptionItemResult.builder()
                        .id(item.getId())
                        .optionGroupId(item.getOptionGroupId())
                        .name(item.getName())
                        .priceDelta(item.getPriceDelta())
                        .sortOrder(item.getSortOrder())
                        .build())
                .toList();

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
