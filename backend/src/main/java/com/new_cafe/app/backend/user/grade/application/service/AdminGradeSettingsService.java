package com.new_cafe.app.backend.user.grade.application.service;

import com.new_cafe.app.backend.user.grade.application.port.in.ManageGradeSettingsUseCase;
import com.new_cafe.app.backend.user.grade.application.port.out.GradeSettingsRepositoryPort;
import com.new_cafe.app.backend.user.grade.domain.model.GradeSettings;
import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminGradeSettingsService implements ManageGradeSettingsUseCase {

    private final GradeSettingsRepositoryPort repositoryPort;
    private final UserJpaRepository userRepository; // TODO: LoadUserPort로 전환 필요
    private final UserGradeService userGradeService;

    @Override
    @Transactional(readOnly = true)
    public List<GradeSettings> getAllSettings() {
        return repositoryPort.findAllSorted();
    }

    @Override
    @Transactional(readOnly = true)
    public GradeSettings getSettingsByGrade(String grade) {
        GradeSettings settings = repositoryPort.findByGrade(grade);
        if (settings == null) {
            throw new IllegalArgumentException("등급 설정을 찾을 수 없습니다: " + grade);
        }
        return settings;
    }

    @Override
    @Transactional
    public void updateSettings(String grade, String displayName, Integer earnRate, Integer count, Integer amount, String mainColor, String textColor) {
        GradeSettings existing = repositoryPort.findByGrade(grade);
        if (existing == null) {
            throw new IllegalArgumentException("등급 설정을 찾을 수 없습니다: " + grade);
        }
        GradeSettings updated = GradeSettings.builder()
                .grade(grade)
                .displayName(displayName)
                .earnRate(earnRate)
                .upgradeOrderCount(count)
                .upgradeOrderAmount(amount)
                .sortOrder(existing.getSortOrder())
                .mainColor(mainColor)
                .textColor(textColor)
                .build();
        repositoryPort.save(updated);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isGradeSystemEnabled() {
        return repositoryPort.isGradeSystemEnabled();
    }
    
    @Override
    @Transactional
    public void updateGradeSystemConfig(boolean isEnabled) {
        repositoryPort.updateGradeSystemEnabled(isEnabled);
    }

    @Override
    @Transactional(readOnly = true)
    public int getDefaultEarnRate() {
        return repositoryPort.getDefaultEarnRate();
    }

    @Override
    @Transactional
    public void updateDefaultEarnRate(int defaultEarnRate) {
        repositoryPort.updateDefaultEarnRate(defaultEarnRate);
    }

    @Override
    @Transactional
    public void createGrade(String grade, String displayName, Integer earnRate, Integer count, Integer amount, String mainColor, String textColor) {
        if (repositoryPort.findByGrade(grade) != null) {
            throw new IllegalArgumentException("이미 존재하는 등급 코드입니다.");
        }
        
        List<GradeSettings> all = repositoryPort.findAllSorted();
        int maxOrder = all.stream().mapToInt(GradeSettings::getSortOrder).max().orElse(0);
        
        GradeSettings newGrade = GradeSettings.builder()
                .grade(grade.toUpperCase().replace(" ", "_"))
                .displayName(displayName)
                .earnRate(earnRate == null ? 1 : earnRate)
                .upgradeOrderCount(count)
                .upgradeOrderAmount(amount)
                .sortOrder(maxOrder + 1)
                .mainColor(mainColor != null ? mainColor : "#333333")
                .textColor(textColor != null ? textColor : "#FFFFFF")
                .build();
                
        repositoryPort.save(newGrade);
    }
    
    @Override
    @Transactional
    public void deleteGrade(String grade) {
        GradeSettings settings = repositoryPort.findByGrade(grade);
        if (settings == null) {
            throw new IllegalArgumentException("등급 설정을 찾을 수 없습니다.");
        }
        
        List<GradeSettings> all = repositoryPort.findAllSorted();
        if (!all.isEmpty() && all.get(0).getGrade().equals(grade)) {
            throw new IllegalArgumentException("최하위 기본 등급은 삭제할 수 없습니다.");
        }
        
        // 해당 등급의 회원을 기본 등급으로 임시 강등 후, 재계산
        List<User> affectedUsers = userRepository.findByGrade(grade);
        for (User user : affectedUsers) {
            user.updateGrade("GREEN_BEAN");
            userRepository.save(user);
        }
        
        repositoryPort.deleteByGrade(grade);
        
        for (User user : affectedUsers) {
            userGradeService.updateUserGrade(user.getId());
        }
    }
    
    @Override
    @Transactional
    public void updateGradeOrders(Map<String, Integer> gradeOrders) {
        repositoryPort.updateSortOrders(gradeOrders);
    }
}
