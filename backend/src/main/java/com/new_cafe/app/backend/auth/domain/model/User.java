package com.new_cafe.app.backend.auth.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User implements UserDetails {
    @Id
    private String id;

    @Column(name = "username")
    private String username;

    @Column(name = "nickname")
    private String nickname;

    private String email;
    private String phoneNumber;

    @com.fasterxml.jackson.annotation.JsonIgnore
    private String password;
    private String role;

    public void updateRole(String role) {
        this.role = role;
    }

    public void updateProfile(String nickname, String email, String phoneNumber) {
        this.nickname = nickname;
        this.email = email;
        this.phoneNumber = phoneNumber;
    }

    public void updatePassword(String password) {
        this.password = password;
    }

    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = java.time.LocalDateTime.now();
        this.updatedAt = java.time.LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = java.time.LocalDateTime.now();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role));
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
