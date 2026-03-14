package com.new_cafe.app.backend.user.profile.application.service;

import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.user.profile.application.port.in.GetUserProfileUseCase;
import com.new_cafe.app.backend.user.profile.application.port.in.UpdateUserProfileUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserProfileService implements GetUserProfileUseCase, UpdateUserProfileUseCase {

    private final UserJpaRepository userJpaRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public User getProfile(String id) {
        return userJpaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
    }

    @Override
    public void updateProfile(String id, String nickname, String email, String phoneNumber) {
        User user = userJpaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        user.updateProfile(nickname, email, phoneNumber);
    }

    @Override
    public void updatePassword(String id, String currentPassword, String newPassword) {
        User user = userJpaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("현재 비밀번호가 일치하지 않습니다.");
        }

        user.updatePassword(passwordEncoder.encode(newPassword));
    }
}
