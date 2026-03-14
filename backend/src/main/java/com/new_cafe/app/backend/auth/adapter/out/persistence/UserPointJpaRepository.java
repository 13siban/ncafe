package com.new_cafe.app.backend.auth.adapter.out.persistence;

import com.new_cafe.app.backend.auth.domain.model.UserPoint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface UserPointJpaRepository extends JpaRepository<UserPoint, Long> {
    Page<UserPoint> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    
    // 만료 예정 포인트 조회 (에: EXPIRE 타입이 아니고 EARN인데 만료일이 지난 것)를 위한 메서드 등도 나중에 추가 가능
}
