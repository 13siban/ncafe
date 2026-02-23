package com.new_cafe.app.backend.menu.adapter.in.web.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuListRequest {
    private Long categoryId;
    private String searchQuery;
    
    // 추가 파라미터
    private Integer page;
    private Integer size;
    private String sortBy;
    private Boolean onlyAvailable;
}
