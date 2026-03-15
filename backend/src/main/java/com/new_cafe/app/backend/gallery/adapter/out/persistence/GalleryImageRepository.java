package com.new_cafe.app.backend.gallery.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GalleryImageRepository extends JpaRepository<GalleryImageJpaEntity, Long> {
    List<GalleryImageJpaEntity> findAllByOrderBySortOrderAsc();
    List<GalleryImageJpaEntity> findAllByIsVisibleTrueOrderBySortOrderAsc();
}
