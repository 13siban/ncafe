package com.new_cafe.app.backend.menu.application.port.in;

import com.new_cafe.app.backend.menu.application.command.GetMenuImagesCommand;
import com.new_cafe.app.backend.menu.application.result.GetMenuImagesResult;

/**
 * 메뉴 이미지 목록 조회 단위 기능
 */
public interface GetMenuImagesUseCase {
    GetMenuImagesResult getImages(GetMenuImagesCommand command);
}
