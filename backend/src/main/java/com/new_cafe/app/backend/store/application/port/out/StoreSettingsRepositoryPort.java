package com.new_cafe.app.backend.store.application.port.out;

import com.new_cafe.app.backend.store.domain.model.StoreSettings;

public interface StoreSettingsRepositoryPort {
    StoreSettings getStoreSettings();
    StoreSettings updateStoreSettings(StoreSettings settings);
}
