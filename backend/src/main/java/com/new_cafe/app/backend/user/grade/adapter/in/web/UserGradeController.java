package com.new_cafe.app.backend.user.grade.adapter.in.web;

import com.new_cafe.app.backend.user.grade.adapter.in.web.dto.UserGradeResponse;
import com.new_cafe.app.backend.user.grade.application.service.UserGradeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import com.new_cafe.app.backend.auth.domain.model.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users/me/grade")
@RequiredArgsConstructor
public class UserGradeController {

    private final UserGradeService userGradeService;

    @GetMapping
    public ResponseEntity<UserGradeResponse> getMyGrade(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        
        String userId = user.getId(); 
        return ResponseEntity.ok(userGradeService.getUserGradeInfo(userId));
    }
}
