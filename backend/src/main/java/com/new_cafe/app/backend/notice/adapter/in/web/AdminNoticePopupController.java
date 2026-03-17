package com.new_cafe.app.backend.notice.adapter.in.web;

import com.new_cafe.app.backend.notice.adapter.in.web.dto.NoticePopupRequest;
import com.new_cafe.app.backend.notice.application.port.in.ManageNoticePopupUseCase;
import com.new_cafe.app.backend.notice.domain.NoticePopup;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/notice-popups")
@RequiredArgsConstructor
public class AdminNoticePopupController {
    
    private final ManageNoticePopupUseCase useCase;
    
    @PostMapping
    public ResponseEntity<NoticePopup> create(@RequestBody NoticePopupRequest request) {
        NoticePopup popup = useCase.createPopup(
            request.getTitle(), request.getContent(), request.getImageUrl(), request.getIsActive());
        return ResponseEntity.ok(popup);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<NoticePopup> update(@PathVariable Long id, @RequestBody NoticePopupRequest request) {
        NoticePopup popup = useCase.updatePopup(
            id, request.getTitle(), request.getContent(), request.getImageUrl(), request.getIsActive());
        return ResponseEntity.ok(popup);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        useCase.deletePopup(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping
    public ResponseEntity<List<NoticePopup>> getAll() {
        return ResponseEntity.ok(useCase.getAllPopups());
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
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
            throw new RuntimeException("이미지 업로드 중 오류가 발생했습니다.", e);
        }

        return ResponseEntity.ok(Map.of("imageUrl", savedFilename));
    }
}
