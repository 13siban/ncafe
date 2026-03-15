package com.new_cafe.app.backend.admin.menu.adapter.in.web;

import lombok.Data;

@Data
public class ReorderDto {
    private Long menuId;
    private Integer sortOrder;
}
