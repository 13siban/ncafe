package com.new_cafe.app.backend.menu.domain.model;

import com.new_cafe.app.backend.category.domain.model.Category;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "ServiceMenu")
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
    
    @Transient
    private List<MenuImage> images;

    // ========== 비즈니스 로직 ==========

    /**
     * 최종 주문 가능 여부 확인 (판매 중이며 품절되지 않음)
     */
    public boolean isOrderable() {
        return Boolean.TRUE.equals(isAvailable) && !Boolean.TRUE.equals(isSoldOut);
    }

    /**
     * 특정 할인율이 적용된 가격 계산
     */
    public int calculateDiscountedPrice(double discountRate) {
        if (discountRate <= 0) return this.price;
        return (int) (this.price * (1 - discountRate));
    }

    /**
     * 신상품 여부 확인 (최근 7일 이내 등록)
     */
    public boolean isNew() {
        if (createdAt == null) return false;
        return createdAt.isAfter(LocalDateTime.now().minusDays(7));
    }
}
