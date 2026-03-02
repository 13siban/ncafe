package com.new_cafe.app.backend.admin.menu.application.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.command.DeleteMenuImageCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.DeleteMenuImageUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.out.DeleteAdminMenuImagePort;
import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuImagePort;
import com.new_cafe.app.backend.admin.menu.application.port.out.SaveAdminMenuImagePort;
import com.new_cafe.app.backend.admin.menu.domain.model.MenuImage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DeleteMenuImageService implements DeleteMenuImageUseCase {

    private final LoadAdminMenuImagePort loadAdminMenuImagePort;
    private final DeleteAdminMenuImagePort deleteAdminMenuImagePort;
    private final SaveAdminMenuImagePort saveAdminMenuImagePort;

    @Override
    public void deleteMenuImage(DeleteMenuImageCommand command) {
        MenuImage targetImage = loadAdminMenuImagePort.findImageById(command.getMenuImageId());
        if (targetImage == null || !targetImage.getMenuId().equals(command.getMenuId())) {
            throw new IllegalArgumentException("요청한 메뉴 이미지를 찾을 수 없습니다.");
        }
        
        // delete physically
        if (targetImage.getSrcUrl() != null && !targetImage.getSrcUrl().startsWith("http")) {
            Path filePath = Paths.get("upload", targetImage.getSrcUrl());
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Ignore or log error
            }
        }

        deleteAdminMenuImagePort.deleteImageById(command.getMenuImageId());
        
        // re-order remaining images
        List<MenuImage> remainingImages = loadAdminMenuImagePort.findByMenuId(command.getMenuId());
        int order = 1;
        for (MenuImage img : remainingImages) {
            if (!img.getId().equals(targetImage.getId())) {
                img.setSortOrder(order++);
            }
        }
        if (!remainingImages.isEmpty()) {
            saveAdminMenuImagePort.saveAll(remainingImages);
        }
    }
}
