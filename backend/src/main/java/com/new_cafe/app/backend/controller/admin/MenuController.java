package com.new_cafe.app.backend.controller.admin;

import java.util.List;

// import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.new_cafe.app.backend.dto.MenuListRequest;
import com.new_cafe.app.backend.dto.MenuListResponse;
import com.new_cafe.app.backend.entity.Menu;
import com.new_cafe.app.backend.service.MenuService;

@RestController
public class MenuController {

    // field injection
    // @Autowired  
    private MenuService menuService;

    //constructor injection 가장 많이 사용
    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    // setter injection
    // @Autowired
    // public void setMenuService(MenuService menuService) {
    //     this.menuService = menuService;
    // }
    
    // 목록 조회 데이터 반환
    @GetMapping("/admin/menus")
    // public List<Menu> menu(@RequestParam(name = "cid", required = false) Integer categoryId) {  
    public MenuListResponse menu(MenuListRequest request) {  //카테고리아이디 인자로 받아옴 int 는 못씀 wrapper형만 가능
        System.out.println("categoryId: " + request.getCategoryId());
        MenuListResponse response = menuService.getMenus(request);
        return response;
    }

    // 상세 조회 데이터 반환
    @GetMapping("/admin/menus/{id}")
    public String editMenu() {
        return "Edit Menu";
    }

    // 메뉴 생성 데이터 입력
    @PostMapping("/admin/menus")
    public String newMenu(Menu menu) {
        return "New Menu";
    }

    // 메뉴 수정 데이터 입력
    @PutMapping("path/{id}")
    public String editMenu(Menu menu) {
        return "Edit Menu";
    }

    // 메뉴 삭제
    @DeleteMapping("/admin/menus/{id}")
    public String deleteMenu(Menu menu) {
        return "Delete Menu";
    }
}
