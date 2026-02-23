package com.new_cafe.app.backend.menu.application.port.in;

import com.new_cafe.app.backend.menu.application.command.GetMenuListCommand;
import com.new_cafe.app.backend.menu.application.result.GetMenuListResult;

/**
 * 메뉴 목록 조회 단위 기능
 */
public interface GetMenuListUseCase {
    GetMenuListResult getMenus(GetMenuListCommand command);
}
