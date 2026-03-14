package com.new_cafe.app.backend.user.favorite.adapter.out.persistence;

import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.user.favorite.domain.model.UserFavoriteMenu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFavoriteMenuJpaRepository extends JpaRepository<UserFavoriteMenu, Long> {
    List<UserFavoriteMenu> findAllByUserOrderByCreatedAtDesc(User user);
}
