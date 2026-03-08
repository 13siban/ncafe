package com.new_cafe.app.backend.menuoption.application.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.menuoption.application.command.GetCategoryOptionsCommand;
import com.new_cafe.app.backend.menuoption.application.port.in.GetCategoryOptionsUseCase;
import com.new_cafe.app.backend.menuoption.application.port.out.MenuOptionRepositoryPort;
import com.new_cafe.app.backend.menuoption.application.result.OptionGroupResult;
import com.new_cafe.app.backend.menuoption.application.result.OptionItemResult;
import com.new_cafe.app.backend.menuoption.domain.model.OptionGroup;

import lombok.RequiredArgsConstructor;

/**
 * 카테고리별 옵션 조회 서비스 (Admin API)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetCategoryOptionsService implements GetCategoryOptionsUseCase {

    private final MenuOptionRepositoryPort menuOptionRepositoryPort;

    @Override
    public List<OptionGroupResult> getCategoryOptions(GetCategoryOptionsCommand command) {
        List<OptionGroup> groups = menuOptionRepositoryPort.findOptionGroupsByCategoryId(command.getCategoryId());

        return groups.stream()
                .map(group -> OptionGroupResult.builder()
                        .id(group.getId())
                        .name(group.getName())
                        .type(group.getType())
                        .isRequired(group.getIsRequired())
                        .sortOrder(group.getSortOrder())
                        .items(group.getItems().stream()
                                .map(item -> OptionItemResult.builder()
                                        .id(item.getId())
                                        .optionGroupId(item.getOptionGroupId())
                                        .name(item.getName())
                                        .priceDelta(item.getPriceDelta())
                                        .sortOrder(item.getSortOrder())
                                        .build())
                                .toList())
                        .build())
                .toList();
    }
}
