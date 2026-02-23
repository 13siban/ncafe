package com.new_cafe.app.backend.admin.menu.application.port.in;

import com.new_cafe.app.backend.admin.menu.application.command.UpdateMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.result.UpdateMenuResult;

public interface UpdateMenuUseCase {
    UpdateMenuResult updateMenu(UpdateMenuCommand command);
}
