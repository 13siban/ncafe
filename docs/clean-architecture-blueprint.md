# NCafe 메뉴 관리 시스템 — Clean Architecture 전환 청사진

> 작성일: 2026-02-13  
> 대상 프로젝트: `ncafe/backend` (Spring Boot 4.0.1 + Java 21 + PostgreSQL + JDBC)

---

## 1. 현재 아키텍처 분석 (AS-IS)

### 1.1 현재 패키지 구조

```
com.new_cafe.app.backend/
├── BackendApplication.java
├── config/
│   └── WebConfig.java                    # CORS 설정
├── filter/
│   ├── LogFilter.java
│   └── TestFilter.java
├── controller/
│   ├── HomeController.java
│   └── admin/
│       ├── MenuController.java           # REST API (/admin/menus)
│       └── CategoryController.java       # REST API (/admin/categories)
├── dto/
│   ├── MenuListRequest.java
│   ├── MenuListResponse.java
│   ├── MenuResponse.java
│   ├── MenuDetailResponse.java
│   ├── MenuCreateRequest.java / Response
│   ├── MenuUpdateRequest.java / Response
│   ├── MenuImageResponse.java
│   ├── MenuImageListResponse.java
│   └── CategoryResponse.java
├── entity/
│   ├── Menu.java                         # id, korName, engName, description, price, categoryId, isAvailable, ...
│   ├── Category.java                     # id, name, icon, sortOrder
│   └── MenuImage.java                    # id, menuId, srcUrl, sortOrder
├── service/
│   ├── MenuService.java (interface)
│   ├── NewMenuService.java (impl)        # 핵심 비즈니스 로직
│   ├── CategoryService.java (interface)
│   └── NewCategoryService.java (impl)
└── repository/
    ├── MenuRepository.java (interface)
    ├── NewMenuRepository.java (impl)     # JDBC 직접 구현
    ├── CategoryRepository.java (interface)
    ├── NewCategoryRepository.java (impl) # JDBC 직접 구현
    ├── MenuImageRepository.java (interface)
    └── NewMenuImageRepository.java (impl)# JDBC 직접 구현
```

### 1.2 현재 의존성 흐름

```
Controller → Service(interface) → Repository(interface)
                ↓                       ↓
           NewMenuService          NewMenuRepository
           (DTO 변환 + 비즈니스 로직)  (JDBC DataSource 직접 사용)
```

### 1.3 현재 구조의 문제점

| 문제 | 설명 |
|------|------|
| **레이어 책임 혼재** | `NewMenuService`에 DTO 변환, 비즈니스 로직, 다중 Repository 조합이 모두 섞여 있음 |
| **도메인 빈약** | `Menu`, `Category`, `MenuImage`가 순수 데이터 홀더(Anemic Domain Model)이며 행위가 없음 |
| **DTO가 서비스에 직접 사용** | Service가 Controller용 DTO(`MenuListResponse` 등)를 직접 반환하여 계층 간 결합 |
| **Repository에 DTO 반환** | `CategoryRepository.findAllWithMenuCount()`가 `CategoryResponse` DTO를 직접 반환 |
| **SQL Injection 취약** | `NewMenuRepository.findAllByCategoryAndSearchQuery()`에서 문자열 연결로 SQL 생성 |
| **Create/Update 미구현** | `createMenu()`, `updateMenu()`, `deleteMenu()`가 비어 있음 |

---

## 2. Clean Architecture 목표 구조 (TO-BE)

### 2.1 핵심 원칙

```
                    ┌──────────────────────────────┐
                    │      Framework & Drivers      │  ← Spring, JDBC, Web
                    │  ┌────────────────────────┐   │
                    │  │    Interface Adapters    │  │  ← Controller, Repository Impl, DTO
                    │  │  ┌──────────────────┐   │  │
                    │  │  │  Application      │   │  │  ← Use Cases (서비스)
                    │  │  │  ┌────────────┐   │   │  │
                    │  │  │  │  Domain     │   │   │  │  ← Entity, Value Object, Port
                    │  │  │  └────────────┘   │   │  │
                    │  │  └──────────────────┘   │  │
                    │  └────────────────────────┘   │
                    └──────────────────────────────┘

의존성 방향: 바깥 → 안쪽 (Domain은 아무것에도 의존하지 않음)
```

### 2.2 새로운 패키지 구조

