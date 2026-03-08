package com.new_cafe.app.backend.admin.user.application.port.in;

import com.new_cafe.app.backend.auth.domain.model.User;
import java.util.List;

public interface GetAdminUserListUseCase {
    List<User> getUsers();
}
