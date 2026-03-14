package com.new_cafe.app.backend.auth.application.service;

import com.new_cafe.app.backend.auth.application.port.in.SignupUseCase;
import com.new_cafe.app.backend.auth.application.port.out.LoadUserPort;
import com.new_cafe.app.backend.auth.application.port.out.SaveUserPort;
import com.new_cafe.app.backend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SignupService implements SignupUseCase {

    private final SaveUserPort saveUserPort;
    private final LoadUserPort loadUserPort;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void signup(SignupCommand command) {
        if (loadUserPort.loadUser(command.getUsername()).isPresent()) {
            throw new RuntimeException("이미 존재하는 사용자입니다.");
        }

        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .username(command.getUsername())
                .password(passwordEncoder.encode(command.getPassword()))
                .nickname(command.getNickname())
                .email(command.getEmail())
                .phoneNumber(command.getPhoneNumber())
                .role("ROLE_USER")
                .build();

        saveUserPort.saveUser(user);
    }
}
