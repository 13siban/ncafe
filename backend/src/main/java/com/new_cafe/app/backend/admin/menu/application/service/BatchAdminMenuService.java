package com.new_cafe.app.backend.admin.menu.application.service;

import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaEntity;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaRepository;
import com.new_cafe.app.backend.admin.menu.adapter.in.web.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BatchAdminMenuService {

    private final AdminMenuJpaRepository menuRepository;

    @Transactional
    public void batchUpdate(List<com.new_cafe.app.backend.admin.menu.adapter.in.web.BatchUpdateDto> requests) {
        for (com.new_cafe.app.backend.admin.menu.adapter.in.web.BatchUpdateDto dto : requests) {
            AdminMenuJpaEntity entity = menuRepository.findById(dto.getMenuId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu not found"));
            if (dto.getKorName() != null) entity.setKorName(dto.getKorName());
            if (dto.getPrice() != null) entity.setPrice(dto.getPrice());
            if (dto.getCategoryId() != null) entity.setCategoryId(dto.getCategoryId());
            if (dto.getIsAvailable() != null) entity.setIsAvailable(dto.getIsAvailable());
            if (dto.getIsSoldOut() != null) entity.setIsSoldOut(dto.getIsSoldOut());
            if (dto.getSortOrder() != null) entity.setSortOrder(dto.getSortOrder());
            menuRepository.save(entity);
        }
    }

    @Transactional
    public void reorder(List<com.new_cafe.app.backend.admin.menu.adapter.in.web.ReorderDto> requests) {
        for (com.new_cafe.app.backend.admin.menu.adapter.in.web.ReorderDto dto : requests) {
            AdminMenuJpaEntity entity = menuRepository.findById(dto.getMenuId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu not found"));
            if (dto.getSortOrder() != null) entity.setSortOrder(dto.getSortOrder());
            menuRepository.save(entity);
        }
    }

    @Transactional
    public void toggleSoldOut(Long id, Boolean isSoldOut) {
        AdminMenuJpaEntity entity = menuRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu not found"));
        if (isSoldOut != null) {
            entity.setIsSoldOut(isSoldOut);
            menuRepository.save(entity);
        }
    }
}
