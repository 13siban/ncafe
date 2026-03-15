package com.new_cafe.app.backend.gallery.application.port.in;

import com.new_cafe.app.backend.gallery.domain.model.GalleryImage;
import java.util.List;

public interface ManageGalleryImageUseCase {
    GalleryImage addGalleryImage(String imageUrl);
    GalleryImage updateGalleryImage(Long id, Integer sortOrder, Boolean isVisible);
    void deleteGalleryImage(Long id);
    void updateImagesOrder(List<Long> orderedIds);
}
