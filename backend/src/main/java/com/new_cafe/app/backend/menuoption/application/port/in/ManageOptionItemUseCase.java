package com.new_cafe.app.backend.menuoption.application.port.in;

import java.util.List;

import com.new_cafe.app.backend.menuoption.application.command.CreateOptionItemCommand;
import com.new_cafe.app.backend.menuoption.application.command.UpdateOptionItemCommand;
import com.new_cafe.app.backend.menuoption.application.result.OptionItemResult;

/**
 * 옵션 항목 CRUD 유스케이스 (Admin)
 */
public interface ManageOptionItemUseCase {
    List<OptionItemResult> getOptionItems(Long groupId);
    OptionItemResult createOptionItem(CreateOptionItemCommand command);
    OptionItemResult updateOptionItem(UpdateOptionItemCommand command);
    void deleteOptionItem(Long itemId);
}
