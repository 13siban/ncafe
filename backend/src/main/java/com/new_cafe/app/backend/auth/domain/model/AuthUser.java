package com.new_cafe.app.backend.auth.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthUser {
    private Long id;
    private String username;
    private String password;
    private String role;
}
