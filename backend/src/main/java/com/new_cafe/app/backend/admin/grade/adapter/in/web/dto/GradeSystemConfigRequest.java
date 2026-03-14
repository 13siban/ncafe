package com.new_cafe.app.backend.admin.grade.adapter.in.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GradeSystemConfigRequest {
    @JsonProperty("isEnabled")
    private boolean isEnabled;

    private Integer defaultEarnRate;
}
