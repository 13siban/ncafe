package com.new_cafe.app.backend.user.grade.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "grade_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class GradeSettingsJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String grade;

    @Column(name = "display_name", nullable = false, length = 50)
    private String displayName;

    @Column(name = "earn_rate", nullable = false)
    private Integer earnRate;

    @Column(name = "upgrade_order_count")
    private Integer upgradeOrderCount;

    @Column(name = "upgrade_order_amount")
    private Integer upgradeOrderAmount;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "main_color", nullable = false, length = 7)
    private String mainColor = "#333333";

    @Column(name = "text_color", nullable = false, length = 7)
    private String textColor = "#FFFFFF";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    public void updateSettings(String displayName, Integer earnRate, Integer count, Integer amount, String mainColor, String textColor) {
        if (displayName != null) this.displayName = displayName;
        if (earnRate != null) this.earnRate = earnRate;
        this.upgradeOrderCount = count;
        this.upgradeOrderAmount = amount;
        if (mainColor != null) this.mainColor = mainColor;
        if (textColor != null) this.textColor = textColor;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
