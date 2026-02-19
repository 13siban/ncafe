package com.new_cafe.app.backend.menu.application.port.in;

import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuDetailResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuImageListResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuListResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.request.MenuListRequest;

/**
 * 일반 사용자/관리자 공통 조회 유스케이스 (Read-Only)
 */
public interface ViewMenuUseCase {
    MenuListResponse getMenus(MenuListRequest request);

    MenuDetailResponse getMenu(Long id);

    MenuImageListResponse getImages(Long id);
}
