package com.new_cafe.app.backend.menu.application.result;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 개별 메뉴 이미지 결과
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuImageResult {
    private Long id;
    private Long menuId;
    private String srcUrl;
    private Integer sortOrder;
    private String altText;
}