```
com.new_cafe.app.backend/
├── BackendApplication.java
│
├── domain/                                    ⬅ 【핵심 도메인 레이어】
│   ├── model/                                 # 도메인 엔티티 (순수 POJO)
│   │   ├── Menu.java                          # 비즈니스 로직 포함
│   │   ├── Category.java
│   │   └── MenuImage.java
│   └── port/                                  # 포트 (인터페이스)
│       ├── in/                                # Inbound Port (Use Case)
│       │   ├── GetMenuUseCase.java
│       │   ├── GetMenuListUseCase.java
│       │   ├── CreateMenuUseCase.java
│       │   ├── UpdateMenuUseCase.java
│       │   ├── DeleteMenuUseCase.java
│       │   ├── GetMenuImagesUseCase.java
│       │   ├── GetCategoryListUseCase.java
│       │   └── GetCategoryUseCase.java
│       └── out/                               # Outbound Port (Repository 추상화)
│           ├── MenuRepositoryPort.java
│           ├── CategoryRepositoryPort.java
│           └── MenuImageRepositoryPort.java
│
├── application/                               ⬅ 【애플리케이션 레이어】
│   └── service/                               # Use Case 구현 (비즈니스 흐름 조합)
│       ├── MenuQueryService.java              # 메뉴 조회 관련 (getMenus, getMenu, getImages)
│       ├── MenuCommandService.java            # 메뉴 생성/수정/삭제
│       └── CategoryQueryService.java          # 카테고리 조회 관련
│
├── adapter/                                   ⬅ 【어댑터 레이어】
│   ├── in/                                    # Inbound Adapter (웹)
│   │   └── web/
│   │       ├── MenuController.java            # REST Controller
│   │       ├── CategoryController.java        # REST Controller
│   │       └── dto/                           # 웹 요청/응답 DTO
│   │           ├── request/
│   │           │   ├── MenuListRequest.java
│   │           │   ├── MenuCreateRequest.java
│   │           │   └── MenuUpdateRequest.java
│   │           └── response/
│   │               ├── MenuResponse.java
│   │               ├── MenuListResponse.java
│   │               ├── MenuDetailResponse.java
│   │               ├── MenuImageResponse.java
│   │               ├── MenuImageListResponse.java
│   │               ├── CategoryResponse.java
│   │               ├── MenuCreateResponse.java
│   │               └── MenuUpdateResponse.java
│   └── out/                                   # Outbound Adapter (영속성)
│       └── persistence/
│           ├── JdbcMenuRepository.java        # MenuRepositoryPort 구현
│           ├── JdbcCategoryRepository.java    # CategoryRepositoryPort 구현
│           ├── JdbcMenuImageRepository.java   # MenuImageRepositoryPort 구현
│           └── mapper/
│               ├── MenuRowMapper.java         # ResultSet → Menu 변환 (중복 제거)
│               ├── CategoryRowMapper.java
│               └── MenuImageRowMapper.java
│
└── config/                                    ⬅ 【설정 레이어】
    └── WebConfig.java                         # CORS 등 Spring 설정
```

---

## 3. 상세 설계

### 3.1 Domain Layer (도메인 레이어)

#### `domain/model/Menu.java`
```java
// 순수 POJO — Spring 의존성 없음, Lombok만 허용
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

    // ✅ 도메인 비즈니스 로직 (예시)
    public boolean canOrder() {
        return isAvailable != null && isAvailable && (isSoldOut == null || !isSoldOut);
    }

    public void markAsSoldOut() {
        this.isSoldOut = true;
    }
    
    public void updateInfo(String korName, String engName, String description, Integer price) {
        this.korName = korName;
        this.engName = engName;
        this.description = description;
        this.price = price;
        this.updatedAt = LocalDateTime.now();
    }
}
```

#### `domain/port/out/MenuRepositoryPort.java`
```java
// Outbound Port — 도메인이 정의하는 Repository 계약
public interface MenuRepositoryPort {
    List<Menu> findAll();
    List<Menu> findAllByCategoryId(Long categoryId);
    List<Menu> findAllByCategoryAndSearchQuery(Long categoryId, String searchQuery);
    Menu findById(Long id);
    Menu save(Menu menu);         // ✅ CREATE/UPDATE 통합
    void deleteById(Long id);     // ✅ DELETE 추가
}
```

#### `domain/port/in/GetMenuListUseCase.java`
```java
// Inbound Port — Controller가 의존하는 Use Case 인터페이스
public interface GetMenuListUseCase {
    MenuListResult execute(Long categoryId, String searchQuery);

    // Use Case 전용 결과 객체 (DTO와 분리)
    @Data @Builder
    class MenuListResult {
        private List<MenuResult> menus;
        private int total;
    }

    @Data @Builder
    class MenuResult {
        private Long id;
        private String korName;
        private String engName;
        private String description;
        private Integer price;
        private String categoryName;
        private String imageSrc;
        private Boolean isAvailable;
        private Boolean isSoldOut;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
```

### 3.2 Application Layer (애플리케이션 레이어)

