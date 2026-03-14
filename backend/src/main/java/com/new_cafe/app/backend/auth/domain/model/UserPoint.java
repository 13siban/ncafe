package com.new_cafe.app.backend.auth.domain.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_points")
public class UserPoint {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "order_id")
    private String orderId;

    @Column(name = "point_amount", nullable = false)
    private int pointAmount;

    @Column(name = "type", nullable = false)
    private String type; // EARN, USE, EXPIRE, CANCEL

    @Column(name = "balance_snapshot", nullable = false)
    private int balanceSnapshot;

    @Column(name = "description")
    private String description;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
