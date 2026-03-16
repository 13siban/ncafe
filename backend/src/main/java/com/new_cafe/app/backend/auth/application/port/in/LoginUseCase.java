package com.new_cafe.app.backend.auth.application.port.in;

import lombok.Builder;
import lombok.Getter;

public interface LoginUseCase {
    Result login(Command command);

    @Getter
    @Builder
    class Command {
        private String username;
        private String password;
    }

    @Getter
    @Builder
    class Result {
        private String token;
        private String username;
        private String role;
        private boolean accountRestored;
    }
}
