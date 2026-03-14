package com.new_cafe.app.backend.auth.adapter.in.web;

import com.new_cafe.app.backend.auth.application.port.in.ManageUserPointUseCase;
import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.auth.domain.model.UserPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/users/me/points")
@RequiredArgsConstructor
public class UserPointController {

    private final ManageUserPointUseCase userPointUseCase;

    /**
     * 현재 포인트 잔액 조회
     */
    @GetMapping
    public ResponseEntity<?> getPointBalance(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "인증되지 않은 사용자입니다."));
        }
        int balance = userPointUseCase.getPointBalance(user.getId());
        return ResponseEntity.ok(Map.of("pointBalance", balance));
    }

    /**
     * 포인트 적립/사용 내역 조회
     */
    @GetMapping("/history")
    public ResponseEntity<?> getPointHistory(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "인증되지 않은 사용자입니다."));
        }
        Page<UserPoint> history = userPointUseCase.getPointHistory(user.getId(), pageable);
        return ResponseEntity.ok(history);
    }
}
