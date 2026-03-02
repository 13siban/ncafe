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
        menu.updateInfo(
                command.getKorName(),
                command.getEngName(),
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
