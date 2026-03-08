package com.new_cafe.app.backend.sales.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_menu_sales", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"sale_date", "menu_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DailyMenuSalesJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sale_date", nullable = false)
    private LocalDate saleDate;

    @Column(name = "menu_id", nullable = false)
    private Long menuId;

    @Column(name = "menu_name", nullable = false, length = 100)
    private String menuName;

    @Column(name = "category_name", length = 100)
    private String categoryName;

    @Column(name = "quantity_sold", nullable = false)
    private Integer quantitySold;

    @Column(name = "total_sales", nullable = false)
    private Integer totalSales;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void addSales(int quantity, int sales) {
        this.quantitySold += quantity;
        this.totalSales += sales;
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = createdAt;
        if (quantitySold == null) quantitySold = 0;
        if (totalSales == null) totalSales = 0;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
