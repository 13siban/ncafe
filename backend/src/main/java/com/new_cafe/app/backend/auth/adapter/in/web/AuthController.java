package com.new_cafe.app.backend.auth.adapter.in.web;

import com.new_cafe.app.backend.auth.adapter.in.web.dto.LoginRequest;
import com.new_cafe.app.backend.auth.adapter.in.web.dto.LoginResponse;
import com.new_cafe.app.backend.auth.adapter.in.web.dto.MeResponse;
import com.new_cafe.app.backend.auth.application.port.in.LoginUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ExceptionHandler;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.Map;

@RestController
@RequestMapping("/auth")
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

    /**
     * BFF 패턴에서 로그인 직후 사용자 정보를 조회하는 엔드포인트.
     * Next.js 서버가 JWT를 Authorization 헤더에 넣어 호출합니다.
     */
    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "인증되지 않은 사용자입니다."));
        }

        String username = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_USER");

        return ResponseEntity.ok(MeResponse.builder()
                .id(username)        // id 필드에 username 사용 (users 테이블에 별도 email 없으므로)
                .email(username)     // email 필드도 username으로 매핑
                .nickname(username)
                .role(role)
                .build());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", e.getMessage()));
    }
}
