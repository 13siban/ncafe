package com.new_cafe.app.backend.admin.menu.domain.model;

import java.time.LocalDateTime;
import com.new_cafe.app.backend.category.domain.model.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "AdminMenu")
@Table(name = "menus")
public class Menu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String korName;
    private String engName;
    private String description;
    private Integer price;
    @Column(name = "category_id")
    private Long categoryId;
    private Boolean isAvailable;
    private Boolean isSoldOut;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Transient
    private Category category;

    // ========== 관리 비즈니스 로직 ==========
    public void changePrice(int newPrice) {
        if (newPrice < 0)
            throw new IllegalArgumentException("가격은 0원 이상이어야 합니다.");
        this.price = newPrice;
        this.updatedAt = LocalDateTime.now();
    }

    public void toggleAvailability() {
        this.isAvailable = (this.isAvailable == null) ? true : !this.isAvailable;
        this.updatedAt = LocalDateTime.now();
    }
}
