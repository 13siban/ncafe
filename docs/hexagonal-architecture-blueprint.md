# NCafe 메뉴 관리 서비스 — Hexagonal Architecture 전환 청사진

> 작성일: 2026-02-13  
> 대상: `ncafe/backend` 내 메뉴 관리 도메인  
> 목표: MSA 분리를 대비한 Hexagonal Architecture(Ports & Adapters) 적용  
> 기술 스택: Spring Boot 4.0.1 + Java 21 + PostgreSQL + JDBC

---

## 1. 왜 Hexagonal Architecture인가?

### 1.1 MSA 전환을 위한 전략적 선택

```
 현재 (Monolith)                    미래 (MSA)
┌──────────────────┐          ┌──────────────────┐  ┌──────────────────┐
│    NCafe Backend  │    →     │  Menu Service     │  │  Order Service   │
│  ┌──── Menu ────┐│          │  (독립 배포 단위)  │  │  (독립 배포 단위)  │
│  ├── Category ──┤│          └──────────────────┘  └──────────────────┘
│  ├── Order ─────┤│          ┌──────────────────┐
│  └── User ──────┘│          │  User Service     │
└──────────────────┘          └──────────────────┘
```

> **Hexagonal Architecture**로 메뉴 도메인을 명확하게 격리하면,  
> 나중에 MSA로 분리할 때 **그 패키지 자체가 하나의 마이크로서비스**가 됩니다.

### 1.2 Hexagonal vs 기존 Layered Architecture

| 항목 | Layered (현재) | Hexagonal (목표) |
|------|---------------|-----------------|
| 의존성 방향 | 위→아래 (Controller→Service→Repository) | **바깥→안쪽** (Adapter→Port→Domain) |
| 교체 용이성 | DB 교체 시 Service까지 영향 | **Adapter만 교체** (Domain 무관) |
| 테스트 | DB 없이 테스트 어려움 | **포트를 Mock하여 단위 테스트 용이** |
| MSA 분리 | 패키지 간 얽힘이 심함 | **도메인 경계가 명확 → 그대로 서비스로 추출** |

---

## 2. 현재 구조 분석 (AS-IS)

### 2.1 현재 메뉴 관련 파일 목록

```
com.new_cafe.app.backend/
├── controller/admin/
│   ├── MenuController.java            ← REST API (/admin/menus)
│   └── CategoryController.java        ← REST API (/admin/categories)
├── dto/
│   ├── MenuListRequest.java           ← 메뉴 목록 조회 요청
│   ├── MenuListResponse.java          ← 메뉴 목록 응답 (List<MenuResponse> + total)
│   ├── MenuResponse.java              ← 메뉴 요약 응답
│   ├── MenuDetailResponse.java        ← 메뉴 상세 응답
│   ├── MenuCreateRequest/Response     ← (미구현, 빈 record)
│   ├── MenuUpdateRequest/Response     ← (미구현, 빈 record)
│   ├── MenuImageResponse.java         ← 이미지 응답
│   ├── MenuImageListResponse.java     ← 이미지 목록 응답
│   └── CategoryResponse.java          ← 카테고리 응답 (menuCount 포함)
├── entity/
│   ├── Menu.java                      ← id, korName, engName, price, categoryId, ...
│   ├── Category.java                  ← id, name, icon, sortOrder
│   └── MenuImage.java                 ← id, menuId, srcUrl, sortOrder
├── service/
│   ├── MenuService.java (interface)   ← getMenus, getMenu, create, update, delete, getImages
│   ├── NewMenuService.java            ← MenuService 구현체 (핵심 비즈니스 로직)
│   ├── CategoryService.java (interface)
│   └── NewCategoryService.java        ← CategoryService 구현체
└── repository/
    ├── MenuRepository.java (interface)
    ├── NewMenuRepository.java         ← JDBC 구현 (DataSource 직접 사용)
    ├── CategoryRepository.java (interface)
    ├── NewCategoryRepository.java     ← JDBC 구현
    ├── MenuImageRepository.java (interface)
    └── NewMenuImageRepository.java    ← JDBC 구현
```

### 2.2 현재 의존성 흐름 & 문제점

```
MenuController ──▶ MenuService (interface)
                        │
                   NewMenuService ──▶ MenuRepository (interface)
                                 ──▶ CategoryRepository (interface)  ⚠️ 다른 도메인 직접 참조
                                 ──▶ MenuImageRepository (interface)
                                        │
                                   NewMenuRepository ──▶ DataSource (JDBC)
```

