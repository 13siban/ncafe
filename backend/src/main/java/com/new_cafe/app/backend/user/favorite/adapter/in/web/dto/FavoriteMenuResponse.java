package com.new_cafe.app.backend.user.favorite.adapter.in.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class FavoriteMenuResponse {
    private Long id;
    private Long menuId;
    private String menuName;
    private String alias;
    private String imageUrl;
    private Long basePrice;
    private Long totalPrice;
    private List<FavoriteMenuOptionDto> options;

    private boolean orderable;
    private String unavailableReason;

    @Getter
    @Setter
    @Builder
    @AllArgsConstructor
    public static class FavoriteMenuOptionDto {
        private Long optionGroupId;
        private String optionGroupName;
        private Long optionItemId;
        private String optionItemName;
        private Long standardPrice;
        private Long additionalPrice;
    }
}
