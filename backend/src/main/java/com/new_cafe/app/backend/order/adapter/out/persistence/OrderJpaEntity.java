package com.new_cafe.app.backend.order.adapter.out.persistence;

import com.new_cafe.app.backend.order.domain.model.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"order_date", "order_number"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class OrderJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "order_number", nullable = false)
    private Integer orderNumber;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "customer_name", nullable = false, length = 50)
    private String customerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    @Column(name = "total_price", nullable = false)
    private Integer totalPrice;

    @Column(name = "used_points")
    private Integer usedPoints;

    @Column(name = "earn_points")
    private Integer earnPoints;

    @Column(name = "reject_reason")
    private String rejectReason;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Column(name = "payment_id", length = 100)
    private String paymentId;

    @Column(name = "payment_method", length = 20)
    private String paymentMethod;

    @Column(name = "payment_status", length = 20)
    private String paymentStatus;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = createdAt;
        if (totalPrice == null) totalPrice = 0;
        if (status == null) status = OrderStatus.PREPARING;
        if (orderDate == null) orderDate = LocalDate.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
