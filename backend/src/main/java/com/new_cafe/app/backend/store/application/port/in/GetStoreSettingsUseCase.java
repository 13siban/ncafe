package com.new_cafe.app.backend.store.application.port.in;

public interface GetStoreSettingsUseCase {
    boolean isStoreOpen();
    StoreSettingsResponse getStoreSettings();

    record StoreSettingsResponse(
            boolean isOpen,
            String openedAt,
            String closedAt,
            String openTime,
            String closeTime,
            String cafeName,
            String description,
            String contactNumber,
            String address,
            String faviconUrl,
            String faviconDarkUrl
    ) {}
}
