package com.new_cafe.app.backend.store.adapter.in.web;

import com.new_cafe.app.backend.store.application.port.in.GetStoreSettingsUseCase;
import com.new_cafe.app.backend.store.application.port.in.ManageStoreSettingsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

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

    @PostMapping("/favicon")
    public ResponseEntity<Map<String, String>> uploadFavicon(@RequestParam("file") MultipartFile file) {
        String baseUploadPath = Paths.get("upload").toFile().getAbsolutePath();
        File uploadDir = new File(baseUploadPath);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.lastIndexOf(".") > 0) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String savedFilename = UUID.randomUUID().toString() + extension;
        Path filePath = Paths.get(baseUploadPath, savedFilename);

        try {
            Files.copy(file.getInputStream(), filePath);
        } catch (IOException e) {
            throw new RuntimeException("Favicon upload failed", e);
        }

        return ResponseEntity.ok(Map.of("faviconUrl", savedFilename));
    }

    @PutMapping("/settings")
    public ResponseEntity<ManageStoreSettingsUseCase.StoreSettingsResponse> updateSettings(@RequestBody UpdateSettingsRequest request) {
        return ResponseEntity.ok(manageStoreSettingsUseCase.updateStoreSettings(
                request.openTime(),
                request.closeTime(),
                request.cafeName(),
                request.description(),
                request.contactNumber(),
                request.address(),
                request.faviconUrl(),
                request.faviconDarkUrl()
        ));
    }

    public record UpdateSettingsRequest(
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
