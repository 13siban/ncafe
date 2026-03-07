package com.new_cafe.app.backend.admin.menu.application.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.command.DeleteMenuCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.DeleteMenuUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.out.DeleteAdminMenuPort;
import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuPort;
import com.new_cafe.app.backend.admin.menu.application.port.out.DeleteAdminMenuImagePort;
import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuImagePort;
import com.new_cafe.app.backend.admin.menu.domain.model.MenuImage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DeleteMenuService implements DeleteMenuUseCase {

    private final LoadAdminMenuPort loadAdminMenuPort;
    private final DeleteAdminMenuPort deleteAdminMenuPort;
    private final LoadAdminMenuImagePort loadAdminMenuImagePort;
    private final DeleteAdminMenuImagePort deleteAdminMenuImagePort;

    @Override
    public void deleteMenu(DeleteMenuCommand command) {
        // 존재 여부 확인
        if (loadAdminMenuPort.findById(command.getId()) == null) {
            throw new IllegalArgumentException("삭제할 메뉴를 찾을 수 없습니다.");
        }

        // 1. 해당 메뉴의 이미지 목록 조회
        List<MenuImage> images = loadAdminMenuImagePort.findByMenuId(command.getId());
        
        // 2. 물리적 파일 삭제
        for (MenuImage image : images) {
            if (image.getSrcUrl() != null && !image.getSrcUrl().startsWith("http")) {
                Path filePath = Paths.get("upload", image.getSrcUrl());
                try {
                    Files.deleteIfExists(filePath);
                } catch (IOException e) {
                    // 파일 삭제 실패 시 로그 출력 (트랜잭션 중단은 하지 않음)
                    System.err.println("Failed to delete menu image file: " + filePath + ", error: " + e.getMessage());
                }
            }
        }

        // 3. DB에서 이미지 정보 삭제
        deleteAdminMenuImagePort.deleteImagesByMenuId(command.getId());

        // 4. 메뉴 삭제
        deleteAdminMenuPort.deleteById(command.getId());
    }
}
