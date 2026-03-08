package com.new_cafe.app.backend.menuoption.application.port.in;

import com.new_cafe.app.backend.menuoption.application.command.GetMenuOptionsCommand;
import com.new_cafe.app.backend.menuoption.application.result.GetMenuOptionsResult;

/**
 * 메뉴 옵션 조회 유스케이스 (Public)
 */
public interface GetMenuOptionsUseCase {
    GetMenuOptionsResult getMenuOptions(GetMenuOptionsCommand command);
}
