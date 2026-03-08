package com.new_cafe.app.backend.store.application.service;

import com.new_cafe.app.backend.store.application.port.in.GetStoreSettingsUseCase;
import com.new_cafe.app.backend.store.application.port.in.ManageStoreSettingsUseCase;
import com.new_cafe.app.backend.store.application.port.out.StoreSettingsRepositoryPort;
import com.new_cafe.app.backend.store.domain.model.StoreSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreSettingsService implements GetStoreSettingsUseCase, ManageStoreSettingsUseCase {

    private final StoreSettingsRepositoryPort repositoryPort;
    private final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Override
    public boolean isStoreOpen() {
        return repositoryPort.getStoreSettings().getIsOpen();
    }

    @Override
    public GetStoreSettingsUseCase.StoreSettingsResponse getStoreSettings() {
        StoreSettings settings = repositoryPort.getStoreSettings();
        return toGetResponse(settings);
    }

    @Override
    @Transactional
    public ManageStoreSettingsUseCase.StoreSettingsResponse openStore() {
        StoreSettings settings = StoreSettings.builder().isOpen(true).build();
        StoreSettings updated = repositoryPort.updateStoreSettings(settings);
        return toManageResponse(updated);
    }

    @Override
    @Transactional
    public ManageStoreSettingsUseCase.StoreSettingsResponse closeStore() {
        StoreSettings settings = StoreSettings.builder().isOpen(false).build();
        StoreSettings updated = repositoryPort.updateStoreSettings(settings);
        return toManageResponse(updated);
    }

    @Override
    @Transactional
    public ManageStoreSettingsUseCase.StoreSettingsResponse updateStoreSettings(String openTime, String closeTime) {
        StoreSettings settings = StoreSettings.builder()
                .openTime(openTime)
                .closeTime(closeTime)
                .build();
        StoreSettings updated = repositoryPort.updateStoreSettings(settings);
        return toManageResponse(updated);
    }

    private GetStoreSettingsUseCase.StoreSettingsResponse toGetResponse(StoreSettings settings) {
        return new GetStoreSettingsUseCase.StoreSettingsResponse(
                settings.getIsOpen(),
                settings.getOpenedAt() != null ? settings.getOpenedAt().format(formatter) : null,
                settings.getClosedAt() != null ? settings.getClosedAt().format(formatter) : null,
                settings.getOpenTime(),
                settings.getCloseTime()
        );
    }

    private ManageStoreSettingsUseCase.StoreSettingsResponse toManageResponse(StoreSettings settings) {
        return new ManageStoreSettingsUseCase.StoreSettingsResponse(
                settings.getIsOpen(),
                settings.getOpenedAt() != null ? settings.getOpenedAt().format(formatter) : null,
                settings.getClosedAt() != null ? settings.getClosedAt().format(formatter) : null,
                settings.getOpenTime(),
                settings.getCloseTime()
        );
    }
}
