package com.new_cafe.app.backend.user.grade.application.port.out;

import com.new_cafe.app.backend.user.grade.domain.model.GradeSettings;

import java.util.List;
import java.util.Map;

public interface GradeSettingsRepositoryPort {
    List<GradeSettings> findAllSorted();
    GradeSettings findByGrade(String grade);
    GradeSettings save(GradeSettings settings);
    void deleteByGrade(String grade);
    void updateSortOrders(Map<String, Integer> gradeOrders);
    boolean isGradeSystemEnabled();
    void updateGradeSystemEnabled(boolean enabled);
    int getDefaultEarnRate();
    void updateDefaultEarnRate(int defaultEarnRate);
}
