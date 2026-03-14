package com.new_cafe.app.backend.user.favorite.adapter.in.web;

import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.user.favorite.adapter.in.web.dto.AddFavoriteRequest;
import com.new_cafe.app.backend.user.favorite.adapter.in.web.dto.FavoriteMenuResponse;
import com.new_cafe.app.backend.user.favorite.application.port.in.ManageFavoriteUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users/me/favorites")
@RequiredArgsConstructor
public class UserFavoriteController {

    private final ManageFavoriteUseCase manageFavoriteUseCase;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> addFavorite(@AuthenticationPrincipal User user,
                                           @RequestBody AddFavoriteRequest request) {
        Long favoriteId = manageFavoriteUseCase.addFavorite(user.getId(), request);
        return Map.of("message", "즐겨찾기에 추가되었습니다.", "favoriteId", favoriteId);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Map<String, String> removeFavorite(@AuthenticationPrincipal User user,
                                              @PathVariable("id") Long favoriteId) {
        manageFavoriteUseCase.removeFavorite(user.getId(), favoriteId);
        return Map.of("message", "즐겨찾기가 삭제되었습니다.");
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<FavoriteMenuResponse> getFavorites(@AuthenticationPrincipal User user) {
        return manageFavoriteUseCase.getFavorites(user.getId());
    }

    @GetMapping("/check")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Boolean> isFavorite(@AuthenticationPrincipal User user,
                                           @RequestParam("menuId") Long menuId) {
        boolean isFav = manageFavoriteUseCase.isFavorite(user.getId(), menuId);
        return Map.of("isFavorite", isFav);
    }
}
