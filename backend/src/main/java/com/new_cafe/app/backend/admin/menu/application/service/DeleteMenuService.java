package com.new_cafe.app.backend.admin.menu.application.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.command.DeleteMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.DeleteMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.out.DeleteAdminMenuPort;
import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuPort;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DeleteMenuService implements DeleteMenuUseCase {

    private final LoadAdminMenuPort loadAdminMenuPort;
    private final DeleteAdminMenuPort deleteAdminMenuPort;

    @Override
    public void deleteMenu(DeleteMenuCommand command) {
        // 존재 여부 확인
        if (loadAdminMenuPort.findById(command.getId()) == null) {
            throw new IllegalArgumentException("삭제할 메뉴를 찾을 수 없습니다.");
        }
        deleteAdminMenuPort.deleteById(command.getId());
    }
}
