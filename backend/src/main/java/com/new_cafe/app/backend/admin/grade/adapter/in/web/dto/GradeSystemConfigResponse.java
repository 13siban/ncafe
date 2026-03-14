package com.new_cafe.app.backend.admin.grade.adapter.in.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GradeSystemConfigResponse {
    
    @JsonProperty("isEnabled")
    private boolean isEnabled;
}
