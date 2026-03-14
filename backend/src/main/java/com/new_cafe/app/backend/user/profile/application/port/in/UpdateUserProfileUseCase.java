package com.new_cafe.app.backend.user.profile.application.port.in;

public interface UpdateUserProfileUseCase {
    void updateProfile(String id, String nickname, String email, String phoneNumber);
    void updatePassword(String id, String currentPassword, String newPassword);
}
