package com.new_cafe.app.backend.admin.category.application.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCategoryCommand {
    private Long id;
    private String name;
    private Integer sortOrder;
}
