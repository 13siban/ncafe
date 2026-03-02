package com.new_cafe.app.backend.config;

import com.new_cafe.app.backend.category.adapter.out.persistence.CategoryJpaRepository;
import com.new_cafe.app.backend.category.domain.model.Category;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaEntity;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaRepository;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuImageJpaEntity;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuImageJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (categoryRepository.count() > 0) {
            log.info("Data already exists, skipping initialization.");
            return;
        }

        log.info("Starting data initialization...");

        // 1. Categories
        Category coffee = createCategory("Coffee", 1);
        Category nonCoffee = createCategory("Non-Coffee", 2);
        Category dessert = createCategory("Dessert", 3);
        Category bakery = createCategory("Bakery", 4);

        // 2. Coffee Menus
        createMenu(coffee, "에스프레소", "Espresso", "진한 커피의 본연의 맛", 3000, 1, "espresso.png");
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
        createMenu(dessert, "딸기 케이크", "Strawberry Cake", "상큼한 딸기가 가득한 케이크", 7000, 5, "strawberryCake.png");
        createMenu(dessert, "초콜릿 무스", "Chocolate Mousse", "진하고 달콤한 초코의 맛", 6500, 6, "chocolateMousse.png");

        // 5. Bakery Menus
        createMenu(bakery, "베이글 크림치즈", "Bagel & Cream Cheese", "담백한 베이글과 크림치즈", 4500, 1, "bagelCreamCheese.png");
        createMenu(bakery, "비프 베이글", "Beef Bagel", "든든한 한 끼 식사 베이글", 6500, 2, "beefBagel.png");
        createMenu(bakery, "초콜릿 크로와상", "Chocolate Croissant", "바삭한 결 사이의 달콤한 초코", 4000, 3, "chocolateCroissant.png");
        createMenu(bakery, "햄치즈 샌드위치", "Ham & Cheese Sandwich", "신선한 야채와 햄치즈의 정석", 6000, 4, "hamCheeseSandwich.png");
        createMenu(bakery, "스크램블 에그 샌드위치", "Scrambled Egg Sandwich", "부드러운 에그 에그", 6000, 5, "scrambledEggSandwich.png");
        createMenu(bakery, "참치 샌드위치", "Tuna Sandwich", "고소한 참치 마요 가득", 6000, 6, "tunaSandwich.png");
        createMenu(bakery, "칠면조 샌드위치", "Turkey Sandwich", "담백한 칠면조 햄의 풍미", 6500, 7, "turkeySandwich.png");

        log.info("Data initialization completed.");
    }

    private Category createCategory(String name, int sortOrder) {
        Category category = Category.builder()
                .name(name)
                .sortOrder(sortOrder)
                .build();
        return categoryRepository.save(category);
    }

    private void createMenu(Category category, String korName, String engName, String description, int price, int sortOrder, String imageName) {
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
    }
}