#### `application/service/MenuQueryService.java`
```java
@Service
public class MenuQueryService implements GetMenuListUseCase, GetMenuUseCase, GetMenuImagesUseCase {

    private final MenuRepositoryPort menuRepository;        // Port 의존
    private final CategoryRepositoryPort categoryRepository;
    private final MenuImageRepositoryPort menuImageRepository;

    // constructor injection

    @Override
    public MenuListResult execute(Long categoryId, String searchQuery) {
        List<Menu> menus = menuRepository.findAllByCategoryAndSearchQuery(categoryId, searchQuery);

        List<MenuResult> results = menus.stream()
            .map(menu -> {
                Category category = categoryRepository.findById(menu.getCategoryId());
                List<MenuImage> images = menuImageRepository.findAllByMenuId(menu.getId());
                
                return MenuResult.builder()
                    .id(menu.getId())
                    .korName(menu.getKorName())
                    // ... 매핑
                    .build();
            })
            .toList();

        return MenuListResult.builder()
            .menus(results)
            .total(menus.size())
            .build();
    }
}
```

### 3.3 Adapter Layer (어댑터 레이어)

#### `adapter/in/web/MenuController.java`
```java
@RestController
@RequestMapping("/admin/menus")
public class MenuController {

    private final GetMenuListUseCase getMenuListUseCase;   // Port 의존
    private final GetMenuUseCase getMenuUseCase;
    // ...

    @GetMapping
    public MenuListResponse getMenus(MenuListRequest request) {
        // 1. Use Case 호출
        var result = getMenuListUseCase.execute(
            request.getCategoryId(), 
            request.getSearchQuery()
        );
        // 2. Use Case 결과 → Web DTO 변환
        return MenuListResponse.from(result);
    }
}
```

#### `adapter/out/persistence/JdbcMenuRepository.java`
```java
@Repository
public class JdbcMenuRepository implements MenuRepositoryPort {

    private final DataSource dataSource;

    @Override
    public List<Menu> findAllByCategoryAndSearchQuery(Long categoryId, String searchQuery) {
        // ✅ PreparedStatement 파라미터 바인딩으로 SQL Injection 방지
        // ✅ MenuRowMapper를 사용하여 중복 코드 제거
    }

    @Override
    public Menu save(Menu menu) {
        // ✅ id가 null이면 INSERT, 있으면 UPDATE
    }

    @Override
    public void deleteById(Long id) {
        // ✅ DELETE 구현
    }
}
```

---

## 4. 파일 매핑 (AS-IS → TO-BE)

| 현재 파일 | 변경 후 위치 | 변경 사항 |
|-----------|-------------|----------|
| `entity/Menu.java` | `domain/model/Menu.java` | 비즈니스 메서드 추가 |
| `entity/Category.java` | `domain/model/Category.java` | 이동 |
| `entity/MenuImage.java` | `domain/model/MenuImage.java` | 이동 |
| `service/MenuService.java` | `domain/port/in/` (여러 UseCase) | **분리**: 단일 인터페이스 → 기능별 UseCase 인터페이스 |
| `service/NewMenuService.java` | `application/service/MenuQueryService.java` + `MenuCommandService.java` | **분리**: 조회/명령 분리 |
| `service/CategoryService.java` | `domain/port/in/` (UseCase) | 분리 |
| `service/NewCategoryService.java` | `application/service/CategoryQueryService.java` | 이동 |
| `repository/MenuRepository.java` | `domain/port/out/MenuRepositoryPort.java` | `save()`, `deleteById()` 추가 |
| `repository/NewMenuRepository.java` | `adapter/out/persistence/JdbcMenuRepository.java` | SQL Injection 수정, RowMapper 분리 |
| `repository/CategoryRepository.java` | `domain/port/out/CategoryRepositoryPort.java` | DTO 반환 → Entity 반환으로 변경 |
| `repository/NewCategoryRepository.java` | `adapter/out/persistence/JdbcCategoryRepository.java` | Entity 반환으로 변경 |
| `repository/MenuImageRepository.java` | `domain/port/out/MenuImageRepositoryPort.java` | 이동 |
| `repository/NewMenuImageRepository.java` | `adapter/out/persistence/JdbcMenuImageRepository.java` | RowMapper 분리 |
| `controller/admin/MenuController.java` | `adapter/in/web/MenuController.java` | UseCase 의존으로 변경 |
| `controller/admin/CategoryController.java` | `adapter/in/web/CategoryController.java` | UseCase 의존으로 변경 |
| `dto/*.java` | `adapter/in/web/dto/request/` & `response/` | 패키지 분리 |
| `config/WebConfig.java` | `config/WebConfig.java` | 유지 |
| `filter/*.java` | `config/filter/` 또는 유지 | 유지 |

