package com.new_cafe.app.backend.admin.user.application.port.in;

public interface UpdateAdminUserRoleUseCase {
    void updateUserRole(String id, String role, String currentUsername);
}