**핵심 문제:**
1. ⚠️ `NewMenuService`가 **DTO 변환 + 비즈니스 로직 + 여러 Repository 조합**을 모두 담당
2. ⚠️ `CategoryRepository`가 **DTO(`CategoryResponse`)를 직접 반환** → 계층 위반
3. ⚠️ `findAllByCategoryAndSearchQuery()`에서 **SQL Injection 취약** (문자열 연결)
4. ⚠️ ResultSet → Entity 변환 코드가 **5곳 이상 중복**
5. ⚠️ Create / Update / Delete가 **미구현 상태**

---

## 3. Hexagonal Architecture 목표 구조 (TO-BE)

### 3.1 헥사고날 개념도

```
                          ┌──────────────────────────────────┐
                          │         Driving Adapters          │
                          │  (외부 → 애플리케이션으로 요청)     │
                          │                                  │
                          │   MenuController (REST)          │
                          │   (미래: gRPC, GraphQL, CLI...)   │
                          └──────────┬───────────────────────┘
                                     │ calls
                                     ▼
                          ┌──────────────────────┐
                          │   Driving Ports (IN)  │
                          │   (Use Case Interface)│
                          │                      │
                          │  GetMenuListUseCase   │
                          │  GetMenuDetailUseCase │
                          │  CreateMenuUseCase    │
                          │  UpdateMenuUseCase    │
                          │  DeleteMenuUseCase    │
                          │  GetMenuImagesUseCase │
                          └──────────┬───────────┘
                                     │ implements
                                     ▼
                    ┌────────────────────────────────────┐
                    │                                    │
                    │          APPLICATION CORE           │
                    │                                    │
                    │  ┌──────────────────────────────┐  │
                    │  │     Domain Model (POJO)      │  │
                    │  │  Menu, Category, MenuImage   │  │
                    │  │  + 비즈니스 로직 메서드        │  │
                    │  └──────────────────────────────┘  │
                    │                                    │
                    │  ┌──────────────────────────────┐  │
                    │  │     Application Services      │  │
                    │  │  MenuQueryService             │  │
                    │  │  MenuCommandService            │  │
                    │  └──────────────────────────────┘  │
                    │                                    │
                    └──────────┬─────────────────────────┘
                               │ depends on
                               ▼
                    ┌──────────────────────┐
                    │  Driven Ports (OUT)   │
                    │  (Repository Port)   │
                    │                      │
                    │  LoadMenuPort         │
                    │  SaveMenuPort         │
                    │  LoadCategoryPort     │
                    │  LoadMenuImagePort    │
                    └──────────┬───────────┘
                               │ implements (의존성 역전)
                               ▼
                    ┌──────────────────────────────────┐
                    │        Driven Adapters            │
                    │  (애플리케이션 → 외부 인프라)       │
                    │                                  │
                    │  JdbcMenuAdapter (PostgreSQL)     │
                    │  JdbcCategoryAdapter              │
                    │  JdbcMenuImageAdapter             │
                    │  (미래: JPA, Redis, 외부 API...)   │
                    └──────────────────────────────────┘
```

### 3.2 새로운 패키지 구조

