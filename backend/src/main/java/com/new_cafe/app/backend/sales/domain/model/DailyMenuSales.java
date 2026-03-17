package com.new_cafe.app.backend.sales.domain.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class DailyMenuSales {
    private Long id;
    private LocalDate saleDate;
    private Long menuId;
    private String menuName;
    private String categoryName;
    private Integer quantitySold;
    private Integer totalSales;
}
