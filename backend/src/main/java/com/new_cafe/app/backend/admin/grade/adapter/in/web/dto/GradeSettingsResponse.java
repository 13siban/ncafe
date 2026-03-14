package com.new_cafe.app.backend.admin.grade.adapter.in.web.dto;

import com.new_cafe.app.backend.user.grade.domain.model.GradeSettings;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GradeSettingsResponse {
    private String grade;
    private String displayName;
    private Integer earnRate;
    private Integer upgradeOrderCount;
    private Integer upgradeOrderAmount;
    private Integer sortOrder;

    public static GradeSettingsResponse fromDomain(GradeSettings settings) {
        return GradeSettingsResponse.builder()
                .grade(settings.getGrade())
                .displayName(settings.getDisplayName())
                .earnRate(settings.getEarnRate())
                .upgradeOrderCount(settings.getUpgradeOrderCount())
                .upgradeOrderAmount(settings.getUpgradeOrderAmount())
                .sortOrder(settings.getSortOrder())
                .build();
    }
}
