package com.new_cafe.app.backend.notice.adapter.out.persistence;

import com.new_cafe.app.backend.notice.application.port.out.NoticePopupRepositoryPort;
import com.new_cafe.app.backend.notice.domain.NoticePopup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class NoticePopupPersistenceAdapter implements NoticePopupRepositoryPort {

    private final NoticePopupJpaRepository jpaRepository;

    @Override
    public NoticePopup save(NoticePopup popup) {
        NoticePopupJpaEntity entity;
        if (popup.getId() != null) {
            entity = jpaRepository.findById(popup.getId()).orElse(new NoticePopupJpaEntity());
        } else {
            entity = new NoticePopupJpaEntity();
        }
        entity.setTitle(popup.getTitle());
        entity.setContent(popup.getContent());
        entity.setImageUrl(popup.getImageUrl());
        entity.setIsActive(popup.getIsActive() != null ? popup.getIsActive() : false);
        NoticePopupJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<NoticePopup> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public List<NoticePopup> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private NoticePopup toDomain(NoticePopupJpaEntity entity) {
        return NoticePopup.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .imageUrl(entity.getImageUrl())
                .isActive(entity.getIsActive())
                .build();
    }
}
