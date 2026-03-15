package com.new_cafe.app.backend.gallery.adapter.out.persistence;

import com.new_cafe.app.backend.gallery.application.port.out.GalleryImagePort;
import com.new_cafe.app.backend.gallery.domain.model.GalleryImage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class GalleryImagePersistenceAdapter implements GalleryImagePort {
    private final GalleryImageRepository repository;

    @Override
    public GalleryImage save(GalleryImage galleryImage) {
        GalleryImageJpaEntity entity = mapToEntity(galleryImage);
        return mapToDomain(repository.save(entity));
    }

    @Override
    public List<GalleryImage> findAll() {
        return repository.findAllByOrderBySortOrderAsc()
                .stream().map(this::mapToDomain).collect(Collectors.toList());
    }

    @Override
    public List<GalleryImage> findAllVisible() {
        return repository.findAllByIsVisibleTrueOrderBySortOrderAsc()
                .stream().map(this::mapToDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<GalleryImage> findById(Long id) {
        return repository.findById(id).map(this::mapToDomain);
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    private GalleryImageJpaEntity mapToEntity(GalleryImage model) {
        return GalleryImageJpaEntity.builder()
                .id(model.getId())
                .imageUrl(model.getImageUrl())
                .sortOrder(model.getSortOrder() != null ? model.getSortOrder() : 0)
                .isVisible(model.getIsVisible() != null ? model.getIsVisible() : true)
                .createdAt(model.getCreatedAt())
                .build();
    }

    private GalleryImage mapToDomain(GalleryImageJpaEntity entity) {
        return GalleryImage.builder()
                .id(entity.getId())
                .imageUrl(entity.getImageUrl())
                .sortOrder(entity.getSortOrder())
                .isVisible(entity.getIsVisible())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
