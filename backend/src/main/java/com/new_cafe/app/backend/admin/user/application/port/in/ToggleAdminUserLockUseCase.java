package com.new_cafe.app.backend.admin.user.application.port.in;

import java.util.Map;

public interface ToggleAdminUserLockUseCase {
    Map<String, Object> toggleLock(String userId);
}
