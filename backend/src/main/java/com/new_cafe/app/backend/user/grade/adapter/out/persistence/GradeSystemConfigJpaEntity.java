package com.new_cafe.app.backend.user.grade.adapter.out.persistence;

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

    public void setEnabled(boolean enabled) {
        this.isEnabled = enabled;
    }
}
