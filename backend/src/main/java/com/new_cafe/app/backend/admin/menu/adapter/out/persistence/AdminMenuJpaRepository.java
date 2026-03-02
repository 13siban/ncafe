package com.new_cafe.app.backend.admin.menu.adapter.out.persistence;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminMenuJpaRepository extends JpaRepository<AdminMenuJpaEntity, Long>, JpaSpecificationExecutor<AdminMenuJpaEntity> {
}
