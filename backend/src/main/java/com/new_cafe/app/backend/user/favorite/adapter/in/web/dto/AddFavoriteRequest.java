package com.new_cafe.app.backend.user.favorite.adapter.in.web.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class AddFavoriteRequest {
    private Long menuId;
    private String alias;
    private List<SelectedOption> selectedOptions;

    @Getter
    @Setter
    public static class SelectedOption {
        private Long optionGroupId;
        private Long optionItemId;
    }
}
