# NCafe 백엔드 청사진 (Blueprint) - Phase 1

> 📅 작성일: 2026-01-23
> 🎯 목표: 프론트엔드 메뉴 관리 페이지를 위한 REST API 구현

---

## 1. 기술 스택
<!-- 백엔드 개발에 사용할 핵심 기술들 -->

### 🔧 Core Framework
| 기술 | 버전 | 선정 이유 |
|------|------|----------|
| **Spring Boot** | 4.0.x | 최신 안정 버전, 생산성 | <!-- 자바로 웹서버를 쉽게 만들 수 있게 해주는 프레임워크 -->
| **Java** | 21 | LTS 버전, 최신 기능 | <!-- 장기 지원(Long Term Support) 버전으로 안정적 -->
| **Gradle** | 9.x | 빌드 도구 | <!-- 프로젝트 빌드, 의존성 관리 도구. Maven보다 빠름 -->

### 📦 주요 의존성 (추가 필요)
<!-- build.gradle에 추가해야 할 라이브러리들 -->
| 라이브러리 | 용도 | 필수 여부 |
|-----------|------|----------|
| `spring-boot-starter-data-jpa` | JPA/Hibernate ORM | ✅ 필수 | <!-- SQL 없이 자바 객체로 DB 조작 가능하게 해줌 -->
| `spring-boot-starter-validation` | 입력값 검증 | ✅ 필수 | <!-- @NotBlank, @Min 등으로 입력값 자동 검증 -->
| `h2` 또는 `mysql-connector` | 데이터베이스 | ✅ 필수 | <!-- H2: 메모리DB(개발용,앱이 실행될때만 데이터가 저장됨), MySQL: 실제 운영용 DB -->
| `lombok` | 보일러플레이트(반복적으로 발생하는 코드) 감소 | ⭕ 권장 | <!-- Getter/Setter/생성자 등 반복 코드 자동 생성 --> 

---

## 2. 디렉토리 구조
<!-- 백엔드 프로젝트의 폴더/파일 구성. 역할별로 코드를 분리하는 계층형 아키텍처 -->

```
backend/
├── src/main/java/com/new_cafe/app/backend/
│   ├── BackendApplication.java          # 앱 시작점. main() 메서드가 여기 있음
│   │
│   ├── config/                           # 설정 파일들 모음
│   │   ├── WebConfig.java                # CORS 설정 - 프론트(3000)에서 백엔드(8080) 호출 허용
│   │   └── JpaConfig.java                # JPA 설정 - DB 연결 관련 자바 설정
│   │
│   ├── controller/                       # HTTP 요청을 받는 곳 (진입점)
│   │   └── admin/                        # 🎯 Admin 전용 API
│   │       ├── MenuController.java       # 메뉴 CRUD API (/api/admin/menus)
│   │       ├── CategoryController.java   # 카테고리 CRUD API (/api/admin/categories)
│   │       └── ImageController.java      # 이미지 업로드 API (/api/admin/images)
│   │
│   ├── dto/                              # Data Transfer Object - 요청/응답 데이터 형식 정의
│   │   ├── request/                      # 클라이언트 → 서버 (요청 데이터)
│   │   │   ├── MenuCreateRequest.java    # 메뉴 생성 시 필요한 데이터
│   │   │   ├── MenuUpdateRequest.java    # 메뉴 수정 시 필요한 데이터
│   │   │   └── MenuSortOrderRequest.java # 메뉴 순서 변경 시 필요한 데이터
│   │   └── response/                     # 서버 → 클라이언트 (응답 데이터)
│   │       ├── MenuResponse.java         # 메뉴 상세 정보 응답
│   │       ├── MenuListResponse.java     # 메뉴 목록 응답 (간소화된 정보)
│   │       └── ApiResponse.java          # 모든 API의 공통 응답 형식 (success, data, message)
│   │
│   ├── entity/                           # JPA 엔티티 - DB 테이블과 1:1 매핑되는 클래스
│   │   ├── Menu.java                     # menus 테이블
│   │   ├── MenuImage.java                # menu_images 테이블 (메뉴 이미지)
│   │   ├── MenuOption.java               # menu_options 테이블 (사이즈, 샷 추가 등)
│   │   ├── OptionItem.java               # option_items 테이블 (Regular, Large 등)
│   │   └── Category.java                 # categories 테이블 (커피, 음료, 디저트 등)
│   │
│   ├── repository/                       # JPA Repository - DB CRUD 담당 (SQL 자동 생성)
│   │   ├── MenuRepository.java           # 메뉴 DB 조회/저장/삭제
│   │   ├── CategoryRepository.java       # 카테고리 DB 조회/저장/삭제
│   │   └── MenuImageRepository.java      # 이미지 DB 조회/저장/삭제
│   │
│   ├── service/                          # 비즈니스 로직 - 실제 기능 구현
│   │   ├── MenuService.java              # 메뉴 관련 로직 (생성, 수정, 품절 처리 등)
│   │   ├── CategoryService.java          # 카테고리 관련 로직
│   │   └── ImageService.java             # 이미지 업로드/삭제 로직
│   │
│   └── exception/                        # 예외(에러) 처리
│       ├── GlobalExceptionHandler.java   # 모든 예외를 잡아서 공통 형식으로 응답
│       └── MenuNotFoundException.java    # "메뉴를 찾을 수 없음" 예외
│
├── src/main/resources/
│   ├── application.properties            # 앱 설정 스프링에대한설정 (포트, DB URL, 로그 레벨 등)
│   └── data.sql                          # 초기 데이터 (개발용) - 앱 시작 시 자동 실행
│
└── build.gradle                          # 의존성 및 빌드 설정 (package.json과 비슷)
```

