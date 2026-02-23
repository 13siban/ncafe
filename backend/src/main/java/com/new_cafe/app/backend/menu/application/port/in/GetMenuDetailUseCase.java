package com.new_cafe.app.backend.menu.application.port.in;

import com.new_cafe.app.backend.menu.application.command.GetMenuDetailCommand;
import com.new_cafe.app.backend.menu.application.result.GetMenuDetailResult;

/**
 * 메뉴 상세 조회 단위 기능
 */
public interface GetMenuDetailUseCase {
    GetMenuDetailResult getMenu(GetMenuDetailCommand command);
}
