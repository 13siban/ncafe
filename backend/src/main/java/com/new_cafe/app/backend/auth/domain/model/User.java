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

    @Column(name = "grade")
    private String grade;

    @Column(name = "total_order_count")
    private Integer totalOrderCount;

    @Column(name = "total_order_amount")
    private Integer totalOrderAmount;

    @Column(name = "point_balance")
    private Integer pointBalance;

    public Integer getPointBalance() {
        return pointBalance == null ? 0 : pointBalance;
    }

    @Column(name = "is_enabled")
    private Boolean isEnabled;

    @Column(name = "deleted_at")
    private java.time.LocalDateTime deletedAt;

    public void updateRole(String role) {
        this.role = role;
    }

    public void updateGrade(String grade) {
        this.grade = grade;
    }

    public void addOrderStats(int amount) {
        if (this.totalOrderCount == null) this.totalOrderCount = 0;
        if (this.totalOrderAmount == null) this.totalOrderAmount = 0;
        this.totalOrderCount++;
        this.totalOrderAmount += amount;
    }

    public void addPoints(int amount) {
        if (this.pointBalance == null) this.pointBalance = 0;
        this.pointBalance += amount;
    }

    public void subtractPoints(int amount) {
        if (this.pointBalance == null) this.pointBalance = 0;
        this.pointBalance -= amount;
    }

    public void updateProfile(String nickname, String email, String phoneNumber) {
        this.nickname = nickname;
        this.email = email;
        this.phoneNumber = phoneNumber;
    }

    public void updatePassword(String password) {
        this.password = password;
    }

    public void requestDeletion() {
        this.deletedAt = java.time.LocalDateTime.now();
    }

    public void restoreAccount() {
        this.deletedAt = null;
    }

    public void lock() {
        this.isEnabled = false;
    }

    public void unlock() {
        this.isEnabled = true;
    }

    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = java.time.LocalDateTime.now();
        this.updatedAt = java.time.LocalDateTime.now();
        if (this.grade == null) this.grade = "GREEN_BEAN";
        if (this.totalOrderCount == null) this.totalOrderCount = 0;
        if (this.totalOrderAmount == null) this.totalOrderAmount = 0;
        if (this.pointBalance == null) this.pointBalance = 0;
        if (this.isEnabled == null) this.isEnabled = true;
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
        return this.isEnabled != null ? this.isEnabled : true;
    }
}
