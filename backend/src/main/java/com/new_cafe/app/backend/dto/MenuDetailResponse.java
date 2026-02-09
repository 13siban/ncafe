package com.new_cafe.app.backend.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuDetailResponse {
    private Long id;
    private String korName;
    private String engName;
    private String description;
    private Integer price;
    private String categoryName;
    private Boolean isAvailable;
    private Boolean isSoldOut;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
