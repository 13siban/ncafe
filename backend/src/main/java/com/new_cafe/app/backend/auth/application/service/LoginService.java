package com.new_cafe.app.backend.auth.application.service;

import com.new_cafe.app.backend.auth.application.port.in.LoginUseCase;
import com.new_cafe.app.backend.auth.application.port.out.LoadUserPort;
import com.new_cafe.app.backend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.new_cafe.app.backend.config.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LoginService implements LoginUseCase {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final LoadUserPort loadUserPort;

    @Override
    public Result login(Command command) {
        // 1. 아이디 존재 여부 확인
        Optional<User> userOptional = loadUserPort.loadUser(command.getUsername());
        if (userOptional.isEmpty()) {
            throw new RuntimeException("존재하지 않는 아이디입니다.");
        }

        User user = userOptional.get();

        // 2. 비밀번호 일치 여부 확인
        if (!passwordEncoder.matches(command.getPassword(), user.getPassword())) {
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(command.getUsername(), command.getPassword())
            );

            String token = jwtTokenProvider.generateToken(authentication);
            String role = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("ROLE_USER");

            return Result.builder()
                    .token(token)
                    .username(command.getUsername())
                    .role(role)
                    .build();
        } catch (Exception e) {
            e.printStackTrace(); // 터미널 로그에서 확인 가능하도록 출력
            throw new RuntimeException("로그인 실패: " + e.getMessage());
        }
    }
}
