package com.new_cafe.app.backend.admin.menu.application.port.in;

import com.new_cafe.app.backend.admin.menu.application.command.SetPrimaryMenuImageCommand;

public interface SetPrimaryMenuImageUseCase {
    void setPrimaryMenuImage(SetPrimaryMenuImageCommand command);
}
