package com.new_cafe.app.backend.admin.user.adapter.in.web;

import com.new_cafe.app.backend.admin.user.application.port.in.DeleteAdminUserUseCase;
import com.new_cafe.app.backend.admin.user.application.port.in.GetAdminUserListUseCase;
import com.new_cafe.app.backend.admin.user.application.port.in.ToggleAdminUserLockUseCase;
import com.new_cafe.app.backend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import com.new_cafe.app.backend.admin.user.application.port.in.UpdateAdminUserRoleUseCase;
import com.new_cafe.app.backend.admin.user.application.port.in.UpdateAdminUserGradeUseCase;
import com.new_cafe.app.backend.admin.user.adapter.in.web.dto.UpdateUserRoleRequest;
import com.new_cafe.app.backend.admin.user.adapter.in.web.dto.UpdateUserGradeRequest;
import com.new_cafe.app.backend.admin.user.adapter.in.web.dto.AdminPointRequest;
import com.new_cafe.app.backend.auth.application.port.in.ManageUserPointUseCase;
import com.new_cafe.app.backend.auth.domain.model.UserPoint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
    private final UpdateAdminUserGradeUseCase updateAdminUserGradeUseCase;
    private final ToggleAdminUserLockUseCase toggleAdminUserLockUseCase;
    private final ManageUserPointUseCase userPointUseCase;

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

    @PutMapping("/{id}/grade")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> updateUserGrade(@PathVariable String id, @RequestBody UpdateUserGradeRequest request) {
        updateAdminUserGradeUseCase.updateUserGrade(id, request.getGrade());
        return Map.of("message", "User grade successfully updated");
    }

    @PutMapping("/{id}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> toggleLock(@PathVariable String id) {
        return toggleAdminUserLockUseCase.toggleLock(id);
    }

    @GetMapping("/{id}/points")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Object> getUserPointBalance(@PathVariable String id) {
        int balance = userPointUseCase.getPointBalance(id);
        return Map.of("pointBalance", balance);
    }

    @GetMapping("/{id}/points/history")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<UserPoint> getUserPointHistory(
            @PathVariable String id,
            @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        return userPointUseCase.getPointHistory(id, pageable);
    }

    @PostMapping("/{id}/points")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> adjustUserPoints(@PathVariable String id, @RequestBody AdminPointRequest request) {
        if (request.getAmount() == null || request.getAmount() == 0) {
            throw new IllegalArgumentException("변경할 포인트 금액을 입력해주세요.");
        }
        
        String desc = request.getDescription() != null ? request.getDescription() : "관리자 수동 지급/차감";
        
        if (request.getAmount() > 0) {
            userPointUseCase.earnPoints(id, null, request.getAmount(), desc);
        } else {
            userPointUseCase.usePoints(id, null, Math.abs(request.getAmount()), desc);
        }
        
        return Map.of("message", "포인트가 성공적으로 조정되었습니다.");
    }
}
