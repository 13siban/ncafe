package com.new_cafe.app.backend.admin.menu.application.port.in;

import com.new_cafe.app.backend.admin.menu.application.command.GetAdminMenuDetailCommand;
import com.new_cafe.app.backend.admin.menu.application.result.AdminMenuDetailResult;

public interface GetAdminMenuDetailUseCase {
    AdminMenuDetailResult getMenu(GetAdminMenuDetailCommand command);
}
