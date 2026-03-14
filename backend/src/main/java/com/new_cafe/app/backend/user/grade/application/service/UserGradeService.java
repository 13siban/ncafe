package com.new_cafe.app.backend.user.grade.application.service;

import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.user.grade.adapter.in.web.dto.UserGradeResponse;
import com.new_cafe.app.backend.user.grade.adapter.out.persistence.GradeSettingsJpaEntity;
import com.new_cafe.app.backend.user.grade.adapter.out.persistence.GradeSettingsJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserGradeService {

    private final com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository userRepository;

    private final GradeSettingsJpaRepository gradeSettingsRepository;
    private final com.new_cafe.app.backend.user.grade.adapter.out.persistence.GradeSystemConfigJpaRepository gradeSystemConfigRepository;

    private boolean isGradeSystemEnabled() {
        return gradeSystemConfigRepository.findById(1L)
                .map(com.new_cafe.app.backend.user.grade.adapter.out.persistence.GradeSystemConfigJpaEntity::isEnabled)
                .orElse(true);
    }

    @Transactional
    public void updateUserGrade(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (!isGradeSystemEnabled()) {
            return;
        }

        List<GradeSettingsJpaEntity> settings = gradeSettingsRepository.findAll(Sort.by(Sort.Direction.DESC, "sortOrder"));

        String newGrade = "GREEN_BEAN";

        for (GradeSettingsJpaEntity setting : settings) {
            boolean meetCount = setting.getUpgradeOrderCount() != null && user.getTotalOrderCount() >= setting.getUpgradeOrderCount();
            boolean meetAmount = setting.getUpgradeOrderAmount() != null && user.getTotalOrderAmount() >= setting.getUpgradeOrderAmount();

            if (meetCount || meetAmount) {
                newGrade = setting.getGrade();
                break;
            }
        }

        if (!user.getGrade().equals(newGrade)) {
            user.updateGrade(newGrade);
        }
    }

    @Transactional
    public void addOrderStatsAndCheckGrade(String userId, int amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        user.addOrderStats(amount);
        updateUserGrade(userId);
    }

    @Transactional(readOnly = true)
    public UserGradeResponse getUserGradeInfo(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<GradeSettingsJpaEntity> settingsList = gradeSettingsRepository.findAll(Sort.by(Sort.Direction.ASC, "sortOrder"));
        
        GradeSettingsJpaEntity currentSetting = null;
        GradeSettingsJpaEntity nextSetting = null;

        for (int i = 0; i < settingsList.size(); i++) {
            if (settingsList.get(i).getGrade().equals(user.getGrade())) {
                currentSetting = settingsList.get(i);
                if (i + 1 < settingsList.size()) {
                    nextSetting = settingsList.get(i + 1);
                }
                break;
            }
        }

        if (currentSetting == null) {
            currentSetting = settingsList.get(0); // fallback to minimum
        }

        boolean enabled = isGradeSystemEnabled();
        int defaultEarnRate = gradeSystemConfigRepository.findById(1L)
                .map(com.new_cafe.app.backend.user.grade.adapter.out.persistence.GradeSystemConfigJpaEntity::getDefaultEarnRate)
                .orElse(1);

        return UserGradeResponse.builder()
                .currentGrade(enabled ? currentSetting.getGrade() : "NONE")
                .currentGradeName(enabled ? currentSetting.getDisplayName() : "일반 회원")
                .earnRate(enabled ? currentSetting.getEarnRate() : defaultEarnRate)
                .gradeSystemEnabled(enabled)
                .currentOrderCount(user.getTotalOrderCount() != null ? user.getTotalOrderCount() : 0)
                .currentOrderAmount(user.getTotalOrderAmount() != null ? user.getTotalOrderAmount() : 0)
                .nextGrade(enabled && nextSetting != null ? nextSetting.getGrade() : null)
                .nextGradeName(enabled && nextSetting != null ? nextSetting.getDisplayName() : null)
                .nextGradeRequireCount(enabled && nextSetting != null ? nextSetting.getUpgradeOrderCount() : null)
                .nextGradeRequireAmount(enabled && nextSetting != null ? nextSetting.getUpgradeOrderAmount() : null)
                .build();
    }
}
