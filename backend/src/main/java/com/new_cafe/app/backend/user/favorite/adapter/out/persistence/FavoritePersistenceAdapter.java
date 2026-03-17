package com.new_cafe.app.backend.user.favorite.adapter.out.persistence;

import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.user.favorite.application.port.out.FavoriteRepositoryPort;
import com.new_cafe.app.backend.user.favorite.domain.model.UserFavoriteMenu;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class FavoritePersistenceAdapter implements FavoriteRepositoryPort {

    private final UserFavoriteMenuJpaRepository jpaRepository;

    @Override
    public UserFavoriteMenu save(UserFavoriteMenu favorite) {
        return jpaRepository.save(favorite);
    }

    @Override
    public Optional<UserFavoriteMenu> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public void delete(UserFavoriteMenu favorite) {
        jpaRepository.delete(favorite);
    }

    @Override
    public List<UserFavoriteMenu> findAllByUser(User user) {
        return jpaRepository.findAllByUserOrderByCreatedAtDesc(user);
    }
}
