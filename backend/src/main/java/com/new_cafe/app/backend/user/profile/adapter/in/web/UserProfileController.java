package com.new_cafe.app.backend.user.profile.adapter.in.web;

import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.user.profile.adapter.in.web.dto.UpdatePasswordRequest;
import com.new_cafe.app.backend.user.profile.adapter.in.web.dto.UpdateProfileRequest;
import com.new_cafe.app.backend.user.profile.application.port.in.GetUserProfileUseCase;
import com.new_cafe.app.backend.user.profile.application.port.in.UpdateUserProfileUseCase;
import com.new_cafe.app.backend.order.application.port.in.GetOrderUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class UserProfileController {

    private final GetUserProfileUseCase getUserProfileUseCase;
    private final UpdateUserProfileUseCase updateUserProfileUseCase;
    private final GetOrderUseCase getOrderUseCase;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public User getProfile(@AuthenticationPrincipal User userDetails) {
        return getUserProfileUseCase.getProfile(userDetails.getId());
    }

    @PutMapping
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> updateProfile(@AuthenticationPrincipal User userDetails,
                                             @RequestBody UpdateProfileRequest request) {
        updateUserProfileUseCase.updateProfile(userDetails.getId(), request.getNickname(), request.getEmail(), request.getPhoneNumber());
        return Map.of("message", "프로필이 성공적으로 수정되었습니다.");
    }

    @PutMapping("/password")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> updatePassword(@AuthenticationPrincipal User userDetails,
                                              @RequestBody UpdatePasswordRequest request) {
        updateUserProfileUseCase.updatePassword(userDetails.getId(), request.getCurrentPassword(), request.getNewPassword());
        return Map.of("message", "비밀번호가 성공적으로 변경되었습니다.");
    }

    @GetMapping("/orders")
    @PreAuthorize("isAuthenticated()")
    public List<GetOrderUseCase.OrderListDto> getMyOrders(@AuthenticationPrincipal User userDetails) {
        return getOrderUseCase.getMyOrders(userDetails.getId());
    }

    @GetMapping("/top-menus")
    @PreAuthorize("isAuthenticated()")
    public List<GetOrderUseCase.TopMenuDto> getTopMenus(@AuthenticationPrincipal User userDetails) {
        return getOrderUseCase.getTopMenus(userDetails.getId(), 5);
    }
}
