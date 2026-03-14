package com.new_cafe.app.backend.admin.grade.adapter.in.web;

import com.new_cafe.app.backend.admin.grade.adapter.in.web.dto.GradeSettingsResponse;
import com.new_cafe.app.backend.admin.grade.adapter.in.web.dto.UpdateGradeSettingsRequest;
import com.new_cafe.app.backend.admin.grade.adapter.in.web.dto.CreateGradeSettingsRequest;
import com.new_cafe.app.backend.admin.grade.adapter.in.web.dto.UpdateGradeOrderRequest;
import com.new_cafe.app.backend.admin.grade.adapter.in.web.dto.GradeSystemConfigRequest;
import com.new_cafe.app.backend.admin.grade.adapter.in.web.dto.GradeSystemConfigResponse;
import com.new_cafe.app.backend.user.grade.application.port.in.ManageGradeSettingsUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/grade-settings")
@RequiredArgsConstructor
public class AdminGradeSettingsController {

    private final ManageGradeSettingsUseCase manageGradeSettingsUseCase;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUB_ADMIN')")
    public ResponseEntity<List<GradeSettingsResponse>> getAllSettings() {
        return ResponseEntity.ok(
                manageGradeSettingsUseCase.getAllSettings().stream()
                        .map(GradeSettingsResponse::fromDomain)
                        .collect(Collectors.toList())
        );
    }

    @PutMapping("/{grade}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> updateSettings(
            @PathVariable String grade,
            @RequestBody UpdateGradeSettingsRequest request
    ) {
        manageGradeSettingsUseCase.updateSettings(
                grade,
                request.getDisplayName(),
                request.getEarnRate(),
                request.getUpgradeOrderCount(),
                request.getUpgradeOrderAmount()
        );
        return ResponseEntity.ok().build();
    }

    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SUB_ADMIN')")
    public ResponseEntity<GradeSystemConfigResponse> getConfig() {
        return ResponseEntity.ok(new GradeSystemConfigResponse(manageGradeSettingsUseCase.isGradeSystemEnabled()));
    }

    @PutMapping("/config")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> updateConfig(@RequestBody GradeSystemConfigRequest request) {
        manageGradeSettingsUseCase.updateGradeSystemConfig(request.isEnabled());
        return ResponseEntity.ok().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> createGrade(@RequestBody CreateGradeSettingsRequest request) {
        manageGradeSettingsUseCase.createGrade(
                request.getGrade(),
                request.getDisplayName(),
                request.getEarnRate(),
                request.getUpgradeOrderCount(),
                request.getUpgradeOrderAmount()
        );
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{grade}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteGrade(@PathVariable String grade) {
        manageGradeSettingsUseCase.deleteGrade(grade);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> reorderGrades(@RequestBody List<UpdateGradeOrderRequest> requests) {
        java.util.Map<String, Integer> orderMap = requests.stream()
                .collect(Collectors.toMap(UpdateGradeOrderRequest::getGrade, UpdateGradeOrderRequest::getSortOrder));
        manageGradeSettingsUseCase.updateGradeOrders(orderMap);
        return ResponseEntity.ok().build();
    }
}
