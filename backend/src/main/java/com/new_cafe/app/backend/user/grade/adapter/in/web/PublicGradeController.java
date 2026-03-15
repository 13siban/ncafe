package com.new_cafe.app.backend.user.grade.adapter.in.web;

import com.new_cafe.app.backend.admin.grade.adapter.in.web.dto.GradeSettingsResponse;
import com.new_cafe.app.backend.user.grade.application.port.in.ManageGradeSettingsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/grades/public")
@RequiredArgsConstructor
public class PublicGradeController {
    
    private final ManageGradeSettingsUseCase manageGradeSettingsUseCase;
    
    @GetMapping
    public ResponseEntity<List<GradeSettingsResponse>> getPublicGrades() {
        if (!manageGradeSettingsUseCase.isGradeSystemEnabled()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        return ResponseEntity.ok(
            manageGradeSettingsUseCase.getAllSettings().stream()
                .map(GradeSettingsResponse::fromDomain)
                .collect(Collectors.toList())
        );
    }
}
