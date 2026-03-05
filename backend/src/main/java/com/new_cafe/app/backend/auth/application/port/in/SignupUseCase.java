package com.new_cafe.app.backend.auth.application.port.in;

import lombok.Builder;
import lombok.Value;

public interface SignupUseCase {
    void signup(SignupCommand command);

    @Value
    @Builder
    class SignupCommand {
        String username;
        String password;
    }
}
