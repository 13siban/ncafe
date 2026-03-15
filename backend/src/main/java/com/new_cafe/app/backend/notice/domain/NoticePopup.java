package com.new_cafe.app.backend.notice.domain;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NoticePopup {
    private Long id;
    private String title;
    private String content;
    private String imageUrl;
    private Boolean isActive;
}
