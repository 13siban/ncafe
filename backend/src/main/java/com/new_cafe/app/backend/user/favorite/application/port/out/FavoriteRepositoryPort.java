package com.new_cafe.app.backend.user.favorite.application.port.out;

import com.new_cafe.app.backend.user.favorite.domain.model.UserFavoriteMenu;
import com.new_cafe.app.backend.auth.domain.model.User;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepositoryPort {
    UserFavoriteMenu save(UserFavoriteMenu favorite);
    Optional<UserFavoriteMenu> findById(Long id);
    void delete(UserFavoriteMenu favorite);
    List<UserFavoriteMenu> findAllByUser(User user);
}