```
com.new_cafe.app.backend/
├── BackendApplication.java
│
├── menu/                                          ⬅ 【메뉴 도메인 모듈 (MSA 분리 단위)】
│   │
│   ├── domain/                                    ⬅ 【도메인 코어 — 프레임워크 의존 없음】
│   │   ├── model/
│   │   │   ├── Menu.java                          # 도메인 엔티티 + 비즈니스 로직
│   │   │   ├── Category.java                      # 도메인 엔티티
│   │   │   ├── MenuImage.java                     # 도메인 엔티티
│   │   │   └── MenuSearchCriteria.java            # 검색 조건 Value Object
│   │   └── exception/
│   │       ├── MenuNotFoundException.java         # 도메인 예외
│   │       └── InvalidMenuException.java          # 도메인 예외
│   │
│   ├── application/                               ⬅ 【애플리케이션 서비스 — 유스케이스 구현】
│   │   ├── port/
│   │   │   ├── in/                                # Driving Port (Inbound)
│   │   │   │   ├── GetMenuListUseCase.java
│   │   │   │   ├── GetMenuDetailUseCase.java
│   │   │   │   ├── CreateMenuUseCase.java
│   │   │   │   ├── UpdateMenuUseCase.java
│   │   │   │   ├── DeleteMenuUseCase.java
│   │   │   │   └── GetMenuImagesUseCase.java
│   │   │   └── out/                               # Driven Port (Outbound)
│   │   │       ├── LoadMenuPort.java              # 메뉴 조회
│   │   │       ├── SaveMenuPort.java              # 메뉴 저장 (Create + Update)
│   │   │       ├── DeleteMenuPort.java            # 메뉴 삭제
│   │   │       ├── LoadCategoryPort.java          # 카테고리 조회
│   │   │       └── LoadMenuImagePort.java         # 이미지 조회
│   │   └── service/
│   │       ├── MenuQueryService.java              # 조회 UseCase 구현
│   │       └── MenuCommandService.java            # 생성/수정/삭제 UseCase 구현
│   │
│   └── adapter/                                   ⬅ 【어댑터 — 외부 세계와의 연결】
│       ├── in/                                    # Driving Adapter (요청 수신)
│       │   └── web/
│       │       ├── MenuController.java            # REST Controller
│       │       ├── CategoryController.java        # REST Controller
│       │       ├── dto/
│       │       │   ├── request/
│       │       │   │   ├── MenuListRequest.java
│       │       │   │   ├── CreateMenuRequest.java
│       │       │   │   └── UpdateMenuRequest.java
│       │       │   └── response/
│       │       │       ├── MenuResponse.java
│       │       │       ├── MenuListResponse.java
│       │       │       ├── MenuDetailResponse.java
│       │       │       ├── MenuImageResponse.java
│       │       │       ├── MenuImageListResponse.java
│       │       │       └── CategoryResponse.java
│       │       └── mapper/
│       │           └── MenuDtoMapper.java         # Domain ↔ DTO 변환
│       └── out/                                   # Driven Adapter (인프라 접근)
│           └── persistence/
│               ├── JdbcMenuAdapter.java           # LoadMenuPort + SaveMenuPort + DeleteMenuPort 구현
│               ├── JdbcCategoryAdapter.java       # LoadCategoryPort 구현
│               ├── JdbcMenuImageAdapter.java      # LoadMenuImagePort 구현
│               └── mapper/
│                   ├── MenuRowMapper.java          # ResultSet → Menu 변환 유틸
│                   ├── CategoryRowMapper.java
│                   └── MenuImageRowMapper.java
│
├── config/                                        ⬅ 【공통 설정】
│   └── WebConfig.java
└── filter/
    ├── LogFilter.java
    └── TestFilter.java
```

---

## 4. 상세 설계

### 4.1 도메인 모델 (Domain Model)

#### `menu/domain/model/Menu.java`
```java
package com.new_cafe.app.backend.menu.domain.model;

import java.time.LocalDateTime;
import lombok.*;

/**
 * 메뉴 도메인 엔티티.
 * 순수 POJO — Spring/JDBC 등 프레임워크에 의존하지 않습니다.
 */
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Menu {
    private Long id;
    private String korName;
    private String engName;
    private String description;
    private Integer price;
    private Long categoryId;
    private Boolean isAvailable;
    private Boolean isSoldOut;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── 비즈니스 로직 ──

    /** 주문 가능 여부 판단 */
    public boolean canOrder() {
        return Boolean.TRUE.equals(isAvailable) && !Boolean.TRUE.equals(isSoldOut);
    }

    /** 품절 처리 */
    public void markAsSoldOut() {
        this.isSoldOut = true;
        this.updatedAt = LocalDateTime.now();
    }

    /** 판매 재개 */
    public void markAsAvailable() {
        this.isSoldOut = false;
        this.isAvailable = true;
        this.updatedAt = LocalDateTime.now();
    }

    /** 메뉴 정보 수정 */
    public void updateInfo(String korName, String engName, String description, Integer price, Long categoryId) {
        this.korName = korName;
        this.engName = engName;
        this.description = description;
        this.price = price;
        this.categoryId = categoryId;
        this.updatedAt = LocalDateTime.now();
    }

    /** 새 메뉴 생성 팩토리 메서드 */
    public static Menu create(String korName, String engName, String description, Integer price, Long categoryId) {
        return Menu.builder()
            .korName(korName)
            .engName(engName)
            .description(description)
            .price(price)
            .categoryId(categoryId)
            .isAvailable(true)
            .isSoldOut(false)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();
    }
}
```

#### `menu/domain/model/MenuSearchCriteria.java`
```java
/**
 * 메뉴 검색 조건 — Value Object
 */
@Getter
@Builder
public class MenuSearchCriteria {
    private final Long categoryId;
    private final String searchQuery;

    public boolean hasCategoryFilter() {
        return categoryId != null;
    }

    public boolean hasSearchQuery() {
        return searchQuery != null && !searchQuery.isBlank();
    }
}
```

#### `menu/domain/exception/MenuNotFoundException.java`
```java
public class MenuNotFoundException extends RuntimeException {
    public MenuNotFoundException(Long menuId) {
        super("메뉴를 찾을 수 없습니다. ID: " + menuId);
    }
}
```

---

### 4.2 포트 (Ports)

#### Driving Port (IN) — `menu/application/port/in/`

