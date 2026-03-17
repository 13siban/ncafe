package com.new_cafe.app.backend.order.adapter.out.persistence;

import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OrderJpaRepository extends JpaRepository<OrderJpaEntity, Long> {
    interface TopMenuProjection {
        Long getMenuId();
        String getMenuName();
        Long getTotalQuantity();
    }
    List<OrderJpaEntity> findByOrderDateOrderByCreatedAtDesc(LocalDate orderDate);
    List<OrderJpaEntity> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<OrderJpaEntity> findByOrderDateAndOrderNumber(LocalDate orderDate, Integer orderNumber);
    
    long countByOrderDate(LocalDate orderDate);
    
    long countByOrderDateAndStatus(LocalDate orderDate, OrderStatus status);
    
    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM OrderJpaEntity o WHERE o.orderDate = :date AND o.status = com.new_cafe.app.backend.order.domain.model.OrderStatus.COMPLETED")
    long sumTotalPriceByOrderDateAndStatusCompleted(@Param("date") LocalDate date);

    @Query("SELECT COUNT(DISTINCT o.userId) FROM OrderJpaEntity o WHERE o.orderDate = :date AND o.userId IS NOT NULL")
    long countDistinctUserIdsByOrderDate(@Param("date") LocalDate date);

    @Query("SELECT COUNT(o) FROM OrderJpaEntity o WHERE o.orderDate = :date AND o.userId IS NULL")
    long countGuestOrdersByOrderDate(@Param("date") LocalDate date);

    List<OrderJpaEntity> findByOrderDateBetween(LocalDate start, LocalDate end);

    @Query("SELECT oi.menuId AS menuId, oi.menuName AS menuName, SUM(oi.quantity) AS totalQuantity " +
           "FROM OrderJpaEntity o JOIN OrderItemJpaEntity oi ON o.id = oi.orderId " +
           "WHERE o.userId = :userId " +
           "GROUP BY oi.menuId, oi.menuName " +
           "ORDER BY SUM(oi.quantity) DESC")
    List<TopMenuProjection> findTopMenusByUserId(@Param("userId") String userId, Pageable pageable);
}
