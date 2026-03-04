package com.new_cafe.app.backend.auth.application.port.out;

import com.new_cafe.app.backend.auth.domain.model.User;
import java.util.Optional;

public interface LoadUserPort {
    Optional<User> loadUser(String username);
}