---

## 5. 의존성 흐름 (TO-BE)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADAPTER (IN)                             │
│  MenuController ──uses──▶ GetMenuListUseCase (Port/Interface)   │
│  CategoryController     ▶ GetCategoryListUseCase                │
└────────────────────────────┬────────────────────────────────────┘
                             │  (의존)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION                                 │
│  MenuQueryService ──implements──▶ GetMenuListUseCase            │
│                   ──uses──▶ MenuRepositoryPort (Port/Interface) │
│                   ──uses──▶ CategoryRepositoryPort              │
│                   ──uses──▶ MenuImageRepositoryPort             │
└────────────────────────────┬────────────────────────────────────┘
                             │  (의존)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DOMAIN                                   │
│  Menu, Category, MenuImage  (순수 도메인 모델)                   │
│  MenuRepositoryPort         (Outbound Port Interface)           │
│  GetMenuListUseCase         (Inbound Port Interface)            │
│  ※ 프레임워크 의존성 없음 (Spring, JDBC 등)                      │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │  (의존 역전, implements)
┌─────────────────────────────────────────────────────────────────┐
│                      ADAPTER (OUT)                              │
│  JdbcMenuRepository ──implements──▶ MenuRepositoryPort          │
│  JdbcCategoryRepository          ▶ CategoryRepositoryPort       │
│  JdbcMenuImageRepository        ▶ MenuImageRepositoryPort       │
│  ※ DataSource, JDBC 의존                                       │
└─────────────────────────────────────────────────────────────────┘
```

> **핵심**: Domain 레이어는 어떤 외부 기술에도 의존하지 않으며, Adapter가 Domain의 Port를 구현합니다.

---

## 6. 마이그레이션 순서 (단계별)

### Phase 1: Domain 레이어 생성 🟢 (안전, 기존 코드 영향 없음)
1. `domain/model/` 패키지 생성 → 기존 Entity 복사 & 도메인 로직 추가
2. `domain/port/out/` 패키지 생성 → Repository Port 인터페이스 정의
3. `domain/port/in/` 패키지 생성 → Use Case 인터페이스 정의

### Phase 2: Application 레이어 생성 🟡 (기존 Service를 참고하여 새로 작성)
1. `application/service/MenuQueryService.java` 생성 (기존 NewMenuService 로직 이전)
2. `application/service/MenuCommandService.java` 생성 (create/update/delete 구현)
3. `application/service/CategoryQueryService.java` 생성

### Phase 3: Adapter 레이어 생성 🟡 (기존 코드 이동 + 개선)
1. `adapter/out/persistence/` — 기존 Repository 이동 + RowMapper 분리 + SQL Injection 수정
2. `adapter/in/web/` — 기존 Controller 이동 + UseCase 의존으로 변경
3. `adapter/in/web/dto/` — 기존 DTO 이동 + request/response 분리

### Phase 4: 기존 코드 제거 🔴 (모든 테스트 통과 후)
1. 기존 `controller/`, `service/`, `repository/`, `entity/`, `dto/` 패키지 삭제
2. 최종 통합 테스트

---

## 7. 추가 개선 사항 (선택)

| 항목 | 설명 | 우선순위 |
|------|------|---------|
| **SQL Injection 수정** | `findAllByCategoryAndSearchQuery()`에서 문자열 연결 → PreparedStatement 바인딩 | 🔴 높음 |
| **Create/Update/Delete 구현** | 현재 미구현 상태인 CUD 완성 | 🟡 중간 |
| **RowMapper 분리** | ResultSet → Entity 변환 코드가 각 Repository에 5번 이상 중복 | 🟡 중간 |
| **예외 처리 체계** | `domain/exception/` 패키지에 도메인 예외 클래스 정의 | 🟢 낮음 |
| **단위 테스트** | UseCase별 단위 테스트 작성 (Mock Repository 사용) | 🟢 낮음 |

---

## 8. 기술 스택 변동 여부

| 항목 | 변경 여부 |
|------|----------|
| Spring Boot 4.0.1 | **유지** |
| Java 21 | **유지** |
| JDBC (DataSource) | **유지** (JPA 전환 시 Adapter만 교체하면 됨) |
| PostgreSQL | **유지** |
| Lombok | **유지** |
| build.gradle | **변경 없음** |

> ✅ **Clean Architecture의 장점**: 나중에 JDBC → JPA/MyBatis로 전환할 때, 
> `adapter/out/persistence/` 패키지의 구현체만 교체하면 됩니다.
> Domain, Application, Controller 코드는 전혀 수정할 필요가 없습니다.