---

## 3. API 엔드포인트 명세
<!-- 프론트엔드에서 호출할 API 목록. RESTful 규칙을 따름 -->

### 📋 Base URL
```
개발: http://localhost:8080/api
```
<!-- 백엔드 서버 주소. 프론트엔드(3000)와 다른 포트 사용 -->

### 3.1 메뉴 API (`/api/admin/menus`)
<!-- 메뉴 CRUD + 품절/순서 변경 기능 -->

| Method | Endpoint | 설명 | 요청 | 응답 |
|--------|----------|------|------|------|
| `GET` | `/api/admin/menus` | 메뉴 목록 조회 | Query: `categoryId`, `search`, `status` | `MenuListResponse[]` | <!-- 전체 메뉴 또는 필터링된 목록 -->
| `GET` | `/api/admin/menus/{id}` | 메뉴 상세 조회 | Path: `id` | `MenuResponse` | <!-- 특정 메뉴의 모든 정보 -->
| `POST` | `/api/admin/menus` | 메뉴 등록 | Body: `MenuCreateRequest` | `MenuResponse` | <!-- 새 메뉴 생성 -->
| `PUT` | `/api/admin/menus/{id}` | 메뉴 수정 | Path: `id`, Body: `MenuUpdateRequest` | `MenuResponse` | <!-- 기존 메뉴 정보 수정 -->
| `DELETE` | `/api/admin/menus/{id}` | 메뉴 삭제 | Path: `id` | `void` | <!-- 메뉴 삭제 (연관 이미지, 옵션도 함께) -->
| `PATCH` | `/api/admin/menus/{id}/sold-out` | 품절 상태 토글 | Path: `id` | `MenuResponse` | <!-- 품절 ↔ 판매중 전환 -->
| `PATCH` | `/api/admin/menus/sort-order` | 메뉴 순서 변경 | Body: `MenuSortOrderRequest[]` | `void` | <!-- 드래그앤드롭 순서 저장 -->
put: 전체수정
path: 부분수정

### 3.2 카테고리 API (`/api/admin/categories`)
<!-- 카테고리 CRUD. 메뉴 분류용 (커피, 음료, 디저트 등) -->

| Method | Endpoint | 설명 | 요청 | 응답 |
|--------|----------|------|------|------|
| `GET` | `/api/admin/categories` | 카테고리 목록 조회 | - | `CategoryResponse[]` | <!-- 모든 카테고리 조회 -->
| `POST` | `/api/admin/categories` | 카테고리 등록 | Body: `CategoryCreateRequest` | `CategoryResponse` | <!-- 새 카테고리 생성 -->
| `PUT` | `/api/admin/categories/{id}` | 카테고리 수정 | Path: `id`, Body: `CategoryUpdateRequest` | `CategoryResponse` | <!-- 카테고리 이름/순서 수정 -->
| `DELETE` | `/api/admin/categories/{id}` | 카테고리 삭제 | Path: `id` | `void` | <!-- 카테고리 삭제 (소속 메뉴는?) -->

### 3.3 이미지 API (`/api/admin/images`)
<!-- 메뉴 이미지 업로드/삭제. 파일 저장소 관리 -->

| Method | Endpoint | 설명 | 요청 | 응답 |
|--------|----------|------|------|------|
| `POST` | `/api/admin/images` | 이미지 업로드 | Multipart: `file` | `ImageResponse` | <!-- 이미지 파일을 서버에 저장하고 URL 반환 -->
| `DELETE` | `/api/admin/images/{id}` | 이미지 삭제 | Path: `id` | `void` | <!-- 서버에서 이미지 파일 삭제 -->

