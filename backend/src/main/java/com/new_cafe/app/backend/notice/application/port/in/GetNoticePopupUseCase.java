package com.new_cafe.app.backend.notice.application.port.in;

import com.new_cafe.app.backend.notice.domain.NoticePopup;
import java.util.List;

public interface GetNoticePopupUseCase {
    List<NoticePopup> getActivePopups();
}
