package com.new_cafe.app.backend.notice.application.port.out;

import com.new_cafe.app.backend.notice.domain.NoticePopup;
import java.util.List;
import java.util.Optional;

public interface NoticePopupRepositoryPort {
    NoticePopup save(NoticePopup popup);
    Optional<NoticePopup> findById(Long id);
    void deleteById(Long id);
    List<NoticePopup> findAll();
}
