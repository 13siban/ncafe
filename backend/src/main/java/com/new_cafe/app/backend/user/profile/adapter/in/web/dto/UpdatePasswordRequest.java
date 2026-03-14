package com.new_cafe.app.backend.user.profile.adapter.in.web.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePasswordRequest {
    private String currentPassword;
    private String newPassword;
}