```java
// ── GetMenuListUseCase.java ──
public interface GetMenuListUseCase {
    Result execute(Query query);

    @Getter @Builder
    class Query {
        private final Long categoryId;
        private final String searchQuery;
    }

    @Getter @Builder
    class Result {
        private final List<MenuSummary> menus;
        private final int total;
    }

    @Getter @Builder
    class MenuSummary {
        private final Long id;
        private final String korName;
        private final String engName;
        private final String description;
        private final Integer price;
        private final String categoryName;
        private final String imageSrc;
        private final Boolean isAvailable;
        private final Boolean isSoldOut;
        private final LocalDateTime createdAt;
        private final LocalDateTime updatedAt;
    }
}

// ── GetMenuDetailUseCase.java ──
public interface GetMenuDetailUseCase {
    Result execute(Long menuId);

    @Getter @Builder
    class Result {
        private final Long id;
        private final String korName;
        private final String engName;
        private final String description;
        private final Integer price;
        private final String categoryName;
        private final Boolean isAvailable;
        private final Boolean isSoldOut;
        private final LocalDateTime createdAt;
        private final LocalDateTime updatedAt;
    }
}

// ── CreateMenuUseCase.java ──
public interface CreateMenuUseCase {
    Long execute(Command command);

    @Getter @Builder
    class Command {
        private final String korName;
        private final String engName;
        private final String description;
        private final Integer price;
        private final Long categoryId;
    }
}

// ── UpdateMenuUseCase.java ──
public interface UpdateMenuUseCase {
    void execute(Command command);

    @Getter @Builder
    class Command {
        private final Long id;
        private final String korName;
        private final String engName;
        private final String description;
        private final Integer price;
        private final Long categoryId;
    }
}

// ── DeleteMenuUseCase.java ──
public interface DeleteMenuUseCase {
    void execute(Long menuId);
}

// ── GetMenuImagesUseCase.java ──
public interface GetMenuImagesUseCase {
    Result execute(Long menuId);

    @Getter @Builder
    class Result {
        private final List<ImageInfo> images;
    }

    @Getter @Builder
    class ImageInfo {
        private final Long id;
        private final Long menuId;
        private final String srcUrl;
        private final Integer sortOrder;
        private final String altText;
    }
}
```

#### Driven Port (OUT) — `menu/application/port/out/`

```java
// ── LoadMenuPort.java ──
public interface LoadMenuPort {
    Menu findById(Long id);
    List<Menu> findAll();
    List<Menu> findByCriteria(MenuSearchCriteria criteria);
}

// ── SaveMenuPort.java ──
public interface SaveMenuPort {
    Menu save(Menu menu);    // INSERT (id == null) 또는 UPDATE (id != null)
}

// ── DeleteMenuPort.java ──
public interface DeleteMenuPort {
    void deleteById(Long id);
}

// ── LoadCategoryPort.java ──
public interface LoadCategoryPort {
    Category findById(Long id);
    List<Category> findAll();
}

// ── LoadMenuImagePort.java ──
public interface LoadMenuImagePort {
    List<MenuImage> findAllByMenuId(Long menuId);
}
```

---

### 4.3 애플리케이션 서비스 (Application Service)

#### `menu/application/service/MenuQueryService.java`
```java
@Service
@RequiredArgsConstructor
public class MenuQueryService implements GetMenuListUseCase, GetMenuDetailUseCase, GetMenuImagesUseCase {

    private final LoadMenuPort loadMenuPort;
    private final LoadCategoryPort loadCategoryPort;
    private final LoadMenuImagePort loadMenuImagePort;

    @Override
    public GetMenuListUseCase.Result execute(GetMenuListUseCase.Query query) {
        // 1. 검색 조건 생성
        MenuSearchCriteria criteria = MenuSearchCriteria.builder()
            .categoryId(query.getCategoryId())
            .searchQuery(query.getSearchQuery())
            .build();

        // 2. 도메인 모델 조회
        List<Menu> menus = loadMenuPort.findByCriteria(criteria);

        // 3. 부가 정보 조합 → UseCase 결과 생성
        List<GetMenuListUseCase.MenuSummary> summaries = menus.stream()
            .map(menu -> {
                Category category = loadCategoryPort.findById(menu.getCategoryId());
                String categoryName = (category != null) ? category.getName() : "미지정";
                
                List<MenuImage> images = loadMenuImagePort.findAllByMenuId(menu.getId());
                String imageSrc = images.isEmpty() ? "blank.png" : images.get(0).getSrcUrl();

                return GetMenuListUseCase.MenuSummary.builder()
                    .id(menu.getId())
                    .korName(menu.getKorName())
                    .engName(menu.getEngName())
                    .description(menu.getDescription())
                    .price(menu.getPrice())
                    .categoryName(categoryName)
                    .imageSrc(imageSrc)
                    .isAvailable(menu.getIsAvailable())
                    .isSoldOut(menu.getIsSoldOut())
                    .createdAt(menu.getCreatedAt())
                    .updatedAt(menu.getUpdatedAt())
                    .build();
            })
            .toList();

        return GetMenuListUseCase.Result.builder()
            .menus(summaries)
            .total(summaries.size())
            .build();
    }

    @Override
    public GetMenuDetailUseCase.Result execute(Long menuId) {
        Menu menu = loadMenuPort.findById(menuId);
        if (menu == null) throw new MenuNotFoundException(menuId);

        Category category = loadCategoryPort.findById(menu.getCategoryId());
        String categoryName = (category != null) ? category.getName() : "미지정";

        return GetMenuDetailUseCase.Result.builder()
            .id(menu.getId())
            .korName(menu.getKorName())
            // ... 매핑
            .categoryName(categoryName)
            .build();
    }

    @Override
    public GetMenuImagesUseCase.Result execute(Long menuId) {
        Menu menu = loadMenuPort.findById(menuId);
        String altText = (menu != null) ? menu.getKorName() : "알 수 없는 메뉴";

        List<MenuImage> images = loadMenuImagePort.findAllByMenuId(menuId);

        List<GetMenuImagesUseCase.ImageInfo> imageInfos = images.stream()
            .map(img -> GetMenuImagesUseCase.ImageInfo.builder()
                .id(img.getId())
                .menuId(img.getMenuId())
                .srcUrl(img.getSrcUrl())
                .sortOrder(img.getSortOrder())
                .altText(altText)
                .build())
            .toList();

        return GetMenuImagesUseCase.Result.builder()
            .images(imageInfos)
            .build();
    }
}
```

