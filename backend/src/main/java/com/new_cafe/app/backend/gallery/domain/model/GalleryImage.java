package com.new_cafe.app.backend.gallery.domain.model;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GalleryImage {
    private Long id;
    private String imageUrl;
    private Integer sortOrder;
    private Boolean isVisible;
    private LocalDateTime createdAt;

    public void updateSort(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public void updateVisibility(boolean visible) {
        this.isVisible = visible;
    }
}
