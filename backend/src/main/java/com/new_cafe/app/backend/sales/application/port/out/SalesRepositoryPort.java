package com.new_cafe.app.backend.sales.application.port.out;

import com.new_cafe.app.backend.sales.adapter.out.persistence.DailyMenuSalesJpaEntity;

import java.time.LocalDate;
import java.util.List;

public interface SalesRepositoryPort {
    List<DailyMenuSalesJpaEntity> findBySaleDate(LocalDate date);
    List<DailyMenuSalesJpaEntity> findBySaleDateBetween(LocalDate start, LocalDate end);
}
