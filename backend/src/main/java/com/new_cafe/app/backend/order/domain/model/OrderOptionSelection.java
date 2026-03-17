package com.new_cafe.app.backend.order.domain.model;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OrderOptionSelection {
    private Long id;
    private Long orderItemId;
    private String optionGroupName;
    private String optionItemName;
    private Integer priceDelta;
}
