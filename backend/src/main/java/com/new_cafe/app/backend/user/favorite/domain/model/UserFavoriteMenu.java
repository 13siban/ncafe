package com.new_cafe.app.backend.user.favorite.domain.model;

import com.new_cafe.app.backend.auth.domain.model.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_favorite_menus")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFavoriteMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "menu_id", nullable = false)
    private Long menuId;

    @Column(name = "alias")
    private String alias;

    @OneToMany(mappedBy = "userFavoriteMenu", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<UserFavoriteMenuOption> options = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public void addOption(UserFavoriteMenuOption option) {
        options.add(option);
        option.setUserFavoriteMenu(this);
    }
}
