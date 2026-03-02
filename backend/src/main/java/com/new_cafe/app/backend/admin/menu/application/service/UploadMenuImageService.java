package com.new_cafe.app.backend.admin.menu.application.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.new_cafe.app.backend.admin.menu.application.command.UploadMenuImageCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.UploadMenuImageUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuImagePort;
import com.new_cafe.app.backend.admin.menu.application.port.out.SaveAdminMenuImagePort;
import com.new_cafe.app.backend.admin.menu.domain.model.MenuImage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class UploadMenuImageService implements UploadMenuImageUseCase {

    private final LoadAdminMenuImagePort loadAdminMenuImagePort;
    private final SaveAdminMenuImagePort saveAdminMenuImagePort;

    @Override
    public void uploadMenuImages(UploadMenuImageCommand command) {
        String baseUploadPath = Paths.get("upload").toFile().getAbsolutePath();
        File uploadDir = new File(baseUploadPath);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        List<MenuImage> existingImages = loadAdminMenuImagePort.findByMenuId(command.getMenuId());
        int currentMaxSortOrder = existingImages.stream()
                .mapToInt(MenuImage::getSortOrder)
                .max()
                .orElse(0);

        List<MultipartFile> files = command.getFiles();
        if (files == null || files.isEmpty()) {
            return;
        }

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.lastIndexOf(".") > 0) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String savedFilename = UUID.randomUUID().toString() + extension;
            Path filePath = Paths.get(baseUploadPath, savedFilename);

            try {
                Files.copy(file.getInputStream(), filePath);
            } catch (IOException e) {
                throw new RuntimeException("파일 업로드 중 오류가 발생했습니다.", e);
            }

            currentMaxSortOrder++;

            MenuImage menuImage = MenuImage.builder()
                    .menuId(command.getMenuId())
                    .srcUrl(savedFilename)
                    .sortOrder(currentMaxSortOrder)
                    .createdAt(LocalDateTime.now())
                    .build();

            saveAdminMenuImagePort.save(menuImage);
        }
    }
}
