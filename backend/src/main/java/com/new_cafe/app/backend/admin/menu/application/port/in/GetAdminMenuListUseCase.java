package com.new_cafe.app.backend.admin.menu.application.port.in;

import com.new_cafe.app.backend.admin.menu.application.command.GetAdminMenuListCommand;
import com.new_cafe.app.backend.admin.menu.application.result.AdminMenuListResult;

public interface GetAdminMenuListUseCase {
    AdminMenuListResult getMenus(GetAdminMenuListCommand command);
}
