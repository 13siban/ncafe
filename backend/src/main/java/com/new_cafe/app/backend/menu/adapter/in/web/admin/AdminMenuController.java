package com.new_cafe.app.backend.menu.adapter.in.web.admin;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.new_cafe.app.backend.menu.adapter.in.web.dto.request.MenuListRequest;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuDetailResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuImageListResponse;
import com.new_cafe.app.backend.menu.adapter.in.web.dto.response.MenuListResponse;
import com.new_cafe.app.backend.menu.application.port.in.AdminMenuUseCase;
import com.new_cafe.app.backend.menu.application.port.in.ViewMenuUseCase;
import com.new_cafe.app.backend.menu.domain.model.Menu;

@RestController
@RequestMapping("/admin/menus")
public class AdminMenuController {

    private final ViewMenuUseCase viewMenuUseCase;
    private final AdminMenuUseCase adminMenuUseCase;

    public AdminMenuController(ViewMenuUseCase viewMenuUseCase, AdminMenuUseCase adminMenuUseCase) {
        this.viewMenuUseCase = viewMenuUseCase;
        this.adminMenuUseCase = adminMenuUseCase;
    }

    // 목록 조회 데이터 반환
    @GetMapping
    public MenuListResponse getMenus(MenuListRequest request) {
        MenuListResponse response = viewMenuUseCase.getMenus(request);
        return response;
    }

    // 상세 조회 데이터 반환
    @GetMapping("/{id}")
    public MenuDetailResponse getMenu(@PathVariable Long id) {
        MenuDetailResponse response = viewMenuUseCase.getMenu(id);
        return response;
    }

    // 메뉴 생성 데이터 입력
    @PostMapping
    public String newMenu(Menu menu) {
        return "New Menu";
    }

    // 메뉴 수정 데이터 입력
    @PutMapping("/{id}")
    public String editMenu(Menu menu) {
        return "Edit Menu";
    }

    // 메뉴 삭제
    @DeleteMapping("/{id}")
    public String deleteMenu(Menu menu) {
        return "Delete Menu";
    }

    // 메뉴 이미지 조회
    @GetMapping("/{id}/menu-images")
    public MenuImageListResponse getImages(@PathVariable Long id) {
        MenuImageListResponse response = viewMenuUseCase.getImages(id);
        return response;
    }
}
