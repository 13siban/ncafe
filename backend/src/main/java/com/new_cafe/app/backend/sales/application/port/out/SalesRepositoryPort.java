package com.new_cafe.app.backend.sales.application.port.out;

import com.new_cafe.app.backend.sales.domain.model.DailyMenuSales;

import java.time.LocalDate;
import java.util.List;

public interface SalesRepositoryPort {
    List<DailyMenuSales> findBySaleDate(LocalDate date);
    List<DailyMenuSales> findBySaleDateBetween(LocalDate start, LocalDate end);
}
