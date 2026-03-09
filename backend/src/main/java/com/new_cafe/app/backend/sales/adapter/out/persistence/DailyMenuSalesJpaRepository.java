package com.new_cafe.app.backend.sales.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface DailyMenuSalesJpaRepository extends JpaRepository<DailyMenuSalesJpaEntity, Long> {
    List<DailyMenuSalesJpaEntity> findBySaleDate(LocalDate saleDate);
    List<DailyMenuSalesJpaEntity> findBySaleDateBetween(LocalDate start, LocalDate end);
}
