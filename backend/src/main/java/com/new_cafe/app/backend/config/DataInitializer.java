package com.new_cafe.app.backend.config;

import com.new_cafe.app.backend.category.adapter.out.persistence.CategoryJpaRepository;
import com.new_cafe.app.backend.category.domain.model.Category;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaEntity;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaRepository;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuImageJpaEntity;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuImageJpaRepository;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.*;
import com.new_cafe.app.backend.store.adapter.out.persistence.StoreSettingsJpaEntity;
import com.new_cafe.app.backend.store.adapter.out.persistence.StoreSettingsJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.auth.domain.model.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CategoryJpaRepository categoryRepository;
    private final AdminMenuJpaRepository adminMenuRepository;
    private final AdminMenuImageJpaRepository adminMenuImageRepository;
    private final UserJpaRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Option Repositories
    private final OptionGroupJpaRepository optionGroupRepository;
    private final OptionItemJpaRepository optionItemRepository;
    private final CategoryOptionGroupMapJpaRepository categoryOptionGroupMapRepository;
    private final MenuOptionExclusionJpaRepository menuOptionExclusionRepository;
    private final StoreSettingsJpaRepository storeSettingsRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (categoryRepository.count() > 0 && userRepository.count() > 0 && optionGroupRepository.count() > 0) {
            log.info("Data already exists, checking store settings only...");
        } else {
            log.info("Starting data initialization...");

            if (userRepository.count() == 0) {
            createInitialUsers();
        }

        if (categoryRepository.count() == 0) {
            // 1. Categories
            Category coffee = createCategory("Coffee", 1);
            Category nonCoffee = createCategory("Non-Coffee", 2);
            Category dessert = createCategory("Dessert", 3);
            Category bakery = createCategory("Bakery", 4);

            // 2. Coffee Menus
            AdminMenuJpaEntity espresso = createMenu(coffee, "에스프레소", "Espresso", "진한 커피의 본연의 맛", 3000, 1, "espresso.png");
            createMenu(coffee, "아메리카노", "Americano", "깔끔하고 시원한 카페의 기본", 4000, 2, "americano.png");
            createMenu(coffee, "카페라떼", "Cafe Latte", "부드러운 우유와 에스프레소의 조화", 4500, 3, "cafelatte.png");
            createMenu(coffee, "카푸치노", "Capuchino", "풍부한 우유 거품의 부드러움", 4500, 4, "capuchino.png");
            createMenu(coffee, "카라멜 마끼아또", "Caramel Macchiato", "달콤한 카라멜 향 가득한 라떼", 5000, 5, "caramelMacchiato.png");

            // 3. Non-Coffee Menus
            createMenu(nonCoffee, "바나나 라떼", "Banana Latte", "달콤한 바나나와 우유의 만남", 5500, 1, "bananalatte.png");

            // 4. Dessert Menus
            createMenu(dessert, "아몬드 쿠키", "Almond Cookie", "고소한 아몬드가 듬뿍", 2500, 1, "almondCookie.png");
            createMenu(dessert, "버터 쿠키", "Butter Cookie", "입안에서 녹는 부드러운 버터향", 2500, 2, "butterCookie.png");
            createMenu(dessert, "초코칩 쿠키", "Choco Chip Cookie", "달콤한 초코칩이 콕콕", 2500, 3, "chocoChipCookie.png");
            createMenu(dessert, "두바이 쫀득 쿠키", "Dubai Zzondeuk Cookie", "요즘 대세! 두바이 스타일 쫀득 쿠키", 5500, 4, "dubai-zzondeuk-cookie.png");
            AdminMenuJpaEntity strawberryCake = createMenu(dessert, "딸기 케이크", "Strawberry Cake", "상큼한 딸기가 가득한 케이크", 7000, 5, "strawberryCake.png");
            AdminMenuJpaEntity chocolateMousse = createMenu(dessert, "초콜릿 무스", "Chocolate Mousse", "진하고 달콤한 초코의 맛", 6500, 6, "chocolateMousse.png");

            // 5. Bakery Menus
            AdminMenuJpaEntity bagelCreamCheese = createMenu(bakery, "베이글 크림치즈", "Bagel & Cream Cheese", "담백한 베이글과 크림치즈", 4500, 1, "bagelCreamCheese.png");
            AdminMenuJpaEntity beefBagel = createMenu(bakery, "비프 베이글", "Beef Bagel", "든든한 한 끼 식사 베이글", 6500, 2, "beefBagel.png");
            AdminMenuJpaEntity chocolateCroissant = createMenu(bakery, "초콜릿 크로와상", "Chocolate Croissant", "바삭한 결 사이의 달콤한 초코", 4000, 3, "chocolateCroissant.png");
            createMenu(bakery, "햄치즈 샌드위치", "Ham & Cheese Sandwich", "신선한 야채와 햄치즈의 정석", 6000, 4, "hamCheeseSandwich.png");
            createMenu(bakery, "스크램블 에그 샌드위치", "Scrambled Egg Sandwich", "부드러운 에그 에그", 6000, 5, "scrambledEggSandwich.png");
            createMenu(bakery, "참치 샌드위치", "Tuna Sandwich", "고소한 참치 마요 가득", 6000, 6, "tunaSandwich.png");
            createMenu(bakery, "칠면조 샌드위치", "Turkey Sandwich", "담백한 칠면조 햄의 풍미", 6500, 7, "turkeySandwich.png");

            // =========================
            // 옵션 데이터 초기화 (Phase 2)
            // =========================
            log.info("Creating option groups...");
            // 1. 온도 선택
            OptionGroupJpaEntity tempGroup = createOptionGroup("온도 선택", "radio", true, 1);
            createOptionItem(tempGroup.getId(), "HOT", 0, 1);
            createOptionItem(tempGroup.getId(), "ICE", 0, 2);

            // 2. 사이즈
            OptionGroupJpaEntity sizeGroup = createOptionGroup("사이즈", "radio", true, 2);
            createOptionItem(sizeGroup.getId(), "Small", 0, 1);
            createOptionItem(sizeGroup.getId(), "Regular", 0, 2);
            createOptionItem(sizeGroup.getId(), "Large", 500, 3);
            createOptionItem(sizeGroup.getId(), "Extra Large", 1000, 4);

            // 3. 샷 추가
            OptionGroupJpaEntity shotGroup = createOptionGroup("샷 추가", "checkbox", false, 3);
            createOptionItem(shotGroup.getId(), "에스프레소 샷 추가 (+1)", 500, 1);
            createOptionItem(shotGroup.getId(), "에스프레소 샷 추가 (+2)", 1000, 2);

            // 4. 시럽 추가
            OptionGroupJpaEntity syrupGroup = createOptionGroup("시럽 추가", "checkbox", false, 4);
            createOptionItem(syrupGroup.getId(), "바닐라 시럽", 500, 1);
            createOptionItem(syrupGroup.getId(), "헤이즐넛 시럽", 500, 2);
            createOptionItem(syrupGroup.getId(), "카라멜 시럽", 500, 3);

            // 5. 데움 여부
            OptionGroupJpaEntity warmGroup = createOptionGroup("데움 여부", "radio", true, 5);
            createOptionItem(warmGroup.getId(), "그대로", 0, 1);
            createOptionItem(warmGroup.getId(), "데워주세요", 0, 2);

            // 6. 포장 옵션
            OptionGroupJpaEntity packGroup = createOptionGroup("포장 옵션", "radio", true, 6);
            createOptionItem(packGroup.getId(), "매장", 0, 1);
            createOptionItem(packGroup.getId(), "포장", 0, 2);

            // 7. 쿠키 세트
            OptionGroupJpaEntity cookieGroup = createOptionGroup("쿠키 세트", "radio", true, 7);
            createOptionItem(cookieGroup.getId(), "1개", 0, 1);
            createOptionItem(cookieGroup.getId(), "3개 세트", 4500, 2);
            createOptionItem(cookieGroup.getId(), "6개 세트", 8500, 3);

            // 8. 빵 종류 변경
            OptionGroupJpaEntity breadGroup = createOptionGroup("빵 종류 변경", "radio", false, 8);
            createOptionItem(breadGroup.getId(), "기본 빵", 0, 1);
            createOptionItem(breadGroup.getId(), "치아바타로 변경", 500, 2);
            createOptionItem(breadGroup.getId(), "통밀빵으로 변경", 0, 3);

            log.info("Creating category-option mapping...");
            // Coffee: 온도(1), 사이즈(2), 샷추가(3), 시럽추가(4)
            createCategoryOptionMap(coffee.getId(), tempGroup.getId(), 1);
            createCategoryOptionMap(coffee.getId(), sizeGroup.getId(), 2);
            createCategoryOptionMap(coffee.getId(), shotGroup.getId(), 3);
            createCategoryOptionMap(coffee.getId(), syrupGroup.getId(), 4);

            // Non-Coffee: 온도(1), 사이즈(2), 시럽추가(3)
            createCategoryOptionMap(nonCoffee.getId(), tempGroup.getId(), 1);
            createCategoryOptionMap(nonCoffee.getId(), sizeGroup.getId(), 2);
            createCategoryOptionMap(nonCoffee.getId(), syrupGroup.getId(), 3);

            // Dessert: 포장(1), 쿠키세트(2)
            createCategoryOptionMap(dessert.getId(), packGroup.getId(), 1);
            createCategoryOptionMap(dessert.getId(), cookieGroup.getId(), 2);

            // Bakery: 데움(1), 포장(2), 빵종류변경(3)
            createCategoryOptionMap(bakery.getId(), warmGroup.getId(), 1);
            createCategoryOptionMap(bakery.getId(), packGroup.getId(), 2);
            createCategoryOptionMap(bakery.getId(), breadGroup.getId(), 3);

            log.info("Creating menu option exclusions...");
            // 에스프레소: 온도, 사이즈, 시럽 제외
            createMenuExclusion(espresso.getId(), tempGroup.getId());
            createMenuExclusion(espresso.getId(), sizeGroup.getId());
            createMenuExclusion(espresso.getId(), syrupGroup.getId());

            // 딸기케이크, 초콜릿무스: 쿠키세트 제외
            createMenuExclusion(strawberryCake.getId(), cookieGroup.getId());
            createMenuExclusion(chocolateMousse.getId(), cookieGroup.getId());

            // 베이글, 크로와상: 빵종류변경 제외
            createMenuExclusion(beefBagel.getId(), breadGroup.getId());
            createMenuExclusion(chocolateCroissant.getId(), breadGroup.getId());
        }
        } // Close the else block

        if (storeSettingsRepository.count() == 0) {
            log.info("Initializing store settings...");
            StoreSettingsJpaEntity settings = StoreSettingsJpaEntity.builder()
                    .id(1)
                    .isOpen(true)
                    .openTime("09:00")
                    .closeTime("22:00")
                    .cafeName("mymyy cafe")
                    .description("최고의 재료와 정성으로 준비한 특별한 미식 경험")
                    .contactNumber("02-1234-5678")
                    .address("서울특별시 강남구 테헤란로 123")
                    .updatedAt(LocalDateTime.now())
                    .build();
            storeSettingsRepository.save(settings);
        }

        log.info("Data initialization completed.");
    }

    private Category createCategory(String name, int sortOrder) {
        Category category = Category.builder()
                .name(name)
                .sortOrder(sortOrder)
                .build();
        return categoryRepository.save(category);
    }

    private AdminMenuJpaEntity createMenu(Category category, String korName, String engName, String description, int price, int sortOrder, String imageName) {
        AdminMenuJpaEntity menu = AdminMenuJpaEntity.builder()
                .korName(korName)
                .engName(engName)
                .description(description)
                .price(price)
                .categoryId(category.getId())
                .isAvailable(true)
                .isSoldOut(false)
                .sortOrder(sortOrder)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        AdminMenuJpaEntity savedMenu = adminMenuRepository.save(menu);

        AdminMenuImageJpaEntity menuImage = AdminMenuImageJpaEntity.builder()
                .menuId(savedMenu.getId())
                .srcUrl(imageName)
                .sortOrder(1)
                .createdAt(LocalDateTime.now())
                .build();

        adminMenuImageRepository.save(menuImage);
        return savedMenu;
    }

    private void createInitialUsers() {
        log.info("Creating initial users...");
        
        createUser("hong", "1234", "ROLE_ADMIN");
        createUser("admin", "1234", "ROLE_ADMIN");
        createUser("subadmin", "1234", "ROLE_ADMIN");
        createUser("user", "1234", "ROLE_USER");
        
        log.info("Initial users created.");
    }

    private void createUser(String nickname, String password, String role) {
        User user = User.builder()
                .id(UUID.randomUUID().toString())
                .username(nickname)
                .password(passwordEncoder.encode(password))
                .role(role)
                .build();
        userRepository.save(user);
    }

    private OptionGroupJpaEntity createOptionGroup(String name, String type, boolean isRequired, int sortOrder) {
        OptionGroupJpaEntity group = OptionGroupJpaEntity.builder()
                .name(name)
                .type(type)
                .isRequired(isRequired)
                .sortOrder(sortOrder)
                .build();
        return optionGroupRepository.save(group);
    }

    private void createOptionItem(Long groupId, String name, int priceDelta, int sortOrder) {
        OptionItemJpaEntity item = OptionItemJpaEntity.builder()
                .optionGroupId(groupId)
                .name(name)
                .priceDelta(priceDelta)
                .sortOrder(sortOrder)
                .build();
        optionItemRepository.save(item);
    }

    private void createCategoryOptionMap(Long categoryId, Long groupId, int sortOrder) {
        CategoryOptionGroupMapJpaEntity map = CategoryOptionGroupMapJpaEntity.builder()
                .categoryId(categoryId)
                .optionGroupId(groupId)
                .sortOrder(sortOrder)
                .build();
        categoryOptionGroupMapRepository.save(map);
    }

    private void createMenuExclusion(Long menuId, Long groupId) {
        MenuOptionExclusionJpaEntity exclusion = MenuOptionExclusionJpaEntity.builder()
                .menuId(menuId)
                .optionGroupId(groupId)
                .build();
        menuOptionExclusionRepository.save(exclusion);
    }
}
