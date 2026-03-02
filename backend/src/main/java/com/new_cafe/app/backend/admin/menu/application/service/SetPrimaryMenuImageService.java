package com.new_cafe.app.backend.admin.menu.application.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.new_cafe.app.backend.admin.menu.application.command.SetPrimaryMenuImageCommand;
import com.new_cafe.app.backend.admin.menu.application.port.in.SetPrimaryMenuImageUseCase;
import com.new_cafe.app.backend.admin.menu.application.port.out.LoadAdminMenuImagePort;
import com.new_cafe.app.backend.admin.menu.application.port.out.SaveAdminMenuImagePort;
import com.new_cafe.app.backend.admin.menu.domain.model.MenuImage;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class SetPrimaryMenuImageService implements SetPrimaryMenuImageUseCase {

    private final LoadAdminMenuImagePort loadAdminMenuImagePort;
    private final SaveAdminMenuImagePort saveAdminMenuImagePort;

    @Override
    public void setPrimaryMenuImage(SetPrimaryMenuImageCommand command) {
        List<MenuImage> menuImages = loadAdminMenuImagePort.findByMenuId(command.getMenuId());
        
        MenuImage targetImage = null;
        for (MenuImage img : menuImages) {
            if (img.getId().equals(command.getMenuImageId())) {
                targetImage = img;
                break;
            }
        }
        
        if (targetImage == null) {
            throw new IllegalArgumentException("요청한 메뉴 이미지를 찾을 수 없습니다.");
        }

        targetImage.markAsPrimary();
        
        int order = 2;
        for (MenuImage image : menuImages) {
            if (!image.getId().equals(targetImage.getId())) {
                image.setSortOrder(order++);
            }
        }
        
        saveAdminMenuImagePort.saveAll(menuImages);
    }
}
