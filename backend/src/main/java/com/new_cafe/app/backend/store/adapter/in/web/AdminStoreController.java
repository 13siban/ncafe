package com.new_cafe.app.backend.store.adapter.in.web;

import com.new_cafe.app.backend.store.application.port.in.GetStoreSettingsUseCase;
import com.new_cafe.app.backend.store.application.port.in.ManageStoreSettingsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/store")
@RequiredArgsConstructor
public class AdminStoreController {

    private final GetStoreSettingsUseCase getStoreSettingsUseCase;
    private final ManageStoreSettingsUseCase manageStoreSettingsUseCase;

    @GetMapping("/status")
    public ResponseEntity<GetStoreSettingsUseCase.StoreSettingsResponse> getStoreStatus() {
        return ResponseEntity.ok(getStoreSettingsUseCase.getStoreSettings());
    }

    @PutMapping("/open")
    public ResponseEntity<ManageStoreSettingsUseCase.StoreSettingsResponse> openStore() {
        return ResponseEntity.ok(manageStoreSettingsUseCase.openStore());
    }

    @PutMapping("/close")
    public ResponseEntity<ManageStoreSettingsUseCase.StoreSettingsResponse> closeStore() {
        return ResponseEntity.ok(manageStoreSettingsUseCase.closeStore());
    }

    @PutMapping("/settings")
    public ResponseEntity<ManageStoreSettingsUseCase.StoreSettingsResponse> updateSettings(@RequestBody UpdateSettingsRequest request) {
        return ResponseEntity.ok(manageStoreSettingsUseCase.updateStoreSettings(request.openTime(), request.closeTime()));
    }

    public record UpdateSettingsRequest(String openTime, String closeTime) {}
}
