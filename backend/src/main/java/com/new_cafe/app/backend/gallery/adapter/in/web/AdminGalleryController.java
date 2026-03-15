package com.new_cafe.app.backend.gallery.adapter.in.web;

import com.new_cafe.app.backend.gallery.application.port.in.GetGalleryImageUseCase;
import com.new_cafe.app.backend.gallery.application.port.in.ManageGalleryImageUseCase;
import com.new_cafe.app.backend.gallery.domain.model.GalleryImage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/gallery")
@RequiredArgsConstructor
public class AdminGalleryController {

    private final ManageGalleryImageUseCase manageGalleryImageUseCase;
    private final GetGalleryImageUseCase getGalleryImageUseCase;

    @GetMapping
    public ResponseEntity<List<GalleryImage>> getAllImages() {
        return ResponseEntity.ok(getGalleryImageUseCase.getAllGalleryImages());
    }

    @PostMapping("/upload")
    public ResponseEntity<GalleryImage> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String baseUploadPath = Paths.get("upload").toFile().getAbsolutePath();
            File uploadDir = new File(baseUploadPath);
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String savedFilename = UUID.randomUUID().toString() + extension;
            Path filePath = Paths.get(baseUploadPath, savedFilename);
            file.transferTo(filePath.toFile());

            GalleryImage image = manageGalleryImageUseCase.addGalleryImage(savedFilename);
            return ResponseEntity.ok(image);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<GalleryImage> updateImage(@PathVariable Long id, @RequestBody Map<String, Object> update) {
        Integer sortOrder = update.containsKey("sortOrder") ? (Integer) update.get("sortOrder") : null;
        Boolean isVisible = update.containsKey("isVisible") ? (Boolean) update.get("isVisible") : null;
        return ResponseEntity.ok(manageGalleryImageUseCase.updateGalleryImage(id, sortOrder, isVisible));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable Long id) {
        manageGalleryImageUseCase.deleteGalleryImage(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderImages(@RequestBody Map<String, List<Integer>> request) {
        List<Integer> orderedIdsInt = request.get("orderedIds");
        if (orderedIdsInt != null) {
            List<Long> orderedIds = orderedIdsInt.stream().map(Integer::longValue).toList();
            manageGalleryImageUseCase.updateImagesOrder(orderedIds);
        }
        return ResponseEntity.ok().build();
    }
}
