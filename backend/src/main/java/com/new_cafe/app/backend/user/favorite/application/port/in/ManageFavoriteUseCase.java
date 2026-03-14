package com.new_cafe.app.backend.user.favorite.application.port.in;

import com.new_cafe.app.backend.user.favorite.adapter.in.web.dto.AddFavoriteRequest;
import com.new_cafe.app.backend.user.favorite.adapter.in.web.dto.FavoriteMenuResponse;
import java.util.List;

public interface ManageFavoriteUseCase {
    Long addFavorite(String userId, AddFavoriteRequest request);
    void removeFavorite(String userId, Long favoriteId);
    List<FavoriteMenuResponse> getFavorites(String userId);
    boolean isFavorite(String userId, Long menuId);
}
