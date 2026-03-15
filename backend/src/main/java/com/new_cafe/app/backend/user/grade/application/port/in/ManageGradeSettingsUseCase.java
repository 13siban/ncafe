package com.new_cafe.app.backend.user.grade.application.port.in;

import com.new_cafe.app.backend.user.grade.domain.model.GradeSettings;
import java.util.List;

public interface ManageGradeSettingsUseCase {
    List<GradeSettings> getAllSettings();
    GradeSettings getSettingsByGrade(String grade);
    void updateSettings(String grade, String displayName, Integer earnRate, Integer count, Integer amount, String mainColor, String textColor);
    
    boolean isGradeSystemEnabled();
    void updateGradeSystemConfig(boolean isEnabled);
    int getDefaultEarnRate();
    void updateDefaultEarnRate(int defaultEarnRate);
    
    void createGrade(String grade, String displayName, Integer earnRate, Integer count, Integer amount, String mainColor, String textColor);
    void deleteGrade(String grade);
    void updateGradeOrders(java.util.Map<String, Integer> gradeOrders);
}