---

## 4. 요청/응답 DTO 구조
<!-- 프론트엔드와 주고받는 JSON 데이터 형식 -->

### 📥 Request DTOs
<!-- 프론트엔드 → 백엔드로 보내는 데이터 -->

```java
// MenuCreateRequest.java - 메뉴 생성 시 프론트에서 보내는 데이터
{
  "korName": "아메리카노",           // 필수, 1-50자 (한글 이름)
  "engName": "Americano",           // 선택, 1-100자 (영문 이름)
  "description": "진한 에스프레소", // 선택, 0-500자 (메뉴 설명)
  "price": 4500,                    // 필수, 0 이상 (가격)
  "categoryId": "cat-001",          // 필수 (소속 카테고리)
  "imageIds": ["img-001", "img-002"], // 선택, 미리 업로드한 이미지 ID 목록
  "primaryImageId": "img-001",      // 선택, 대표 이미지 (썸네일)
  "isAvailable": true,              // 기본값: true (판매 가능 여부)
  "isSoldOut": false,               // 기본값: false (품절 여부)
  "options": [                      // 선택 (사이즈, 샷 추가 등 옵션)
    {
      "name": "사이즈",              // 옵션 그룹 이름
      "type": "radio",              // radio: 하나만 선택, checkbox: 다중 선택
      "required": true,             // true면 필수 선택
      "items": [                    // 옵션 항목들
        { "name": "Regular", "priceDelta": 0 },    // 기본 가격
        { "name": "Large", "priceDelta": 500 }     // +500원
      ]
    }
  ]
}

// MenuUpdateRequest.java
// MenuCreateRequest와 동일 구조 (수정할 때도 같은 형식)

// MenuSortOrderRequest.java - 메뉴 순서 변경용
{
  "id": "menu-001",    // 메뉴 ID
  "sortOrder": 1       // 새로운 순서 (1부터 시작)
}

// CategoryCreateRequest.java - 카테고리 생성용
{
  "korName": "커피",    // 한글 이름
  "engName": "Coffee",  // 영문 이름
  "icon": "coffee",     // 아이콘 이름 (lucide-react 아이콘)
  "sortOrder": 1        // 표시 순서
}
```

### 📤 Response DTOs
<!-- 백엔드 → 프론트엔드로 보내는 데이터 -->

```java
// MenuResponse.java (상세 조회용) - 메뉴 전체 정보
{
  "id": "menu-001",
  "korName": "아메리카노",
  "engName": "Americano",
  "description": "진한 에스프레소와 물의 조화",
  "price": 4500,
  "category": {                      // 카테고리 정보 (JOIN)
    "id": "cat-001",
    "korName": "커피",
    "engName": "Coffee"
  },
  "images": [                        // 이미지 목록
    {
      "id": "img-001",
      "url": "/images/menu/americano.jpg",  // 이미지 접근 URL
      "isPrimary": true,             // 대표 이미지 여부
      "sortOrder": 1
    }
  ],
  "isAvailable": true,
  "isSoldOut": false,
  "sortOrder": 1,
  "options": [                       // 옵션 목록
    {
      "id": "opt-001",
      "name": "사이즈",
      "type": "radio",
      "required": true,
      "items": [
        { "id": "item-001", "name": "Regular", "priceDelta": 0 },
        { "id": "item-002", "name": "Large", "priceDelta": 500 }
      ]
    }
  ],
  "createdAt": "2026-01-22T10:00:00",  // 생성일시
  "updatedAt": "2026-01-22T10:00:00"   // 수정일시
}

// MenuListResponse.java (목록 조회용 - 간소화) - 리스트에서 빠른 로딩용
{
  "id": "menu-001",
  "korName": "아메리카노",
  "engName": "Americano",
  "price": 4500,
  "categoryId": "cat-001",
  "primaryImageUrl": "/images/menu/americano.jpg",  // 대표 이미지 URL만
  "isAvailable": true,
  "isSoldOut": false,
  "sortOrder": 1
  // options, images 상세 정보는 상세 조회에서만
}

// CategoryResponse.java - 카테고리 정보
{
  "id": "cat-001",
  "korName": "커피",
  "engName": "Coffee",
  "icon": "coffee",
  "sortOrder": 1,
  "menuCount": 5     // 해당 카테고리의 메뉴 개수 (통계용)
}

// ImageResponse.java - 이미지 업로드 결과
{
  "id": "img-001",
  "url": "/images/menu/uploaded-image.jpg",  // 접근 가능한 URL
  "originalName": "americano.jpg",           // 원본 파일명
  "size": 102400                             // 파일 크기 (bytes)
}

// ApiResponse.java (공통 래퍼) - 모든 API 응답을 감싸는 형식
{
  "success": true,          // 성공 여부
  "data": { ... },          // 실제 데이터
  "message": "성공",         // 사용자에게 보여줄 메시지
  "timestamp": "2026-01-22T10:00:00"  // 응답 시간
}
```

