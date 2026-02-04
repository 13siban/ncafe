package com.new_cafe.app.backend.entity;

import java.time.LocalDateTime;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;



@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Menu {
    private Long id;
    private String korName;
    private String engName;
    private String description;
    private Integer price;
    // private String categoryName;
    private Long categoryId;
    // private String imageSrc;
    private Boolean isAvailable;
    // private Boolean isSoldOut;
    // private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Category category;
    // private List<MenuImage> images;

    
}
