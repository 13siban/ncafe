package com.new_cafe.app.backend.notice.application.service;

import com.new_cafe.app.backend.notice.application.port.in.GetNoticePopupUseCase;
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
public class NoticePopupService implements GetNoticePopupUseCase {
    
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
    @Transactional(readOnly = true)
    public List<NoticePopup> getActivePopups() {
        return repository.findByIsActiveTrue()
            .stream().map(this::toDomain).collect(Collectors.toList());
    }
}
