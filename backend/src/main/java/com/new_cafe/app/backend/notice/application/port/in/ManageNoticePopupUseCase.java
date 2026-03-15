package com.new_cafe.app.backend.notice.application.port.in;

import com.new_cafe.app.backend.notice.domain.NoticePopup;
import java.util.List;

public interface ManageNoticePopupUseCase {
    NoticePopup createPopup(String title, String content, String imageUrl, Boolean isActive);
    NoticePopup updatePopup(Long id, String title, String content, String imageUrl, Boolean isActive);
    void deletePopup(Long id);
    List<NoticePopup> getAllPopups();
}
