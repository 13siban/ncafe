package com.new_cafe.app.backend.store.adapter.in.web;

import com.new_cafe.app.backend.store.application.port.in.GetStoreSettingsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/store")
@RequiredArgsConstructor
public class StoreController {

    private final GetStoreSettingsUseCase getStoreSettingsUseCase;

    @GetMapping("/status")
    public ResponseEntity<GetStoreSettingsUseCase.StoreSettingsResponse> getStoreStatus() {
        return ResponseEntity.ok(getStoreSettingsUseCase.getStoreSettings());
    }
}
