package com.new_cafe.app.backend.gallery.adapter.in.web;

import com.new_cafe.app.backend.gallery.application.port.in.GetGalleryImageUseCase;
import com.new_cafe.app.backend.gallery.domain.model.GalleryImage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/gallery")
@RequiredArgsConstructor
public class PublicGalleryController {

    private final GetGalleryImageUseCase getGalleryImageUseCase;

    @GetMapping("/public")
    public ResponseEntity<List<GalleryImage>> getVisibleImages() {
        return ResponseEntity.ok(getGalleryImageUseCase.getVisibleGalleryImages());
    }
}
