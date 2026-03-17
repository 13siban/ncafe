package com.new_cafe.app.backend.order.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderOptionSelectionJpaRepository extends JpaRepository<OrderOptionSelectionJpaEntity, Long> {
    List<OrderOptionSelectionJpaEntity> findByOrderItemId(Long orderItemId);
}

