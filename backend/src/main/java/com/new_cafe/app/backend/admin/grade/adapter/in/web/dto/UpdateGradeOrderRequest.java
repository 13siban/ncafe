package com.new_cafe.app.backend.admin.grade.adapter.in.web.dto;

import lombok.Data;

@Data
public class UpdateGradeOrderRequest {
    private String grade;
    private Integer sortOrder;
}
