package com.new_cafe.app.backend.dto;

import java.util.List;

// 생성자 추가
// getter, setter 추가
// tostring 추가


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
}
