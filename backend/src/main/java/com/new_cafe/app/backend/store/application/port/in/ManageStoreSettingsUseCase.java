package com.new_cafe.app.backend.store.application.port.in;

public interface ManageStoreSettingsUseCase {
    StoreSettingsResponse openStore();
    StoreSettingsResponse closeStore();
    StoreSettingsResponse updateStoreSettings(String openTime, String closeTime);

    record StoreSettingsResponse(boolean isOpen, String openedAt, String closedAt, String openTime, String closeTime) {}
}
