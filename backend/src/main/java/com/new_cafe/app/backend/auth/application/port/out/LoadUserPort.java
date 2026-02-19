package com.new_cafe.app.backend.auth.application.port.out;

import com.new_cafe.app.backend.auth.domain.model.AuthUser;
import java.util.Optional;

public interface LoadUserPort {
    Optional<AuthUser> loadUser(String username);
}
