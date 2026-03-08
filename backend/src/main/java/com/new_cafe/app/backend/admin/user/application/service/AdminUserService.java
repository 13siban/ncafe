package com.new_cafe.app.backend.admin.user.application.service;

import com.new_cafe.app.backend.admin.user.application.port.in.DeleteAdminUserUseCase;
import com.new_cafe.app.backend.admin.user.application.port.in.GetAdminUserListUseCase;
import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserService implements GetAdminUserListUseCase, DeleteAdminUserUseCase {

    private final UserJpaRepository userJpaRepository;

    @Override
    @Transactional(readOnly = true)
    public List<User> getUsers() {
        return userJpaRepository.findAll();
    }

    @Override
    public void deleteUser(String id) {
        userJpaRepository.deleteById(id);
    }
}