#### `menu/application/service/MenuCommandService.java`
```java
@Service
@RequiredArgsConstructor
public class MenuCommandService implements CreateMenuUseCase, UpdateMenuUseCase, DeleteMenuUseCase {

    private final LoadMenuPort loadMenuPort;
    private final SaveMenuPort saveMenuPort;
    private final DeleteMenuPort deleteMenuPort;

    @Override
    public Long execute(CreateMenuUseCase.Command command) {
        Menu menu = Menu.create(
            command.getKorName(),
            command.getEngName(),
            command.getDescription(),
            command.getPrice(),
            command.getCategoryId()
        );
        Menu saved = saveMenuPort.save(menu);
        return saved.getId();
    }

    @Override
    public void execute(UpdateMenuUseCase.Command command) {
        Menu menu = loadMenuPort.findById(command.getId());
        if (menu == null) throw new MenuNotFoundException(command.getId());

        menu.updateInfo(
            command.getKorName(),
            command.getEngName(),
            command.getDescription(),
            command.getPrice(),
            command.getCategoryId()
        );
        saveMenuPort.save(menu);
    }

    @Override
    public void execute(Long menuId) {
        Menu menu = loadMenuPort.findById(menuId);
        if (menu == null) throw new MenuNotFoundException(menuId);
        deleteMenuPort.deleteById(menuId);
    }
}
```

---

### 4.4 Driving Adapter — Web Controller

#### `menu/adapter/in/web/MenuController.java`
```java
@RestController
@RequestMapping("/admin/menus")
@RequiredArgsConstructor
public class MenuController {

    private final GetMenuListUseCase getMenuListUseCase;
    private final GetMenuDetailUseCase getMenuDetailUseCase;
    private final CreateMenuUseCase createMenuUseCase;
    private final UpdateMenuUseCase updateMenuUseCase;
    private final DeleteMenuUseCase deleteMenuUseCase;
    private final GetMenuImagesUseCase getMenuImagesUseCase;

    @GetMapping
    public MenuListResponse getMenus(MenuListRequest request) {
        var result = getMenuListUseCase.execute(
            GetMenuListUseCase.Query.builder()
                .categoryId(request.getCategoryId())
                .searchQuery(request.getSearchQuery())
                .build()
        );
        return MenuDtoMapper.toMenuListResponse(result);
    }

    @GetMapping("/{id}")
    public MenuDetailResponse getMenu(@PathVariable Long id) {
        var result = getMenuDetailUseCase.execute(id);
        return MenuDtoMapper.toMenuDetailResponse(result);
    }

    @PostMapping
    public Map<String, Long> createMenu(@RequestBody CreateMenuRequest request) {
        Long menuId = createMenuUseCase.execute(
            CreateMenuUseCase.Command.builder()
                .korName(request.getKorName())
                .engName(request.getEngName())
                .description(request.getDescription())
                .price(request.getPrice())
                .categoryId(request.getCategoryId())
                .build()
        );
        return Map.of("id", menuId);
    }

    @PutMapping("/{id}")
    public void updateMenu(@PathVariable Long id, @RequestBody UpdateMenuRequest request) {
        updateMenuUseCase.execute(
            UpdateMenuUseCase.Command.builder()
                .id(id)
                .korName(request.getKorName())
                .engName(request.getEngName())
                .description(request.getDescription())
                .price(request.getPrice())
                .categoryId(request.getCategoryId())
                .build()
        );
    }

    @DeleteMapping("/{id}")
    public void deleteMenu(@PathVariable Long id) {
        deleteMenuUseCase.execute(id);
    }

    @GetMapping("/{id}/menu-images")
    public MenuImageListResponse getImages(@PathVariable Long id) {
        var result = getMenuImagesUseCase.execute(id);
        return MenuDtoMapper.toMenuImageListResponse(result);
    }
}
```

