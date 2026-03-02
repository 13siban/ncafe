package com.new_cafe.app.backend.admin.menu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.command.CreateMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.CreateMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.out.SaveAdminMenuPort;
import com.new_cafe.app.backend.admin.menu.application.result.CreateMenuResult;
import com.new_cafe.app.backend.admin.menu.domain.model.Menu;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CreateMenuService implements CreateMenuUseCase {

    private final SaveAdminMenuPort saveAdminMenuPort;

    @Override
    public CreateMenuResult createMenu(CreateMenuCommand command) {
        // 도메인 팩토리 메서드 활용
        Menu menu = Menu.create(
                command.getKorName(),
                command.getEngName(),
                command.getDescription(),
                command.getPrice(),
                command.getCategoryId(),
                command.getIsAvailable()
        );

        Menu savedMenu = saveAdminMenuPort.save(menu);

        return CreateMenuResult.builder()
                .id(savedMenu.getId())
                .korName(savedMenu.getKorName())
                .engName(savedMenu.getEngName())
                .description(savedMenu.getDescription())
                .price(savedMenu.getPrice())
                .categoryId(savedMenu.getCategoryId())
                .isAvailable(savedMenu.getIsAvailable())
                .createdAt(savedMenu.getCreatedAt())
                .build();
    }
}