---

## 5. 엔티티 설계
<!-- 데이터베이스 테이블 구조. 엔티티 = 테이블 -->

### 📊 ERD 개요
<!-- Entity Relationship Diagram - 테이블 간의 관계도 -->

```
┌─────────────────┐       ┌─────────────────┐
│    Category     │       │      Menu       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │   # PK = Primary Key (기본키, 고유 식별자)
│ korName         │  │    │ korName         │
│ engName         │  │    │ engName         │
│ icon            │  └───▶│ category_id(FK) │   # FK = Foreign Key (외래키, 다른 테이블 참조)
│ sortOrder       │       │ description     │   # 1:N 관계 - 1개 카테고리에 N개 메뉴
│ createdAt       │       │ price           │
│ updatedAt       │       │ isAvailable     │
└─────────────────┘       │ isSoldOut       │   # sortOrder: dnd기능때문에 필요함 (1조가 얘기함) 없으면 특정필터로만 정렬가능 내맘대로 불가능
                          │ sortOrder       │
                          │ createdAt       │
                          │ updatedAt       │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
┌─────────────────┐   ┌─────────────────┐
│   MenuImage     │   │   MenuOption    │                     # 1:N 관계 - 1개 메뉴에 여러 이미지/옵션
├─────────────────┤   ├─────────────────┤
│ id (PK)         │   │ id (PK)         │
│ menu_id (FK)    │   │ menu_id (FK)    │
│ url             │   │ name            │
│ isPrimary       │   │ type            │                     # radio (단일선택) / checkbox (다중선택)
│ sortOrder       │   │ required        │                     # true면 필수 선택
└─────────────────┘   │ sortOrder       │
                      └────────┬────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │   OptionItem    │                     # 1:N 관계 - 1개 옵션에 여러 항목
                      ├─────────────────┤                     # 예: 사이즈 옵션 → Regular, Large
                      │ id (PK)         │
                      │ option_id (FK)  │
                      │ name            │
                      │ priceDelta      │                     # 가격 증감량 (0, +500, -1000 등)
                      │ sortOrder       │
                      └─────────────────┘
```

---

## 6. Phase 1 백엔드 개발 범위
<!-- 이번 단계에서 구현할 기능들의 체크리스트 -->

> **📋 체크리스트 사용 안내 (AI 필독)**
> - 아래 `- [ ]` 항목은 **구현 진행 상황**을 추적하는 체크리스트입니다.
> - **기능 구현이 완료되면** AI가 해당 항목을 `- [x]`로 체크해주세요.

### 🎯 백엔드 API 구현

#### 6.1 프로젝트 설정
<!-- 맨 처음 해야 할 기본 설정들 -->
- [ ] build.gradle 의존성 추가 (JPA, Validation, H2/MySQL, Lombok)  <!-- 필요한 라이브러리 설치 -->
- [ ] application.properties 설정 (DB, JPA, 파일 업로드)  <!-- 앱 설정 파일 작성 -->
- [ ] CORS 설정 (WebConfig)  <!-- 프론트(3000) → 백엔드(8080) 호출 허용 -->
- [ ] 전역 예외 처리 (GlobalExceptionHandler)  <!-- 에러 발생 시 공통 형식으로 응답 -->

#### 6.2 엔티티 구현
<!-- DB 테이블과 매핑되는 자바 클래스들 -->
- [ ] Category 엔티티  <!-- categories 테이블 -->
- [ ] Menu 엔티티 (Category 연관관계)  <!-- menus 테이블, @ManyToOne -->
- [ ] MenuImage 엔티티 (Menu 연관관계)  <!-- menu_images 테이블 -->
- [ ] MenuOption 엔티티 (Menu 연관관계)  <!-- menu_options 테이블 -->
- [ ] OptionItem 엔티티 (MenuOption 연관관계)  <!-- option_items 테이블 -->

#### 6.3 Repository 구현
<!-- DB CRUD 담당. JpaRepository 상속하면 기본 CRUD 자동 생성 -->
- [ ] CategoryRepository
- [ ] MenuRepository (검색, 필터링 쿼리 메서드)  <!-- findByCategory, searchByName 등 -->
- [ ] MenuImageRepository

