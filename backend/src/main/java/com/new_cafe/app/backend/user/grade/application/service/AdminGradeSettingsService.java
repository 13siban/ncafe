package com.new_cafe.app.backend.user.grade.application.service;

import com.new_cafe.app.backend.user.grade.adapter.out.persistence.GradeSettingsJpaEntity;
import com.new_cafe.app.backend.user.grade.adapter.out.persistence.GradeSettingsJpaRepository;
import com.new_cafe.app.backend.user.grade.application.port.in.ManageGradeSettingsUseCase;
import com.new_cafe.app.backend.user.grade.domain.model.GradeSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.new_cafe.app.backend.user.grade.adapter.out.persistence.GradeSystemConfigJpaEntity;
import com.new_cafe.app.backend.user.grade.adapter.out.persistence.GradeSystemConfigJpaRepository;
import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.domain.model.User;

@Service
@RequiredArgsConstructor
public class AdminGradeSettingsService implements ManageGradeSettingsUseCase {

    private final GradeSettingsJpaRepository repository;
    private final GradeSystemConfigJpaRepository configRepository;
    private final UserJpaRepository userRepository;
    private final UserGradeService userGradeService;

    @Override
    @Transactional(readOnly = true)
    public List<GradeSettings> getAllSettings() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "sortOrder")).stream()
                .map(this::mapToDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GradeSettings getSettingsByGrade(String grade) {
        GradeSettingsJpaEntity entity = repository.findByGrade(grade);
        if (entity == null) {
            throw new IllegalArgumentException("등급 설정을 찾을 수 없습니다: " + grade);
        }
        return mapToDomain(entity);
    }

    @Override
    @Transactional
    public void updateSettings(String grade, String displayName, Integer earnRate, Integer count, Integer amount) {
        GradeSettingsJpaEntity entity = repository.findByGrade(grade);
        if (entity == null) {
            throw new IllegalArgumentException("등급 설정을 찾을 수 없습니다: " + grade);
        }
        entity.updateSettings(displayName, earnRate, count, amount);
        repository.save(entity);
    }
    
    @Override
    @Transactional(readOnly = true)
    public boolean isGradeSystemEnabled() {
        return configRepository.findById(1L)
                .map(GradeSystemConfigJpaEntity::isEnabled)
                .orElse(true);
    }
    
    @Override
    @Transactional
    public void updateGradeSystemConfig(boolean isEnabled) {
        GradeSystemConfigJpaEntity config = configRepository.findById(1L)
                .orElseGet(() -> GradeSystemConfigJpaEntity.builder().id(1L).build());
        config.setEnabled(isEnabled);
        configRepository.save(config);
    }

    @Override
    @Transactional
    public void createGrade(String grade, String displayName, Integer earnRate, Integer count, Integer amount) {
        if (repository.findByGrade(grade) != null) {
            throw new IllegalArgumentException("이미 존재하는 등급 코드입니다.");
        }
        
        List<GradeSettingsJpaEntity> all = repository.findAll();
        int maxOrder = all.stream().mapToInt(GradeSettingsJpaEntity::getSortOrder).max().orElse(0);
        
        GradeSettingsJpaEntity newGrade = GradeSettingsJpaEntity.builder()
                .grade(grade.toUpperCase().replace(" ", "_"))
                .displayName(displayName)
                .earnRate(earnRate == null ? 1 : earnRate)
                .upgradeOrderCount(count)
                .upgradeOrderAmount(amount)
                .sortOrder(maxOrder + 1)
                .build();
                
        repository.save(newGrade);
    }
    
    @Override
    @Transactional
    public void deleteGrade(String grade) {
        GradeSettingsJpaEntity entity = repository.findByGrade(grade);
        if (entity == null) {
            throw new IllegalArgumentException("등급 설정을 찾을 수 없습니다.");
        }
        
        List<GradeSettingsJpaEntity> all = repository.findAll(Sort.by(Sort.Direction.ASC, "sortOrder"));
        if (all.size() > 0 && all.get(0).getGrade().equals(grade)) {
            throw new IllegalArgumentException("최하위 기본 등급은 삭제할 수 없습니다.");
        }
        
        // 해당 등급의 회원을 기본 등급으로 임시 강등 후, 조건에 맞는 등급 재계산
        List<User> affectedUsers = userRepository.findByGrade(grade);
        for (User user : affectedUsers) {
            user.updateGrade("GREEN_BEAN"); // 가장 기본 등급으로 내림 (최하위 등급 코드가 GREEN_BEAN이 아니더라도 이후 바로 재설정됨)
            userRepository.save(user);
        }
        
        repository.delete(entity);
        
        for (User user : affectedUsers) {
            userGradeService.updateUserGrade(user.getId());
        }
    }
    
    @Override
    @Transactional
    public void updateGradeOrders(Map<String, Integer> gradeOrders) {
        List<GradeSettingsJpaEntity> entities = repository.findAll();
        for (GradeSettingsJpaEntity entity : entities) {
            if (gradeOrders.containsKey(entity.getGrade())) {
                entity.setSortOrder(gradeOrders.get(entity.getGrade()));
                repository.save(entity);
            }
        }
    }

    private GradeSettings mapToDomain(GradeSettingsJpaEntity entity) {
        return GradeSettings.builder()
                .grade(entity.getGrade())
                .displayName(entity.getDisplayName())
                .earnRate(entity.getEarnRate())
                .upgradeOrderCount(entity.getUpgradeOrderCount())
                .upgradeOrderAmount(entity.getUpgradeOrderAmount())
                .sortOrder(entity.getSortOrder())
                .build();
    }
}
