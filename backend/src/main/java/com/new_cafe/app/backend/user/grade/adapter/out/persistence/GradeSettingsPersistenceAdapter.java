package com.new_cafe.app.backend.user.grade.adapter.out.persistence;

import com.new_cafe.app.backend.user.grade.application.port.out.GradeSettingsRepositoryPort;
import com.new_cafe.app.backend.user.grade.domain.model.GradeSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class GradeSettingsPersistenceAdapter implements GradeSettingsRepositoryPort {

    private final GradeSettingsJpaRepository repository;
    private final GradeSystemConfigJpaRepository configRepository;

    @Override
    public List<GradeSettings> findAllSorted() {
        return repository.findAll(Sort.by(Sort.Direction.ASC, "sortOrder")).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public GradeSettings findByGrade(String grade) {
        GradeSettingsJpaEntity entity = repository.findByGrade(grade);
        if (entity == null) return null;
        return toDomain(entity);
    }

    @Override
    public GradeSettings save(GradeSettings settings) {
        GradeSettingsJpaEntity entity = repository.findByGrade(settings.getGrade());
        if (entity != null) {
            entity.updateSettings(
                    settings.getDisplayName(), settings.getEarnRate(),
                    settings.getUpgradeOrderCount(), settings.getUpgradeOrderAmount(),
                    settings.getMainColor(), settings.getTextColor());
        } else {
            entity = GradeSettingsJpaEntity.builder()
                    .grade(settings.getGrade().toUpperCase().replace(" ", "_"))
                    .displayName(settings.getDisplayName())
                    .earnRate(settings.getEarnRate() == null ? 1 : settings.getEarnRate())
                    .upgradeOrderCount(settings.getUpgradeOrderCount())
                    .upgradeOrderAmount(settings.getUpgradeOrderAmount())
                    .sortOrder(settings.getSortOrder())
                    .mainColor(settings.getMainColor() != null ? settings.getMainColor() : "#333333")
                    .textColor(settings.getTextColor() != null ? settings.getTextColor() : "#FFFFFF")
                    .build();
        }
        GradeSettingsJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteByGrade(String grade) {
        GradeSettingsJpaEntity entity = repository.findByGrade(grade);
        if (entity != null) {
            repository.delete(entity);
        }
    }

    @Override
    public void updateSortOrders(Map<String, Integer> gradeOrders) {
        List<GradeSettingsJpaEntity> entities = repository.findAll();
        for (GradeSettingsJpaEntity entity : entities) {
            if (gradeOrders.containsKey(entity.getGrade())) {
                entity.setSortOrder(gradeOrders.get(entity.getGrade()));
                repository.save(entity);
            }
        }
    }

    @Override
    public boolean isGradeSystemEnabled() {
        return configRepository.findById(1L)
                .map(GradeSystemConfigJpaEntity::isEnabled)
                .orElse(true);
    }

    @Override
    public void updateGradeSystemEnabled(boolean enabled) {
        GradeSystemConfigJpaEntity config = configRepository.findById(1L)
                .orElseGet(() -> GradeSystemConfigJpaEntity.builder().id(1L).build());
        config.setEnabled(enabled);
        configRepository.save(config);
    }

    @Override
    public int getDefaultEarnRate() {
        return configRepository.findById(1L)
                .map(GradeSystemConfigJpaEntity::getDefaultEarnRate)
                .orElse(1);
    }

    @Override
    public void updateDefaultEarnRate(int defaultEarnRate) {
        GradeSystemConfigJpaEntity config = configRepository.findById(1L)
                .orElseGet(() -> GradeSystemConfigJpaEntity.builder().id(1L).build());
        config.setDefaultEarnRate(defaultEarnRate);
        configRepository.save(config);
    }

    private GradeSettings toDomain(GradeSettingsJpaEntity entity) {
        return GradeSettings.builder()
                .grade(entity.getGrade())
                .displayName(entity.getDisplayName())
                .earnRate(entity.getEarnRate())
                .upgradeOrderCount(entity.getUpgradeOrderCount())
                .upgradeOrderAmount(entity.getUpgradeOrderAmount())
                .sortOrder(entity.getSortOrder())
                .mainColor(entity.getMainColor())
                .textColor(entity.getTextColor())
                .build();
    }
}
