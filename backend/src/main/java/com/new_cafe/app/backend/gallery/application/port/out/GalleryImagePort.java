package com.new_cafe.app.backend.gallery.application.port.out;

import com.new_cafe.app.backend.gallery.domain.model.GalleryImage;

import java.util.List;
import java.util.Optional;

public interface GalleryImagePort {
    GalleryImage save(GalleryImage galleryImage);
    List<GalleryImage> findAll();
    List<GalleryImage> findAllVisible();
    Optional<GalleryImage> findById(Long id);
    void deleteById(Long id);
}
