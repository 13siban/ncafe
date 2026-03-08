package com.new_cafe.app.backend.order.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderJpaRepository extends JpaRepository<OrderJpaEntity, Long> {
}
