package com.new_cafe.app.backend.user.grade.application.port.in;

import com.new_cafe.app.backend.user.grade.domain.model.GradeSettings;
import java.util.List;

public interface ManageGradeSettingsUseCase {
    List<GradeSettings> getAllSettings();
    GradeSettings getSettingsByGrade(String grade);
    void updateSettings(String grade, String displayName, Integer earnRate, Integer count, Integer amount);
    
    boolean isGradeSystemEnabled();
    void updateGradeSystemConfig(boolean isEnabled);
    
    void createGrade(String grade, String displayName, Integer earnRate, Integer count, Integer amount);
    void deleteGrade(String grade);
    void updateGradeOrders(java.util.Map<String, Integer> gradeOrders);
}
