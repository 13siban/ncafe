package com.new_cafe.app.backend.auth.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeResponse {
    private String id;
    private String email;
    private String nickname;
    private String role;
    private String phoneNumber;
    private String grade;
    private Integer pointBalance;
}
