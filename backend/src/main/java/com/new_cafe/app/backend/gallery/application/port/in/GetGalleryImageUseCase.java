package com.new_cafe.app.backend.gallery.application.port.in;

import com.new_cafe.app.backend.gallery.domain.model.GalleryImage;
import java.util.List;

public interface GetGalleryImageUseCase {
    List<GalleryImage> getAllGalleryImages();
    List<GalleryImage> getVisibleGalleryImages();
}
