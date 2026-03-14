package com.new_cafe.app.backend.auth.application.port.in;

import com.new_cafe.app.backend.auth.domain.model.UserPoint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ManageUserPointUseCase {
    void earnPoints(String userId, String orderId, int amount, String description);
    void usePoints(String userId, String orderId, int amount, String description);
    void cancelPoints(String userId, String orderId, int amount, String description);
    int getPointBalance(String userId);
    Page<UserPoint> getPointHistory(String userId, Pageable pageable);
}
