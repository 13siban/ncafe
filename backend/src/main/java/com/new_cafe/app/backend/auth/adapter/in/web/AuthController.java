package com.new_cafe.app.backend.auth.adapter.in.web;

import com.new_cafe.app.backend.auth.adapter.in.web.dto.LoginRequest;
import com.new_cafe.app.backend.auth.adapter.in.web.dto.LoginResponse;
import com.new_cafe.app.backend.auth.application.port.in.LoginUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final LoginUseCase loginUseCase;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        LoginUseCase.Result result = loginUseCase.login(
                LoginUseCase.Command.builder()
                        .username(request.getUsername())
                        .password(request.getPassword())
                        .build());

        return LoginResponse.builder()
                .token(result.getToken())
                .username(result.getUsername())
                .role(result.getRole())
                .build();
    }
}
