package com.new_cafe.app.backend.auth.adapter.in.web;

import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class UserAccountController {

    private final UserJpaRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * 계정 탈퇴 요청 (soft delete)
     * 비밀번호 재확인 후 deletedAt 설정
     */
    @DeleteMapping
    public ResponseEntity<?> requestDeletion(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "인증되지 않은 사용자입니다."));
        }

        User dbUser = userRepository.findById(user.getId()).orElse(null);
        if (dbUser == null) {
            return ResponseEntity.status(404).body(Map.of("message", "사용자를 찾을 수 없습니다."));
        }

        boolean isSocialUser = dbUser.getUsername() != null && dbUser.getUsername().startsWith("google_");

        if (!isSocialUser) {
            String password = body.get("password");
            if (password == null || password.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "비밀번호를 입력해주세요."));
            }
            if (!passwordEncoder.matches(password, dbUser.getPassword())) {
                return ResponseEntity.badRequest().body(Map.of("message", "비밀번호가 일치하지 않습니다."));
            }
        }

        dbUser.requestDeletion();
        userRepository.save(dbUser);

        return ResponseEntity.ok(Map.of("message", "탈퇴 요청이 처리되었습니다. 30일 이내에 로그인하면 계정을 복구할 수 있습니다."));
    }

    /**
     * 탈퇴 취소 (30일 이내)
     */
    @PostMapping("/restore")
    public ResponseEntity<?> restoreAccount(
            @RequestBody Map<String, String> body
    ) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "아이디와 비밀번호를 입력해주세요."));
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "사용자를 찾을 수 없습니다."));
        }

        if (user.getDeletedAt() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "탈퇴 요청이 없는 계정입니다."));
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "비밀번호가 일치하지 않습니다."));
        }

        // 30일 경과 체크
        if (user.getDeletedAt().plusDays(30).isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "복구 기간(30일)이 지났습니다."));
        }

        user.restoreAccount();
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "계정이 성공적으로 복구되었습니다. 다시 로그인해주세요."));
    }
}
