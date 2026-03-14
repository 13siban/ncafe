package com.new_cafe.app.backend.user.favorite.domain.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_favorite_menu_options")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFavoriteMenuOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "favorite_menu_id", nullable = false)
    private UserFavoriteMenu userFavoriteMenu;

    @Column(name = "option_group_id", nullable = false)
    private Long optionGroupId;

    @Column(name = "option_item_id", nullable = false)
    private Long optionItemId;
}
