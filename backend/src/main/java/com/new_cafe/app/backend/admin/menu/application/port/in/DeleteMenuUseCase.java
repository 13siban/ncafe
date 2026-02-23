package com.new_cafe.app.backend.admin.menu.application.port.in;

import com.new_cafe.app.backend.admin.menu.application.command.DeleteMenuCommand;

public interface DeleteMenuUseCase {
    void deleteMenu(DeleteMenuCommand command);
}
