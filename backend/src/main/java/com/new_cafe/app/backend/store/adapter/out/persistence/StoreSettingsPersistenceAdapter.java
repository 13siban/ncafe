package com.new_cafe.app.backend.store.adapter.out.persistence;

import com.new_cafe.app.backend.store.application.port.out.StoreSettingsRepositoryPort;
import com.new_cafe.app.backend.store.domain.model.StoreSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StoreSettingsPersistenceAdapter implements StoreSettingsRepositoryPort {

    private final StoreSettingsJpaRepository repository;

    @Override
    public StoreSettings getStoreSettings() {
        return repository.findById(1)
                .map(this::mapToDomain)
                .orElseGet(() -> StoreSettings.builder().id(1).isOpen(false).build());
    }

    @Override
    public StoreSettings updateStoreSettings(StoreSettings settings) {
        StoreSettingsJpaEntity entity = repository.findById(1)
                .orElseGet(() -> StoreSettingsJpaEntity.builder().id(1).isOpen(false).build());
        
        if (settings.getIsOpen() != null) {
            entity.setOpen(settings.getIsOpen());
        }
        if (settings.getOpenTime() != null) {
            entity.setOpenTime(settings.getOpenTime());
        }
        if (settings.getCloseTime() != null) {
            entity.setCloseTime(settings.getCloseTime());
        }
        return mapToDomain(repository.save(entity));
    }

    private StoreSettings mapToDomain(StoreSettingsJpaEntity entity) {
        return StoreSettings.builder()
                .id(entity.getId())
                .isOpen(entity.getIsOpen())
                .openedAt(entity.getOpenedAt())
                .closedAt(entity.getClosedAt())
                .openTime(entity.getOpenTime())
                .closeTime(entity.getCloseTime())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
