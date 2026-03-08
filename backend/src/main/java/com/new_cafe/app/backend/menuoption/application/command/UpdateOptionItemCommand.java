package com.new_cafe.app.backend.menuoption.application.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOptionItemCommand {
    private Long id;
    private String name;
    private Integer priceDelta;
    private Integer sortOrder;
}
