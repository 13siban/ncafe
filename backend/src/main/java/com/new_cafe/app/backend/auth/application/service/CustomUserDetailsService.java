package com.new_cafe.app.backend.auth.application.service;

import com.new_cafe.app.backend.auth.application.port.out.LoadUserPort;
import com.new_cafe.app.backend.auth.domain.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final LoadUserPort loadUserPort;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Here, 'username' is actually the nickname we stored
        return loadUserPort.loadUser(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with nickname: " + username));
    }
}
