package com.new_cafe.app.backend.user.grade.adapter.in.web.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserGradeResponse {
    private String currentGrade;
    private String currentGradeName;
    private Integer earnRate;
    private boolean gradeSystemEnabled;

    private Integer currentOrderCount;
    private Integer currentOrderAmount;

    private String nextGrade;
    private String nextGradeName;
    private Integer nextGradeRequireCount;
    private Integer nextGradeRequireAmount;
    private String mainColor;
    private String textColor;
}
