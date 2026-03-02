package com.new_cafe.app.backend.admin.menu.application.port.in;

import com.new_cafe.app.backend.admin.menu.application.command.DeleteMenuImageCommand;

public interface DeleteMenuImageUseCase {
    void deleteMenuImage(DeleteMenuImageCommand command);
}
