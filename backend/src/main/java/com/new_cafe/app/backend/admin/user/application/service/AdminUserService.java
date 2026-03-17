package com.new_cafe.app.backend.admin.user.application.service;

import com.new_cafe.app.backend.admin.user.application.port.in.DeleteAdminUserUseCase;
import com.new_cafe.app.backend.admin.user.application.port.in.GetAdminUserListUseCase;
import com.new_cafe.app.backend.admin.user.application.port.in.ToggleAdminUserLockUseCase;
import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import com.new_cafe.app.backend.admin.user.application.port.in.UpdateAdminUserRoleUseCase;
import com.new_cafe.app.backend.admin.user.application.port.in.UpdateAdminUserGradeUseCase;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserService implements GetAdminUserListUseCase, DeleteAdminUserUseCase,
        UpdateAdminUserRoleUseCase, UpdateAdminUserGradeUseCase, ToggleAdminUserLockUseCase {

    private final UserJpaRepository userJpaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<User> getUsers() {
        return userJpaRepository.findAll();
    }

    @Override
    public void deleteUser(String id) {
        userJpaRepository.deleteById(id);
    }

    @Override
    public void updateUserRole(String id, String role, String currentUsername) {
        User user = userJpaRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getUsername().equals(currentUsername)) {
            throw new RuntimeException("자기 자신의 권한은 변경할 수 없습니다.");
        }
        user.updateRole(role);
    }

    @Override
    public void updateUserGrade(String id, String grade) {
        User user = userJpaRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.updateGrade(grade);
    }

    @Override
    public Map<String, Object> toggleLock(String userId) {
        User user = userJpaRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        
        if (user.isEnabled()) {
            user.lock();
        } else {
            user.unlock();
        }
        userJpaRepository.save(user);
        return Map.of(
            "message", user.isEnabled() ? "계정이 잠금 해제되었습니다." : "계정이 잠금되었습니다.",
            "isEnabled", user.isEnabled()
        );
    }
}
