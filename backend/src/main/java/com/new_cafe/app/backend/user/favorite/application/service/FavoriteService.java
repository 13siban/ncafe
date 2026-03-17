package com.new_cafe.app.backend.user.favorite.application.service;

import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.domain.model.User;
import com.new_cafe.app.backend.menu.application.port.out.MenuImageRepositoryPort;
import com.new_cafe.app.backend.menu.application.port.out.MenuRepositoryPort;
import com.new_cafe.app.backend.menu.domain.model.Menu;
import com.new_cafe.app.backend.menu.domain.model.MenuImage;
import com.new_cafe.app.backend.menuoption.application.port.out.MenuOptionRepositoryPort;
import com.new_cafe.app.backend.menuoption.domain.model.OptionGroup;
import com.new_cafe.app.backend.menuoption.domain.model.OptionItem;
import com.new_cafe.app.backend.user.favorite.adapter.in.web.dto.AddFavoriteRequest;
import com.new_cafe.app.backend.user.favorite.adapter.in.web.dto.FavoriteMenuResponse;
import com.new_cafe.app.backend.user.favorite.application.port.in.ManageFavoriteUseCase;
import com.new_cafe.app.backend.user.favorite.application.port.out.FavoriteRepositoryPort;
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

    private final FavoriteRepositoryPort favoriteRepositoryPort;
    private final UserJpaRepository userRepository;
    private final MenuRepositoryPort menuRepository;
    private final MenuImageRepositoryPort menuImageRepositoryPort;
    private final MenuOptionRepositoryPort menuOptionRepository;

    @Override
    public Long addFavorite(String userId, AddFavoriteRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        Menu menu = menuRepository.findById(request.getMenuId());
        if (menu == null) {
            throw new RuntimeException("Menu not found");
        }

        UserFavoriteMenu favoriteMenu = UserFavoriteMenu.builder()
                .user(user)
                .menuId(request.getMenuId())
                .alias(request.getAlias())
                .build();

        if (request.getSelectedOptions() != null && !request.getSelectedOptions().isEmpty()) {
            for (AddFavoriteRequest.SelectedOption opt : request.getSelectedOptions()) {
                OptionGroup group = menuOptionRepository.findOptionGroupById(opt.getOptionGroupId());
                if (group == null) {
                    throw new RuntimeException("OptionGroup not found");
                }
                // Validate option item exists within the group's items
                boolean itemFound = group.getItems() != null && group.getItems().stream()
                        .anyMatch(item -> item.getId().equals(opt.getOptionItemId()));
                if (!itemFound) {
                    throw new RuntimeException("OptionItem not found");
                }
                        
                UserFavoriteMenuOption favoriteOption = UserFavoriteMenuOption.builder()
                        .optionGroupId(opt.getOptionGroupId())
                        .optionItemId(opt.getOptionItemId())
                        .build();
                        
                favoriteMenu.addOption(favoriteOption);
            }
        }

        return favoriteRepositoryPort.save(favoriteMenu).getId();
    }

    @Override
    public void removeFavorite(String userId, Long favoriteId) {
        UserFavoriteMenu favoriteMenu = favoriteRepositoryPort.findById(favoriteId)
                .orElseThrow(() -> new RuntimeException("Favorite not found"));
                
        if (!favoriteMenu.getUser().getId().equals(userId)) {
            throw new RuntimeException("Not authorized to remove this favorite");
        }
        
        favoriteRepositoryPort.delete(favoriteMenu);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FavoriteMenuResponse> getFavorites(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        List<UserFavoriteMenu> favorites = favoriteRepositoryPort.findAllByUser(user);
        
        return favorites.stream().map(fav -> {
            boolean isOrderable = true;
            String unavailableReasonStr = null;
            
            Menu menu = null;
            try {
                menu = menuRepository.findById(fav.getMenuId());
            } catch (Exception ignored) {}
            
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
            
            // Get option groups for this menu to resolve names/prices
            List<OptionGroup> allGroups = menuOptionRepository.findAllOptionGroups();
            
            List<FavoriteMenuResponse.FavoriteMenuOptionDto> optionsDtoList = fav.getOptions().stream().map(opt -> {
                OptionGroup group = allGroups.stream()
                        .filter(g -> g.getId().equals(opt.getOptionGroupId()))
                        .findFirst().orElse(null);
                OptionItem item = null;
                if (group != null && group.getItems() != null) {
                    item = group.getItems().stream()
                            .filter(i -> i.getId().equals(opt.getOptionItemId()))
                            .findFirst().orElse(null);
                }
                
                return FavoriteMenuResponse.FavoriteMenuOptionDto.builder()
                        .optionGroupId(opt.getOptionGroupId())
                        .optionGroupName(group != null ? group.getName() : "Unknown Group")
                        .optionItemId(opt.getOptionItemId())
                        .optionItemName(item != null ? item.getName() : "Unknown Item")
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
                List<MenuImage> images = menuImageRepositoryPort.findAllByMenuId(menu.getId());
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
        List<UserFavoriteMenu> favorites = favoriteRepositoryPort.findAllByUser(user);
        return favorites.stream().anyMatch(f -> menuId.equals(f.getMenuId()));
    }
}
