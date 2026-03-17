package com.new_cafe.app.backend.notice.application.service;

import com.new_cafe.app.backend.notice.application.port.in.ManageNoticePopupUseCase;
import com.new_cafe.app.backend.notice.application.port.out.NoticePopupRepositoryPort;
import com.new_cafe.app.backend.notice.domain.NoticePopup;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminNoticePopupService implements ManageNoticePopupUseCase {
    
    private final NoticePopupRepositoryPort repositoryPort;
    
    @Override
    @Transactional
    public NoticePopup createPopup(String title, String content, String imageUrl, Boolean isActive) {
        NoticePopup popup = NoticePopup.builder()
            .title(title)
            .content(content)
            .imageUrl(imageUrl)
            .isActive(isActive != null ? isActive : false)
            .build();
        return repositoryPort.save(popup);
    }
    
    @Override
    @Transactional
    public NoticePopup updatePopup(Long id, String title, String content, String imageUrl, Boolean isActive) {
        repositoryPort.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Not found"));
        NoticePopup popup = NoticePopup.builder()
            .id(id)
            .title(title)
            .content(content)
            .imageUrl(imageUrl)
            .isActive(isActive != null ? isActive : false)
            .build();
        return repositoryPort.save(popup);
    }
    
    @Override
    @Transactional
    public void deletePopup(Long id) {
        repositoryPort.deleteById(id);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<NoticePopup> getAllPopups() {
        return repositoryPort.findAll();
    }
}
