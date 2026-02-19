package com.new_cafe.app.backend.menu.adapter.in.web.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuImageResponse {
    private Long id;
    private Long menuId;
    private String srcUrl;
    private Integer sortOrder;
    private String altText;
}
