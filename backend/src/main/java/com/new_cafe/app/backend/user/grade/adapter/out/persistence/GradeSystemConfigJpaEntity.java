package com.new_cafe.app.backend.user.grade.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "grade_system_config")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class GradeSystemConfigJpaEntity {
    @Id
    private Long id; // Always 1

    private boolean isEnabled;

    @Column(name = "default_earn_rate", nullable = false)
    @Builder.Default
    private Integer defaultEarnRate = 1;

    public void setEnabled(boolean enabled) {
        this.isEnabled = enabled;
    }

    public void setDefaultEarnRate(Integer defaultEarnRate) {
        this.defaultEarnRate = defaultEarnRate;
    }
}