---

### 4.5 Driven Adapter — JDBC Persistence

#### `menu/adapter/out/persistence/JdbcMenuAdapter.java`
```java
@Repository
@RequiredArgsConstructor
public class JdbcMenuAdapter implements LoadMenuPort, SaveMenuPort, DeleteMenuPort {

    private final DataSource dataSource;

    @Override
    public List<Menu> findByCriteria(MenuSearchCriteria criteria) {
        List<Menu> menus = new ArrayList<>();
        
        // ✅ PreparedStatement 파라미터 바인딩 — SQL Injection 방지
        StringBuilder sql = new StringBuilder("SELECT * FROM menus WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (criteria.hasCategoryFilter()) {
            sql.append(" AND category_id = ?");
            params.add(criteria.getCategoryId());
        }
        if (criteria.hasSearchQuery()) {
            sql.append(" AND kor_name LIKE ?");
            params.add("%" + criteria.getSearchQuery() + "%");
        }
        sql.append(" ORDER BY id ASC");

        try (Connection conn = dataSource.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                pstmt.setObject(i + 1, params.get(i));
            }

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    menus.add(MenuRowMapper.map(rs));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("메뉴 조회 실패", e);
        }
        return menus;
    }

    @Override
    public Menu save(Menu menu) {
        if (menu.getId() == null) {
            return insert(menu);
        }
        return update(menu);
    }

    private Menu insert(Menu menu) {
        String sql = """
            INSERT INTO menus (kor_name, eng_name, description, price, category_id, is_available, is_sold_out, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING id
        """;
        // ... PreparedStatement 구현
    }

    private Menu update(Menu menu) {
        String sql = """
            UPDATE menus SET kor_name=?, eng_name=?, description=?, price=?, 
            category_id=?, is_available=?, is_sold_out=?, updated_at=?
            WHERE id=?
        """;
        // ... PreparedStatement 구현
    }

    @Override
    public void deleteById(Long id) {
        String sql = "DELETE FROM menus WHERE id = ?";
        // ... PreparedStatement 구현
    }
}
```

#### `menu/adapter/out/persistence/mapper/MenuRowMapper.java`
```java
/**
 * ResultSet → Menu 변환 유틸리티.
 * 기존 5곳 이상의 중복 코드를 한곳으로 통합합니다.
 */
public class MenuRowMapper {
    public static Menu map(ResultSet rs) throws SQLException {
        return Menu.builder()
            .id(rs.getLong("id"))
            .korName(rs.getString("kor_name"))
            .engName(rs.getString("eng_name"))
            .price(rs.getInt("price"))
            .categoryId(rs.getLong("category_id"))
            .description(rs.getString("description"))
            .isAvailable(rs.getBoolean("is_available"))
            .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
            .updatedAt(rs.getTimestamp("updated_at").toLocalDateTime())
            .build();
    }
}
```

---

## 5. 파일 매핑 (AS-IS → TO-BE)

### 5.1 이동 & 변경 매핑

