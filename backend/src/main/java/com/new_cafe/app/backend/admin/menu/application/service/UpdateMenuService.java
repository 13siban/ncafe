package com.new_cafe.app.backend.admin.menu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.command.UpdateMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.UpdateMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuPort;
import com.new_cafe.app.backend.admin.menu.application.port.out.SaveAdminMenuPort;
import com.new_cafe.app.backend.admin.menu.application.result.UpdateMenuResult;
import com.new_cafe.app.backend.admin.menu.domain.model.Menu;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UpdateMenuService implements UpdateMenuUseCase {

    private final LoadAdminMenuPort loadAdminMenuPort;
    private final SaveAdminMenuPort saveAdminMenuPort;

    @Override
    public UpdateMenuResult updateMenu(UpdateMenuCommand command) {
        Menu menu = loadAdminMenuPort.findById(command.getId());
        if (menu == null) {
            throw new IllegalArgumentException("메뉴를 찾을 수 없습니다.");
        }

        // 도메인 메서드 활용
        String newEngName = command.getEngName();
        if (newEngName != null) {
            // 1. 숫자 포함 여부 검증
            if (!newEngName.matches("^[a-zA-Z\\s\\-]+$")) {
                throw new IllegalArgumentException("영문 이름에는 숫자나 특수문자를 포함할 수 없습니다 (공백, 하이픈 제외).");
            }
            // 2. 중복 체크 (자신 제외)
            if (loadAdminMenuPort.existsByEngNameIgnoreCaseAndIdNot(newEngName, command.getId())) {
                throw new IllegalArgumentException("이미 다른 메뉴에서 사용 중인 영문 이름입니다: " + newEngName);
            }
        }

        menu.updateInfo(
                command.getKorName(),
                newEngName,
                command.getDescription(),
                command.getCategoryId()
        );

        if (command.getPrice() != null) {
            menu.changePrice(command.getPrice());
        }

        if (command.getIsAvailable() != null) {
            menu.setIsAvailable(command.getIsAvailable());
            menu.setUpdatedAt(java.time.LocalDateTime.now());
        }

        Menu updatedMenu = saveAdminMenuPort.save(menu);

        return UpdateMenuResult.builder()
                .id(updatedMenu.getId())
                .korName(updatedMenu.getKorName())
                .engName(updatedMenu.getEngName())
                .description(updatedMenu.getDescription())
                .price(updatedMenu.getPrice())
                .categoryId(updatedMenu.getCategoryId())
                .isAvailable(updatedMenu.getIsAvailable())
                .updatedAt(updatedMenu.getUpdatedAt())
                .build();
    }
}
