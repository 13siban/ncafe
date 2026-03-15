package com.new_cafe.app.backend.notice.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NoticePopupJpaRepository extends JpaRepository<NoticePopupJpaEntity, Long> {
    
    List<NoticePopupJpaEntity> findByIsActiveTrue();
}