| AS-IS | TO-BE | 변경 사항 |
|-------|-------|----------|
| `entity/Menu.java` | `menu/domain/model/Menu.java` | `@Data` → `@Getter` + 비즈니스 메서드 추가 + `category` 필드 제거 |
| `entity/Category.java` | `menu/domain/model/Category.java` | 이동 (변경 최소) |
| `entity/MenuImage.java` | `menu/domain/model/MenuImage.java` | 이동 (변경 최소) |
| — (신규) | `menu/domain/model/MenuSearchCriteria.java` | 검색 조건 Value Object 신규 생성 |
| — (신규) | `menu/domain/exception/MenuNotFoundException.java` | 도메인 예외 신규 생성 |
| `service/MenuService.java` | `menu/application/port/in/*.java` (6개 UseCase) | **1개 → 6개 분리** |
| `service/NewMenuService.java` | `menu/application/service/MenuQueryService.java` + `MenuCommandService.java` | **조회/명령 분리** |
| `service/CategoryService.java` | `menu/application/port/in/` 또는 `port/out/LoadCategoryPort` | 단순화 |
| `service/NewCategoryService.java` | 현재 스코프에서 제외 (Category는 Port로만 접근) | — |
| `repository/MenuRepository.java` | `menu/application/port/out/LoadMenuPort.java` + `SaveMenuPort.java` + `DeleteMenuPort.java` | **1개 → 3개 분리 (역할별)** |
| `repository/NewMenuRepository.java` | `menu/adapter/out/persistence/JdbcMenuAdapter.java` | SQL Injection 수정 + RowMapper 분리 + save/delete 구현 |
| `repository/CategoryRepository.java` | `menu/application/port/out/LoadCategoryPort.java` | **DTO 반환 → Entity 반환**으로 변경 |
| `repository/NewCategoryRepository.java` | `menu/adapter/out/persistence/JdbcCategoryAdapter.java` | Entity 반환으로 변경 |
| `repository/MenuImageRepository.java` | `menu/application/port/out/LoadMenuImagePort.java` | 이동 |
| `repository/NewMenuImageRepository.java` | `menu/adapter/out/persistence/JdbcMenuImageAdapter.java` | RowMapper 분리 |
| `controller/admin/MenuController.java` | `menu/adapter/in/web/MenuController.java` | UseCase 의존으로 변경 + CUD API 완성 |
| `controller/admin/CategoryController.java` | `menu/adapter/in/web/CategoryController.java` | UseCase 의존으로 변경 |
| `dto/MenuListRequest.java` | `menu/adapter/in/web/dto/request/MenuListRequest.java` | 패키지 이동 |
| `dto/MenuListResponse.java` | `menu/adapter/in/web/dto/response/MenuListResponse.java` | `from()` 정적 팩토리 메서드 추가 |
| `dto/MenuResponse.java` 등 | `menu/adapter/in/web/dto/response/` | 패키지 이동 |
| — (신규) | `menu/adapter/in/web/mapper/MenuDtoMapper.java` | UseCase Result ↔ Response DTO 변환 |
| — (신규) | `menu/adapter/out/persistence/mapper/MenuRowMapper.java` | ResultSet → Domain 변환 (중복 제거) |

### 5.2 삭제 대상

| 파일 | 이유 |
|------|------|
| `entity/Menu.class` | 컴파일 결과물 (소스가 아님) |
| `dto/MenuCreateRequest.java` / `MenuCreateResponse.java` | 빈 record → 새로운 DTO로 대체 |
| `dto/MenuUpdateRequest.java` / `MenuUpdateResponse.java` | 빈 record → 새로운 DTO로 대체 |

---

## 6. 의존성 흐름 다이어그램 (TO-BE)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DRIVING ADAPTER (IN)                              │
│                                                                       │
│   MenuController ───uses──▶ GetMenuListUseCase     (Port Interface)   │
│                   ───uses──▶ GetMenuDetailUseCase                     │
│                   ───uses──▶ CreateMenuUseCase                        │
│                   ───uses──▶ UpdateMenuUseCase                        │
│                   ───uses──▶ DeleteMenuUseCase                        │
│                   ───uses──▶ GetMenuImagesUseCase                     │
│                                                                       │
│   MenuDtoMapper  ── UseCase Result → Response DTO 변환                │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ (Port를 통한 의존)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION                                    │
│                                                                       │
│   MenuQueryService ──impl──▶ GetMenuListUseCase, GetMenuDetailUseCase │
│                    ──uses──▶ LoadMenuPort          (Port Interface)    │
│                    ──uses──▶ LoadCategoryPort                         │
│                    ──uses──▶ LoadMenuImagePort                        │
│                                                                       │
│   MenuCommandService ──impl──▶ CreateMenuUseCase, UpdateMenuUseCase  │
│                      ──uses──▶ LoadMenuPort, SaveMenuPort            │
│                      ──uses──▶ DeleteMenuPort                        │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │ (Port를 통한 의존)
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DOMAIN                                       │
│                                                                       │
│   Menu, Category, MenuImage        (순수 도메인 모델, POJO)            │
│   MenuSearchCriteria               (Value Object)                      │
│   MenuNotFoundException            (도메인 예외)                       │
│                                                                       │
│   ※ 이 영역은 Spring, JDBC 등 외부 프레임워크에 일절 의존하지 않음      │
└─────────────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │ (의존성 역전 — Port를 구현)
┌─────────────────────────────────────────────────────────────────────────┐
│                      DRIVEN ADAPTER (OUT)                              │
│                                                                       │
│   JdbcMenuAdapter     ──impl──▶ LoadMenuPort, SaveMenuPort,          │
│                                  DeleteMenuPort                       │
│   JdbcCategoryAdapter ──impl──▶ LoadCategoryPort                     │
│   JdbcMenuImageAdapter──impl──▶ LoadMenuImagePort                    │
│                                                                       │
│   MenuRowMapper, CategoryRowMapper, MenuImageRowMapper                │
│   ※ DataSource, JDBC, SQL 등 인프라 기술 의존                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. 마이그레이션 단계