#### 6.4 DTO 구현
<!-- 엔티티를 직접 노출하지 않고 DTO로 변환하여 응답 -->
- [ ] Request DTOs (MenuCreateRequest, MenuUpdateRequest 등)  <!-- 요청 데이터 검증 포함 -->
- [ ] Response DTOs (MenuResponse, MenuListResponse 등)  <!-- 필요한 정보만 선별 -->
- [ ] ApiResponse 공통 래퍼  <!-- 일관된 응답 형식  (성공,실패,데이터저장성공) -->

#### 6.5 Service 구현
<!-- 비즈니스 로직. Controller → Service → Repository 호출 구조 -->
- [ ] CategoryService (CRUD)
- [ ] MenuService (CRUD, 품절 토글, 순서 변경)
- [ ] ImageService (업로드, 삭제)  <!-- 파일 저장/삭제 + DB 기록 -->

#### 6.6 Controller 구현
<!-- HTTP 요청 처리. URL 매핑 + Service 호출 + 응답 반환 -->
- [ ] CategoryController (카테고리 CRUD)
- [ ] MenuController (메뉴 CRUD, 품절 토글, 순서 변경)
- [ ] ImageController (이미지 업로드/삭제)

#### 6.7 초기 데이터
- [ ] data.sql 작성 (카테고리, 샘플 메뉴)  <!-- 개발 편의를 위한 테스트 데이터 -->

---

## 7. 개발 순서
<!-- 의존성 순서대로 개발. 먼저 만들어야 할 것부터 -->

```
Step 1: 프로젝트 설정           # 먼저 프로젝트 기본 틀 완성
├── build.gradle 의존성 추가    # 라이브러리 설치
├── application.properties 설정 # DB 연결 설정
├── WebConfig (CORS)            # 프론트 연동 허용
└── GlobalExceptionHandler      # 에러 처리
                                 
Step 2: 엔티티 & Repository      # DB 구조 설계
├── Category 엔티티 + Repository # 카테고리 먼저 (Menu가 참조하므로)
├── Menu 엔티티 + Repository     # 메뉴 (핵심 엔티티)
├── MenuImage 엔티티 + Repository
├── MenuOption + OptionItem 엔티티
└── 연관관계 매핑                # @OneToMany, @ManyToOne 설정 (데이터 맵핑을 해줌)

Step 3: DTO 구현                 # API 입출력 형식 정의
├── Request DTOs                 # 요청 데이터 + 검증 규칙
├── Response DTOs                # 응답 데이터 형식
└── ApiResponse 래퍼             # 공통 응답 포맷

Step 4: 카테고리 API             # 간단한 CRUD부터 시작
├── CategoryService
├── CategoryController
└── 테스트                       # Postman 또는 curl로 테스트

Step 5: 메뉴 API                 # 핵심 기능
├── MenuService
├── MenuController
├── 검색/필터링                  # ?categoryId=1&search=아메
├── 품절 토글                    # PATCH /menus/{id}/sold-out
├── 순서 변경                    # PATCH /menus/sort-order
└── 테스트

Step 6: 이미지 API               # 파일 업로드는 복잡하므로 나중에
├── ImageService
├── ImageController
├── 파일 저장 로직               # 로컬 저장소 또는 S3
└── 테스트

Step 7: 초기 데이터 & 통합 테스트
├── data.sql 작성                # 샘플 데이터
├── 프론트엔드 연동 테스트       # 실제 프론트에서 호출
└── API 문서화 (선택)            # Swagger 또는 수동 문서
```

---

## 8. 실행 명령어
<!-- 자주 사용하는 Gradle 명령어 -->

```bash
# 개발 서버 실행 - 앱을 시작하고 API 테스트 가능
cd backend
./gradlew bootRun

# 빌드 - JAR 파일 생성 (배포용)
./gradlew build

# 테스트 - 단위/통합 테스트 실행
./gradlew test

# clean 빌드 - 이전 빌드 결과물 삭제 후 새로 빌드
./gradlew clean build
```

---

## ✅ 승인 체크리스트
<!-- 개발 시작 전 확인사항 -->

아래 항목을 확인해주세요:

- [ ] Spring Boot 4.0 + Java 21 사용 동의
- [ ] JPA + H2(개발)/MySQL(운영) 데이터베이스 동의
- [ ] RESTful API 설계 동의
- [ ] 엔티티 구조 동의
- [ ] Phase 1 백엔드 개발 범위 동의

> 💬 수정이 필요한 부분이 있으면 알려주세요!
