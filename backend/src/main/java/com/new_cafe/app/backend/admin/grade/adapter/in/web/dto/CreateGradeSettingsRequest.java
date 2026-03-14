package com.new_cafe.app.backend.admin.grade.adapter.in.web.dto;

import lombok.Data;

@Data
public class CreateGradeSettingsRequest {
    private String grade;
    private String displayName;
    private Integer earnRate;
    private Integer upgradeOrderCount;
    private Integer upgradeOrderAmount;
}
