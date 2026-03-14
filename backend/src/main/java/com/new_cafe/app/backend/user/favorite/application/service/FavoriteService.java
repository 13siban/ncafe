package com.new_cafe.app.backend.user.favorite.application.service;

import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.menu.adapter.out.persistence.MenuImageJpaEntity;
import com.new_cafe.app.backend.menu.adapter.out.persistence.MenuImageJpaRepository;
import com.new_cafe.app.backend.menu.adapter.out.persistence.MenuJpaEntity;
import com.new_cafe.app.backend.menu.adapter.out.persistence.MenuJpaRepository;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionGroupJpaEntity;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionGroupJpaRepository;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionItemJpaEntity;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionItemJpaRepository;
import com.new_cafe.app.backend.user.favorite.adapter.in.web.dto.AddFavoriteRequest;
import com.new_cafe.app.backend.user.favorite.adapter.in.web.dto.FavoriteMenuResponse;
import com.new_cafe.app.backend.user.favorite.adapter.out.persistence.UserFavoriteMenuJpaRepository;
import com.new_cafe.app.backend.user.favorite.application.port.in.ManageFavoriteUseCase;
import com.new_cafe.app.backend.user.favorite.domain.model.UserFavoriteMenu;
import com.new_cafe.app.backend.user.favorite.domain.model.UserFavoriteMenuOption;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FavoriteService implements ManageFavoriteUseCase {

    private final UserFavoriteMenuJpaRepository favoriteMenuRepository;
    private final UserJpaRepository userRepository;
    private final MenuJpaRepository menuRepository;
    private final MenuImageJpaRepository menuImageRepository;
    private final OptionGroupJpaRepository optionGroupRepository;
    private final OptionItemJpaRepository optionItemRepository;

    @Override
    public Long addFavorite(String userId, AddFavoriteRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        if (!menuRepository.existsById(request.getMenuId())) {
            throw new RuntimeException("Menu not found");
        }

        UserFavoriteMenu favoriteMenu = UserFavoriteMenu.builder()
                .user(user)
                .menuId(request.getMenuId())
                .alias(request.getAlias())
                .build();

        if (request.getSelectedOptions() != null && !request.getSelectedOptions().isEmpty()) {
            for (AddFavoriteRequest.SelectedOption opt : request.getSelectedOptions()) {
                if (!optionGroupRepository.existsById(opt.getOptionGroupId())) {
                    throw new RuntimeException("OptionGroup not found");
                }
                if (!optionItemRepository.existsById(opt.getOptionItemId())) {
                    throw new RuntimeException("OptionItem not found");
                }
                        
                UserFavoriteMenuOption favoriteOption = UserFavoriteMenuOption.builder()
                        .optionGroupId(opt.getOptionGroupId())
                        .optionItemId(opt.getOptionItemId())
                        .build();
                        
                favoriteMenu.addOption(favoriteOption);
            }
        }

        return favoriteMenuRepository.save(favoriteMenu).getId();
    }

    @Override
    public void removeFavorite(String userId, Long favoriteId) {
        UserFavoriteMenu favoriteMenu = favoriteMenuRepository.findById(favoriteId)
                .orElseThrow(() -> new RuntimeException("Favorite not found"));
                
        if (!favoriteMenu.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to remove this favorite");
        }
        
        favoriteMenuRepository.delete(favoriteMenu);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FavoriteMenuResponse> getFavorites(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        List<UserFavoriteMenu> favorites = favoriteMenuRepository.findAllByUserOrderByCreatedAtDesc(user);
        
        return favorites.stream().map(fav -> {
            boolean isOrderable = true;
            String unavailableReasonStr = null;
            
            MenuJpaEntity menu = menuRepository.findById(fav.getMenuId()).orElse(null);
            
            if (menu == null) {
                isOrderable = false;
                unavailableReasonStr = "MENU_DELETED";
            } else if (!Boolean.TRUE.equals(menu.getIsAvailable())) {
                isOrderable = false;
                unavailableReasonStr = "MENU_HIDDEN";
            } else if (Boolean.TRUE.equals(menu.getIsSoldOut())) {
                isOrderable = false;
                unavailableReasonStr = "MENU_SOLD_OUT";
            }

            long basePrice = menu != null && menu.getPrice() != null ? menu.getPrice() : 0L;
            long calculatedTotal = basePrice;
            
            List<FavoriteMenuResponse.FavoriteMenuOptionDto> optionsDtoList = fav.getOptions().stream().map(opt -> {
                OptionGroupJpaEntity group = optionGroupRepository.findById(opt.getOptionGroupId()).orElse(null);
                OptionItemJpaEntity item = optionItemRepository.findById(opt.getOptionItemId()).orElse(null);
                
                return FavoriteMenuResponse.FavoriteMenuOptionDto.builder()
                        .optionGroupId(group != null ? group.getId() : opt.getOptionGroupId())
                        .optionGroupName(group != null ? group.getName() : "Unknown Group")
                        .optionItemId(item != null ? item.getId() : opt.getOptionItemId())
                        .optionItemName(item != null ? item.getName() : "Unknown Item")
                        // Assume standardPrice is 0 or base price
                        .standardPrice(0L)
                        .additionalPrice(item != null && item.getPriceDelta() != null ? Long.valueOf(item.getPriceDelta()) : 0L)
                        .build();
            }).collect(Collectors.toList());

            if (isOrderable) {
                for (FavoriteMenuResponse.FavoriteMenuOptionDto dto : optionsDtoList) {
                    if ("Unknown Group".equals(dto.getOptionGroupName())) {
                        isOrderable = false;
                        unavailableReasonStr = "OPTION_GROUP_DELETED";
                        break;
                    }
                    if ("Unknown Item".equals(dto.getOptionItemName())) {
                        isOrderable = false;
                        unavailableReasonStr = "OPTION_ITEM_DELETED";
                        break;
                    }
                    calculatedTotal += dto.getAdditionalPrice() != null ? dto.getAdditionalPrice() : 0L;
                }
            }
            
            String imageSrcUrl = "";
            if (menu != null) {
                List<MenuImageJpaEntity> images = menuImageRepository.findAllByMenuIdOrderBySortOrderAsc(menu.getId());
                if (images != null && !images.isEmpty()) {
                    imageSrcUrl = images.get(0).getSrcUrl();
                }
            }

            return FavoriteMenuResponse.builder()
                    .id(fav.getId())
                    .menuId(fav.getMenuId())
                    .menuName(menu != null ? menu.getKorName() : "Unknown Menu")
                    .alias(fav.getAlias())
                    .imageUrl(imageSrcUrl)
                    .basePrice(basePrice)
                    .totalPrice(calculatedTotal)
                    .options(optionsDtoList)
                    .orderable(isOrderable)
                    .unavailableReason(unavailableReasonStr)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavorite(String userId, Long menuId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<UserFavoriteMenu> favorites = favoriteMenuRepository.findAllByUserOrderByCreatedAtDesc(user);
        return favorites.stream().anyMatch(f -> menuId.equals(f.getMenuId()));
    }
}
