package com.new_cafe.app.backend.sales.adapter.out.persistence;

import com.new_cafe.app.backend.sales.application.port.out.SalesRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SalesPersistenceAdapter implements SalesRepositoryPort {

    private final DailyMenuSalesJpaRepository dailyMenuSalesRepository;

    @Override
    public List<DailyMenuSalesJpaEntity> findBySaleDate(LocalDate date) {
        return dailyMenuSalesRepository.findBySaleDate(date);
    }

    @Override
    public List<DailyMenuSalesJpaEntity> findBySaleDateBetween(LocalDate start, LocalDate end) {
        return dailyMenuSalesRepository.findBySaleDateBetween(start, end);
    }
}
