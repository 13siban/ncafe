package com.new_cafe.app.backend.notice.application.service;

import com.new_cafe.app.backend.notice.application.port.in.ManageNoticePopupUseCase;
import com.new_cafe.app.backend.notice.domain.NoticePopup;
import com.new_cafe.app.backend.notice.adapter.out.persistence.NoticePopupJpaEntity;
import com.new_cafe.app.backend.notice.adapter.out.persistence.NoticePopupJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminNoticePopupService implements ManageNoticePopupUseCase {
    
    private final NoticePopupJpaRepository repository;
    
    private NoticePopup toDomain(NoticePopupJpaEntity entity) {
        return NoticePopup.builder()
            .id(entity.getId())
            .title(entity.getTitle())
            .content(entity.getContent())
            .imageUrl(entity.getImageUrl())
            .isActive(entity.getIsActive())
            .build();
    }
    
    @Override
    @Transactional
    public NoticePopup createPopup(String title, String content, String imageUrl, Boolean isActive) {
        NoticePopupJpaEntity entity = NoticePopupJpaEntity.builder()
            .title(title)
            .content(content)
            .imageUrl(imageUrl)
            .isActive(isActive != null ? isActive : false)
            .build();
        NoticePopupJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }
    
    @Override
    @Transactional
    public NoticePopup updatePopup(Long id, String title, String content, String imageUrl, Boolean isActive) {
        NoticePopupJpaEntity entity = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Not found"));
        entity.setTitle(title);
        entity.setContent(content);
        entity.setImageUrl(imageUrl);
        entity.setIsActive(isActive != null ? isActive : false);
        NoticePopupJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }
    
    @Override
    @Transactional
    public void deletePopup(Long id) {
        repository.deleteById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<NoticePopup> getAllPopups() {
        return repository.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }
}
