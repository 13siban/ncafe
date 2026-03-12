package com.new_cafe.app.backend.admin.menu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.command.CreateMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.CreateMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuPort;
import com.new_cafe.app.backend.admin.menu.application.port.out.SaveAdminMenuPort;
import com.new_cafe.app.backend.admin.menu.application.result.CreateMenuResult;
import com.new_cafe.app.backend.admin.menu.domain.model.Menu;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CreateMenuService implements CreateMenuUseCase {

    private final SaveAdminMenuPort saveAdminMenuPort;
    private final LoadAdminMenuPort loadAdminMenuPort;

    @Override
    public CreateMenuResult createMenu(CreateMenuCommand command) {
        String engName = command.getEngName();

        // 1. 숫자 포함 여부 검증 (영문, 공백, 하이픈만 허용)
        if (engName != null && !engName.matches("^[a-zA-Z\\s\\-]+$")) {
            throw new IllegalArgumentException("영문 이름에는 숫자나 특수문자를 포함할 수 없습니다 (공백, 하이픈 제외).");
        }

        // 2. 중복 체크
        if (engName != null && loadAdminMenuPort.existsByEngNameIgnoreCase(engName)) {
            throw new IllegalArgumentException("이미 사용 중인 영문 이름입니다: " + engName);
        }

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
