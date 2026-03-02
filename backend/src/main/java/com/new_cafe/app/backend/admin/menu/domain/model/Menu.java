package com.new_cafe.app.backend.admin.menu.domain.model;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * admin 컨텍스트 도메인 모델 — 관리 관점
 * JPA 없음! 순수 비즈니스 로직만.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Menu {
    private Long id;
    @Setter private String korName;
    @Setter private String engName;
    @Setter private String description;
    @Setter private Integer price;
    @Setter private Long categoryId;
    @Setter private Boolean isAvailable;
    @Setter private Boolean isSoldOut;
    @Setter private Integer sortOrder;
    private LocalDateTime createdAt;
    @Setter private LocalDateTime updatedAt;

    // ========== admin 비즈니스 로직 ==========

    /** 가격 변경 (검증 포함) */
    public void changePrice(int newPrice) {
        if (newPrice < 0)
            throw new IllegalArgumentException("가격은 0원 이상이어야 합니다.");
        this.price = newPrice;
        this.updatedAt = LocalDateTime.now();
    }

    /** 판매 상태 토글 */
    public void toggleAvailability() {
        this.isAvailable = !Boolean.TRUE.equals(this.isAvailable);
        this.updatedAt = LocalDateTime.now();
    }

    /** 메뉴 정보 업데이트 */
    public void updateInfo(String korName, String engName, String description, Long categoryId) {
        if (korName != null) this.korName = korName;
        if (engName != null) this.engName = engName;
        if (description != null) this.description = description;
        if (categoryId != null) this.categoryId = categoryId;
        this.updatedAt = LocalDateTime.now();
    }

    /** 신규 메뉴 생성 팩토리 메서드 */
    public static Menu create(String korName, String engName, String description,
                              Integer price, Long categoryId, Boolean isAvailable) {
        return Menu.builder()
                .korName(korName)
                .engName(engName)
                .description(description)
                .price(price)
                .categoryId(categoryId)
                .isAvailable(isAvailable != null ? isAvailable : true)
                .isSoldOut(false)
                .sortOrder(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
