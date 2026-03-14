package com.new_cafe.app.backend.auth.application.service;

import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.adapter.out.persistence.UserPointJpaRepository;
import com.new_cafe.app.backend.auth.application.port.in.ManageUserPointUseCase;
import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.auth.domain.model.UserPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserPointService implements ManageUserPointUseCase {

    private final UserPointJpaRepository userPointRepository;
    private final UserJpaRepository userRepository;

    @Override
    @Transactional
    public void earnPoints(String userId, String orderId, int amount, String description) {
        if (amount <= 0) return;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int newBalance = user.getPointBalance() + amount;
        user.addPoints(amount); // Need to add this method in User entity
        userRepository.save(user);

        UserPoint point = UserPoint.builder()
                .userId(userId)
                .orderId(orderId)
                .pointAmount(amount)
                .type("EARN")
                .balanceSnapshot(newBalance)
                .description(description)
                .expiresAt(LocalDateTime.now().plusYears(1)) // 1년 뒤 만료
                .build();
        userPointRepository.save(point);
    }

    @Override
    @Transactional
    public void usePoints(String userId, String orderId, int amount, String description) {
        if (amount <= 0) return;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPointBalance() < amount) {
            throw new RuntimeException("잔여 포인트가 부족합니다.");
        }

        int newBalance = user.getPointBalance() - amount;
        user.subtractPoints(amount); // Need to add this method in User entity
        userRepository.save(user);

        UserPoint point = UserPoint.builder()
                .userId(userId)
                .orderId(orderId)
                .pointAmount(-amount)
                .type("USE")
                .balanceSnapshot(newBalance)
                .description(description)
                .build();
        userPointRepository.save(point);
    }

    @Override
    @Transactional
    public void cancelPoints(String userId, String orderId, int amount, String description) {
        // 주문 취소 등으로 인한 포인트 환급 (사용했던 포인트 돌려줌)
        if (amount <= 0) return;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        int newBalance = user.getPointBalance() + amount;
        user.addPoints(amount);
        userRepository.save(user);

        UserPoint point = UserPoint.builder()
                .userId(userId)
                .orderId(orderId)
                .pointAmount(amount)
                .type("CANCEL")
                .balanceSnapshot(newBalance)
                .description(description)
                // CANCEL 된 포인트의 만료일은 적당히 다시 주거나, 기존 만료일을 따라야 하나 여기서는 단순화하여 1년 줌
                .expiresAt(LocalDateTime.now().plusYears(1))
                .build();
        userPointRepository.save(point);
    }

    @Override
    @Transactional(readOnly = true)
    public int getPointBalance(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getPointBalance() == null ? 0 : user.getPointBalance();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserPoint> getPointHistory(String userId, Pageable pageable) {
        return userPointRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }
}
