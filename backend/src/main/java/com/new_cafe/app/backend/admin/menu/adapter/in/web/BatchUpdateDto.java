package com.new_cafe.app.backend.admin.menu.adapter.in.web;

import lombok.Data;

@Data
public class BatchUpdateDto {
    private Long menuId;
    private String korName;
    private Integer price;
    private Long categoryId;
    private Boolean isAvailable;
    private Boolean isSoldOut;
    private Integer sortOrder;
}
