package com.new_cafe.app.backend.menuoption.adapter.in.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.new_cafe.app.backend.menuoption.application.command.GetMenuOptionsCommand;
import com.new_cafe.app.backend.menuoption.application.port.in.GetMenuOptionsUseCase;
import com.new_cafe.app.backend.menuoption.application.result.GetMenuOptionsResult;

import lombok.RequiredArgsConstructor;

/**
 * 메뉴 옵션 Public API Controller
 * 
 * 3-1. GET /menus/{id}/options — 메뉴의 실제 적용 옵션 조회
 */
@RestController
@RequestMapping("/menus")
@RequiredArgsConstructor
public class MenuOptionController {

    private final GetMenuOptionsUseCase getMenuOptionsUseCase;

    @GetMapping("/{id}/options")
    public GetMenuOptionsResult getMenuOptions(@PathVariable Long id) {
        GetMenuOptionsCommand command = GetMenuOptionsCommand.builder()
                .menuId(id)
                .build();
        return getMenuOptionsUseCase.getMenuOptions(command);
    }
}
