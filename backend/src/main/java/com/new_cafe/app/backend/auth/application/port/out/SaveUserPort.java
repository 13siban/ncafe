package com.new_cafe.app.backend.auth.application.port.out;

import com.new_cafe.app.backend.auth.domain.model.User;

public interface SaveUserPort {
    void saveUser(User user);
}
