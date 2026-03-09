package com.new_cafe.app.backend.store.application.service;

import com.new_cafe.app.backend.store.application.port.in.GetStoreSettingsUseCase;
import com.new_cafe.app.backend.store.application.port.in.ManageStoreSettingsUseCase;
import com.new_cafe.app.backend.store.application.port.out.StoreSettingsRepositoryPort;
import com.new_cafe.app.backend.store.domain.model.StoreSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StoreSettingsService implements GetStoreSettingsUseCase, ManageStoreSettingsUseCase {

    private final StoreSettingsRepositoryPort repositoryPort;
    private final DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Override
    public boolean isStoreOpen() {
        StoreSettings settings = repositoryPort.getStoreSettings();
        return calculateStoreOpenStatus(settings);
    }

    private boolean calculateStoreOpenStatus(StoreSettings settings) {
        // If master switch is off, it's definitely closed
        if (!settings.getIsOpen()) {
            return false;
        }

        // Check operating hours if they are set
        if (settings.getOpenTime() != null && !settings.getOpenTime().isEmpty() &&
            settings.getCloseTime() != null && !settings.getCloseTime().isEmpty()) {
            try {
                LocalTime now = LocalTime.now();
                LocalTime open = LocalTime.parse(settings.getOpenTime());
                LocalTime close = LocalTime.parse(settings.getCloseTime());

                if (open.isBefore(close)) {
                    // Standard: 09:00 - 22:00
                    return !now.isBefore(open) && now.isBefore(close);
                } else {
                    // Overnight: 22:00 - 05:00
                    return !now.isBefore(open) || now.isBefore(close);
                }
            } catch (Exception e) {
                // Fallback to manual switch if parse fails
                return settings.getIsOpen();
            }
        }

        return settings.getIsOpen();
    }

    @Override
    public GetStoreSettingsUseCase.StoreSettingsResponse getStoreSettings() {
        StoreSettings settings = repositoryPort.getStoreSettings();
        boolean actualOpen = calculateStoreOpenStatus(settings);
        return new GetStoreSettingsUseCase.StoreSettingsResponse(
                actualOpen,
                settings.getOpenedAt() != null ? settings.getOpenedAt().format(formatter) : null,
                settings.getClosedAt() != null ? settings.getClosedAt().format(formatter) : null,
                settings.getOpenTime(),
                settings.getCloseTime()
        );
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

    private ManageStoreSettingsUseCase.StoreSettingsResponse toManageResponse(StoreSettings settings) {
        boolean actualOpen = calculateStoreOpenStatus(settings);
        return new ManageStoreSettingsUseCase.StoreSettingsResponse(
                actualOpen,
                settings.getOpenedAt() != null ? settings.getOpenedAt().format(formatter) : null,
                settings.getClosedAt() != null ? settings.getClosedAt().format(formatter) : null,
                settings.getOpenTime(),
                settings.getCloseTime()
        );
    }
}
