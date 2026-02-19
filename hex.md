
지윤
```
menu/
├── adapter/                           # [외부 연동 어댑터 계층]
│   ├── in/web/                        # 인바운드 (Web 진입점)
│   │   ├── admin/                     # [관리자 전용 API]
│   │   │   ├── AdminCategoryController.java
│   │   │   └── AdminMenuController.java
│   │   └── user/                      # [전시/일반 사용자용 API]
│   │       ├── CategoryController.java
│   │       └── MenuController.java
│   └── out/persistence/               # 아웃바운드 (DB 연동)
│       ├── CategoryPersistenceAdapter.java
│       ├── MenuImagePersistenceAdapter.java
│       └── MenuPersistenceAdapter.java
│
├── application/                       # [비즈니스 로직 계층]
│   ├── port/                          # 인터페이스 (포트)
│   │   ├── in/                        # 인바운드 포트 & DTO
│   │   │   ├── AdminMenuUseCase.java  # 관리자 전용 유스케이스 포트
│   │   │   ├── CategoryUseCase.java
│   │   │   ├── ViewMenuUseCase.java   # 사용자 전용 유스케이스 포트 (Read-Only)
│   │   │   └── dto/                   # 계층간 데이터 운반 객체(DTO)
│   │   └── out/                       # 아웃바운드 포트
│   │       ├── CategoryRepositoryPort.java
│   │       ├── MenuImageRepositoryPort.java
│   │       └── MenuRepositoryPort.java
│   └── service/                       # 유스케이스 구현체
│       ├── CategoryService.java
│       └── MenuService.java
│
└── domain/                            # [순수 핵심 도메인 계층]
    └── model/                         # 비즈니스 엔티티 (POJO)
        ├── Category.java
        ├── Menu.java
        └── MenuImage.java
```

영일

```
menu/
├── adapter/                      # 외부 영역 (Technical Details)
│   ├── in/                       # 인바운드 어댑터 (Primary Adapters)
│   │   └── web/                  
│   │       ├── MenuController.java         <-- (기존 controller/admin/MenuController.java)
│   │       └── dto/                        <-- (기존 dto/ 하위 Menu 관련 파일들)
│   │           ├── request/
│   │           │   ├── MenuCreateRequest.java
│   │           │   └── MenuUpdateRequest.java
│   │           └── response/
│   │               ├── MenuResponse.java
│   │               └── MenuDetailResponse.java
│   └── out/                      # 아웃바운드 어댑터 (Secondary Adapters)
│       └── persistence/          
│           ├── MenuPersistenceAdapter.java <-- (포트 구현체: DB 영속성 처리 로직)
│           ├── JpaMenuRepository.java      <-- (기존 repository/MenuRepository.java)
│           ├── MenuEntity.java             <-- (기존 entity/Menu.java - JPA 엔티티)
│           └── MenuImageEntity.java        <-- (기존 entity/MenuImage.java)
│
├── application/                  # 응용 영역 (Orchestration)
│   ├── port/                     
│   │   ├── in/                   # 인바운드 포트 (Use Case Interfaces)
│   │   │   └── MenuUseCase.java          
│   │   └── out/                  # 아웃바운드 포트 (Repository Interfaces)
│   │       └── MenuRepositoryPort.java     
│   └── service/                  # 유스케이스 구현 (Application Services)
│       └── MenuService.java                <-- (기존 service/MenuService.java)
│
└── domain/                       # 도메인 모델 영역 (Pure Business Logic)
    ├── model/                    
    │   ├── Menu.java             # (데이터베이스와 분리된 순수 도메인 모델)
    │   └── MenuImage.java        
    └── exception/                
        └── MenuNotFoundException.java
```

단희
```
com.new_cafe.app.backend.menu
├── domain (중심부: 비즈니스 규칙)
│   ├── Menu.java        <- 순수 POJO
│   └── Category.java    <- 순수 POJO
├── application (중간: 핵심 로직 및 통로)
│   ├── port
│   │   ├── in           <- Web에서 들어오는 인터페이스 (GetMenuUseCase)
│   │   └── out          <- DB로 나가는 인터페이스 (LoadMenuPort)
│   └── service          <- 비즈니스 로직 구현체 (MenuService)
└── adapter (외부: 기술 구현)
    ├── in.web           <- API 컨트롤러 및 Web DTO (MenuWebAdapter, MenuWebResponse)
    └── out.persistence  <- DB 연동 (MenuJpaEntity, MenuPersistenceAdapter, Mapper)