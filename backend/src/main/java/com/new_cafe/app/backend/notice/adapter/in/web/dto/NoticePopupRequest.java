package com.new_cafe.app.backend.notice.adapter.in.web.dto;

import lombok.Data;

@Data
public class NoticePopupRequest {
    private String title;
    private String content;
    private String imageUrl;
    private Boolean isActive;
}
