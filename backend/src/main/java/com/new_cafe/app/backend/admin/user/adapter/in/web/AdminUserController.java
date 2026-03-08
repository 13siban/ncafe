package com.new_cafe.app.backend.admin.user.adapter.in.web;

import com.new_cafe.app.backend.admin.user.application.port.in.DeleteAdminUserUseCase;
import com.new_cafe.app.backend.admin.user.application.port.in.GetAdminUserListUseCase;
import com.new_cafe.app.backend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final GetAdminUserListUseCase getAdminUserListUseCase;
    private final DeleteAdminUserUseCase deleteAdminUserUseCase;

    @GetMapping
    public List<User> getUsers() {
        return getAdminUserListUseCase.getUsers();
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteUser(@PathVariable String id) {
        deleteAdminUserUseCase.deleteUser(id);
        return Map.of("message", "User successfully deleted");
    }
}
