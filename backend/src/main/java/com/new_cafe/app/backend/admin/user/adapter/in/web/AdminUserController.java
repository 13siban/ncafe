package com.new_cafe.app.backend.admin.user.adapter.in.web;

import com.new_cafe.app.backend.admin.user.application.port.in.DeleteAdminUserUseCase;
import com.new_cafe.app.backend.admin.user.application.port.in.GetAdminUserListUseCase;
import com.new_cafe.app.backend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.new_cafe.app.backend.admin.user.application.port.in.UpdateAdminUserRoleUseCase;
import com.new_cafe.app.backend.admin.user.adapter.in.web.dto.UpdateUserRoleRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final GetAdminUserListUseCase getAdminUserListUseCase;
    private final DeleteAdminUserUseCase deleteAdminUserUseCase;
    private final UpdateAdminUserRoleUseCase updateAdminUserRoleUseCase;

    @GetMapping
    public List<User> getUsers() {
        return getAdminUserListUseCase.getUsers();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> deleteUser(@PathVariable String id) {
        deleteAdminUserUseCase.deleteUser(id);
        return Map.of("message", "User successfully deleted");
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> updateUserRole(@PathVariable String id, @RequestBody UpdateUserRoleRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();
        updateAdminUserRoleUseCase.updateUserRole(id, request.getRole(), currentUsername);
        return Map.of("message", "User role successfully updated");
    }
}
