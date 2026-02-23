package com.new_cafe.app.backend.admin.menu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.command.CreateMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.CreateMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.result.CreateMenuResult;
import com.new_cafe.app.backend.menu.application.port.out.MenuRepositoryPort;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CreateMenuService implements CreateMenuUseCase {

    private final MenuRepositoryPort menuRepositoryPort;

    @Override
    public CreateMenuResult createMenu(CreateMenuCommand command) {
        // 메뉴 생성 로직 구현
        return null;
    }
}
