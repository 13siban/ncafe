package com.new_cafe.app.backend.sales.adapter.out.persistence;

import com.new_cafe.app.backend.sales.application.port.out.SalesRepositoryPort;
import com.new_cafe.app.backend.sales.domain.model.DailyMenuSales;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class SalesPersistenceAdapter implements SalesRepositoryPort {

    private final DailyMenuSalesJpaRepository dailyMenuSalesRepository;

    @Override
    public List<DailyMenuSales> findBySaleDate(LocalDate date) {
        return dailyMenuSalesRepository.findBySaleDate(date).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<DailyMenuSales> findBySaleDateBetween(LocalDate start, LocalDate end) {
        return dailyMenuSalesRepository.findBySaleDateBetween(start, end).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private DailyMenuSales toDomain(DailyMenuSalesJpaEntity entity) {
        return DailyMenuSales.builder()
                .id(entity.getId())
                .saleDate(entity.getSaleDate())
                .menuId(entity.getMenuId())
                .menuName(entity.getMenuName())
                .categoryName(entity.getCategoryName())
                .quantitySold(entity.getQuantitySold())
                .totalSales(entity.getTotalSales())
                .build();
    }
}