### Phase 1: 도메인 코어 생성 🟢
> **기존 코드 영향: 없음** — 새로운 패키지에 병렬로 생성

| 순서 | 작업 | 파일 |
|------|------|------|
| 1-1 | `menu/domain/model/` 생성 | `Menu.java`, `Category.java`, `MenuImage.java`, `MenuSearchCriteria.java` |
| 1-2 | `menu/domain/exception/` 생성 | `MenuNotFoundException.java`, `InvalidMenuException.java` |

### Phase 2: 포트 인터페이스 정의 🟢
> **기존 코드 영향: 없음**

| 순서 | 작업 | 파일 |
|------|------|------|
| 2-1 | Driving Port(IN) 생성 | 6개 UseCase 인터페이스 |
| 2-2 | Driven Port(OUT) 생성 | `LoadMenuPort`, `SaveMenuPort`, `DeleteMenuPort`, `LoadCategoryPort`, `LoadMenuImagePort` |

### Phase 3: Driven Adapter 구현 🟡
> **기존 Repository 로직 이전 + 개선**

| 순서 | 작업 | 파일 |
|------|------|------|
| 3-1 | RowMapper 유틸리티 생성 | `MenuRowMapper`, `CategoryRowMapper`, `MenuImageRowMapper` |
| 3-2 | JDBC Adapter 구현 | `JdbcMenuAdapter`, `JdbcCategoryAdapter`, `JdbcMenuImageAdapter` |

### Phase 4: Application Service 구현 🟡
> **기존 Service 로직 이전 + 분리**

| 순서 | 작업 | 파일 |
|------|------|------|
| 4-1 | 조회 서비스 구현 | `MenuQueryService.java` |
| 4-2 | 명령 서비스 구현 | `MenuCommandService.java` |

### Phase 5: Driving Adapter 구현 🟡
> **기존 Controller 이전 + UseCase 연결**

| 순서 | 작업 | 파일 |
|------|------|------|
| 5-1 | DTO 이동 | `request/`, `response/` 패키지 |
| 5-2 | DtoMapper 생성 | `MenuDtoMapper.java` |
| 5-3 | Controller 이전 | `MenuController.java`, `CategoryController.java` |

### Phase 6: 전환 완료 🔴
> **기존 코드 제거 — 충분한 테스트 후 진행**

| 순서 | 작업 |
|------|------|
| 6-1 | 기존 `controller/`, `service/`, `repository/`, `entity/`, `dto/` 패키지 삭제 |
| 6-2 | 전체 API 통합 테스트 |

---

## 8. MSA 분리 시 이점

Hexagonal Architecture로 전환이 완료되면, MSA 분리는 다음과 같이 간단해집니다:

```
현재 (Hexagonal Monolith)              미래 (MSA)
┌──────────────────────────┐         ┌──────────────────────────┐
│  com.new_cafe.app.backend│         │  com.new_cafe.menu       │  ← 독립 서비스
│  ├── menu/ ◀━━ 이 패키지를 ━━━━━▶  │  ├── domain/             │
│  │   ├── domain/         │         │  ├── application/         │
│  │   ├── application/    │  그대로  │  ├── adapter/             │
│  │   └── adapter/        │  추출!  │  └── config/              │
│  ├── order/ (미래)       │         └──────────────────────────┘
│  └── config/             │
└──────────────────────────┘         ┌──────────────────────────┐
                                     │  com.new_cafe.order       │  ← 독립 서비스
                                     └──────────────────────────┘
```

| 항목 | 작업량 |
|------|-------|
| 도메인/비즈니스 로직 변경 | **없음** |
| 포트(인터페이스) 변경 | **없음** |
| Driving Adapter 변경 | REST 경로 조정 정도 |
| Driven Adapter 변경 | DB 분리 시 연결 설정만 변경 |
| 신규 작업 | `build.gradle` 분리 + 서비스 간 통신 Adapter 추가 (Feign/gRPC) |

---

## 9. 기술 스택 변동 여부

| 항목 | 변경 여부 |
|------|----------|
| Spring Boot 4.0.1 | **유지** |
| Java 21 | **유지** |
| JDBC (DataSource) | **유지** → 나중에 JPA로 전환 시 Adapter만 교체 |
| PostgreSQL | **유지** |
| Lombok | **유지** (`@Data` → `@Getter` 변경 권장) |
| build.gradle | **변경 없음** (단, MSA 분리 시 멀티 모듈로 전환) |
