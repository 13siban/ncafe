package com.new_cafe.app.backend.user.grade.domain.model;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GradeSettings {
    private String grade;
    private String displayName;
    private Integer earnRate;
    private Integer upgradeOrderCount;
    private Integer upgradeOrderAmount;
    private Integer sortOrder;
    private String mainColor;
    private String textColor;
}
