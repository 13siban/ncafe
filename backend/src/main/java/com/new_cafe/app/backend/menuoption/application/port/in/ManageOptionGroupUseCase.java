package com.new_cafe.app.backend.menuoption.application.port.in;

import java.util.List;

import com.new_cafe.app.backend.menuoption.application.command.CreateOptionGroupCommand;
import com.new_cafe.app.backend.menuoption.application.command.UpdateOptionGroupCommand;
import com.new_cafe.app.backend.menuoption.application.result.OptionGroupResult;

/**
 * 옵션 그룹 CRUD 유스케이스 (Admin)
 */
public interface ManageOptionGroupUseCase {
    List<OptionGroupResult> getAllOptionGroups();
    OptionGroupResult createOptionGroup(CreateOptionGroupCommand command);
    OptionGroupResult updateOptionGroup(UpdateOptionGroupCommand command);
    void deleteOptionGroup(Long groupId);
}
