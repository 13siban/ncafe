package com.new_cafe.app.backend.gallery.application.service;

import com.new_cafe.app.backend.gallery.application.port.in.GetGalleryImageUseCase;
import com.new_cafe.app.backend.gallery.application.port.in.ManageGalleryImageUseCase;
import com.new_cafe.app.backend.gallery.application.port.out.GalleryImagePort;
import com.new_cafe.app.backend.gallery.domain.model.GalleryImage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GalleryImageService implements ManageGalleryImageUseCase, GetGalleryImageUseCase {

    private final GalleryImagePort galleryImagePort;

    @Override
    public GalleryImage addGalleryImage(String imageUrl) {
        List<GalleryImage> all = galleryImagePort.findAll();
        int nextOrder = all.stream().mapToInt(GalleryImage::getSortOrder).max().orElse(-1) + 1;

        GalleryImage image = GalleryImage.builder()
                .imageUrl(imageUrl)
                .sortOrder(nextOrder)
                .isVisible(true)
                .build();
        return galleryImagePort.save(image);
    }

    @Override
    public GalleryImage updateGalleryImage(Long id, Integer sortOrder, Boolean isVisible) {
        GalleryImage image = galleryImagePort.findById(id).orElseThrow(() -> new IllegalArgumentException("Image not found: " + id));
        GalleryImage updated = GalleryImage.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .sortOrder(sortOrder != null ? sortOrder : image.getSortOrder())
                .isVisible(isVisible != null ? isVisible : image.getIsVisible())
                .createdAt(image.getCreatedAt())
                .build();
        return galleryImagePort.save(updated);
    }

    @Override
    public void deleteGalleryImage(Long id) {
        galleryImagePort.deleteById(id);
    }

    @Override
    public void updateImagesOrder(List<Long> orderedIds) {
        List<GalleryImage> all = galleryImagePort.findAll();
        Map<Long, GalleryImage> imageMap = all.stream().collect(Collectors.toMap(GalleryImage::getId, img -> img));

        for (int i = 0; i < orderedIds.size(); i++) {
            Long id = orderedIds.get(i);
            GalleryImage img = imageMap.get(id);
            if (img != null && img.getSortOrder() != i) {
                GalleryImage updated = GalleryImage.builder()
                        .id(img.getId())
                        .imageUrl(img.getImageUrl())
                        .sortOrder(i)
                        .isVisible(img.getIsVisible())
                        .createdAt(img.getCreatedAt())
                        .build();
                galleryImagePort.save(updated);
            }
        }
    }

    @Override
    public List<GalleryImage> getAllGalleryImages() {
        return galleryImagePort.findAll();
    }

    @Override
    public List<GalleryImage> getVisibleGalleryImages() {
        return galleryImagePort.findAllVisible();
    }
}
