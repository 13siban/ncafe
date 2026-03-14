package com.new_cafe.app.backend.user.profile.application.port.in;

import com.new_cafe.app.backend.auth.domain.model.User;

public interface GetUserProfileUseCase {
    User getProfile(String id);
}
