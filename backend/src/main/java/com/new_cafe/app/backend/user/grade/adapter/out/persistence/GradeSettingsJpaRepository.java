package com.new_cafe.app.backend.user.grade.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GradeSettingsJpaRepository extends JpaRepository<GradeSettingsJpaEntity, Long> {
    GradeSettingsJpaEntity findByGrade(String grade);
}
