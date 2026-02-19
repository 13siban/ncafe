package com.new_cafe.app.backend.auth.application.service;

import com.new_cafe.app.backend.auth.application.port.in.LoginUseCase;
import com.new_cafe.app.backend.auth.application.port.out.LoadUserPort;
import com.new_cafe.app.backend.auth.domain.model.AuthUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LoginService implements LoginUseCase {

    private final LoadUserPort loadUserPort;

    @Override
    public Result login(Command command) {
        // TODO: 직접 인증 로직을 구현할 부분
        // 예: 1. 유저 조회
        // AuthUser user = loadUserPort.loadUser(command.getUsername())
        // .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. 비밀번호 검증
        // if (!passwordEncoder.matches(command.getPassword(), user.getPassword())) {
        // ... }

        // 3. 토큰 생성 및 결과 반환
        return Result.builder()
                .token("dummy-token-for-now")
                .username(command.getUsername())
                .role("USER")
                .build();
    }
}
