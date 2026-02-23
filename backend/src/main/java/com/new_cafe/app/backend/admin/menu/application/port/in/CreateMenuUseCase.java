package com.new_cafe.app.backend.admin.menu.application.port.in;

import com.new_cafe.app.backend.admin.menu.application.command.CreateMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.result.CreateMenuResult;

public interface CreateMenuUseCase {
    CreateMenuResult createMenu(CreateMenuCommand command);
}
