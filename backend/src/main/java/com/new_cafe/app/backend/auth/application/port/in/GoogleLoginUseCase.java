package com.new_cafe.app.backend.auth.application.port.in;

import lombok.Builder;
import lombok.Getter;

public interface GoogleLoginUseCase {
    LoginUseCase.Result loginWithGoogle(Command command);

    @Getter
    @Builder
    class Command {
        private String idToken;
    }
}
