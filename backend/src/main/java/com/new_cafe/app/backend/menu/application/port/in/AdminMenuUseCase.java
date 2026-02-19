package com.new_cafe.app.backend.menu.application.port.in;

import com.new_cafe.app.backend.menu.adapter.in.web.dto.request.MenuCreateRequest;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuCreateResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.request.MenuUpdateRequest;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuUpdateResponse;

/**
 * 관리자 전용 유스케이스 (CUD: Create, Update, Delete)
 */
public interface AdminMenuUseCase {
    MenuCreateResponse createMenu(MenuCreateRequest request);

    MenuUpdateResponse updateMenu(MenuUpdateRequest request);

    void deleteMenu(Long id);
}
