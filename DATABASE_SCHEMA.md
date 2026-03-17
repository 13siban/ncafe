# 🗄️ NCafe 데이터베이스 스키마

> **DBMS: PostgreSQL**  
> JPA Entity 기반으로 정리한 전체 테이블 구조입니다.

---

## 📖 목차

1. [ER 다이어그램 (관계도)](#1-er-다이어그램-관계도)
2. [테이블 요약](#2-테이블-요약)
3. [회원 & 인증](#3-회원--인증)
4. [메뉴 & 카테고리](#4-메뉴--카테고리)
5. [옵션 시스템](#5-옵션-시스템)
6. [주문 & 결제](#6-주문--결제)
7. [매출 통계](#7-매출-통계)
8. [매장 & 공지](#8-매장--공지)
9. [등급 시스템](#9-등급-시스템)
10. [즐겨찾기](#10-즐겨찾기)
11. [갤러리](#11-갤러리)

---

## 1. ER 다이어그램 (관계도)

```
┌─────────────┐       ┌──────────────┐       ┌───────────────────────┐
│   users     │       │  categories  │       │    option_groups      │
│─────────────│       │──────────────│       │───────────────────────│
│ id (PK)     │       │ id (PK)      │       │ id (PK)              │
│ username    │       │ name         │       │ name                 │
│ nickname    │       │ sort_order   │       │ type (radio/checkbox) │
│ email       │       └──────┬───────┘       │ is_required          │
│ password    │              │               └──────────┬────────────┘
│ role        │              │                          │
│ grade       │        ┌─────┴──────┐            ┌──────┴──────┐
│ point_balance│       │   menus    │            │ option_items│
│ ...         │       │────────────│            │─────────────│
└──────┬──────┘       │ id (PK)    │            │ id (PK)     │
       │              │ kor_name   │            │ option_group_id (FK) │
       │              │ eng_name   │            │ name        │
       │              │ price      │            │ price_delta │
       │              │ category_id (FK)│       └─────────────┘
       │              │ ...        │
       │              └──────┬─────┘       ┌──────────────────────────┐
       │                     │             │ category_option_group_map│
       │              ┌──────┴──────┐      │──────────────────────────│
       │              │ menu_images │      │ category_id (FK)         │
       │              │─────────────│      │ option_group_id (FK)     │
       │              │ menu_id (FK)│      └──────────────────────────┘
       │              │ src_url     │
       │              └─────────────┘      ┌──────────────────────────┐
       │                                   │ menu_option_exclusion    │
       │                                   │──────────────────────────│
       │                                   │ menu_id (FK)             │
       │                                   │ option_group_id (FK)     │
       │                                   └──────────────────────────┘
       │
  ┌────┴──────────┐
  │    orders     │
  │───────────────│
  │ id (PK)       │
  │ user_id (FK)  │──── nullable (비회원=null)
  │ order_date    │
  │ order_number  │──── UNIQUE(order_date, order_number)
  │ total_price   │
  │ payment_id    │
  │ ...           │
  └────┬──────────┘
       │
  ┌────┴───────────┐
  │  order_items   │
  │────────────────│
  │ order_id (FK)  │
  │ menu_id (FK)   │
  │ quantity       │
  │ subtotal       │
  └────┬───────────┘
       │
  ┌────┴───────────────────┐
  │ order_option_selections│
  │────────────────────────│
  │ order_item_id (FK)     │
  │ option_group_name      │
  │ option_item_name       │
  │ price_delta            │
  └────────────────────────┘
```

---

## 2. 테이블 요약

| # | 테이블명 | 설명 | 모듈 |
|---|---------|------|------|
| 1 | `users` | 회원 정보 (인증, 등급, 포인트) | auth |
| 2 | `user_points` | 포인트 적립/사용 내역 | auth |
| 3 | `menus` | 메뉴 기본 정보 | menu |
| 4 | `menu_images` | 메뉴 이미지 | menu |
| 5 | `categories` | 메뉴 카테고리 | category |
| 6 | `option_groups` | 옵션 그룹 (사이즈, 샷 추가 등) | menuoption |
| 7 | `option_items` | 옵션 항목 (Tall, Grande 등) | menuoption |
| 8 | `category_option_group_map` | 카테고리 ↔ 옵션 그룹 매핑 | menuoption |
| 9 | `menu_option_exclusion` | 메뉴별 옵션 제외 설정 | menuoption |
| 10 | `orders` | 주문 정보 | order |
| 11 | `order_items` | 주문 항목 (메뉴별) | order |
| 12 | `order_option_selections` | 주문 항목별 선택 옵션 | order |
| 13 | `daily_menu_sales` | 일별 메뉴 매출 통계 | sales |
| 14 | `store_settings` | 매장 설정 (영업 시간, 이름 등) | store |
| 15 | `notice_popups` | 공지 팝업 | notice |
| 16 | `grade_settings` | 등급별 설정 (적립률, 승급 기준) | user/grade |
| 17 | `grade_system_config` | 등급 시스템 전역 설정 | user/grade |
| 18 | `user_favorite_menus` | 즐겨찾기 메뉴 | user/favorite |
| 19 | `user_favorite_menu_options` | 즐겨찾기 선택 옵션 | user/favorite |
| 20 | `gallery_images` | 갤러리 이미지 (About 페이지) | gallery |

---

## 3. 회원 & 인증

### 3.1 `users` — 회원 정보

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | VARCHAR | **PK** | 회원 고유 ID (UUID) |
| `username` | VARCHAR | | 로그인 아이디 |
| `nickname` | VARCHAR | | 닉네임 (표시명) |
| `email` | VARCHAR | | 이메일 |
| `phone_number` | VARCHAR | | 전화번호 |
| `password` | VARCHAR | | 암호화된 비밀번호 |
| `role` | VARCHAR | | 역할 (`ROLE_USER`, `ROLE_SUB_ADMIN`, `ROLE_ADMIN`) |
| `grade` | VARCHAR | | 등급 (`GREEN_BEAN`, `SILVER`, `GOLD`, `DIAMOND` 등) |
| `total_order_count` | INTEGER | default 0 | 누적 주문 횟수 |
| `total_order_amount` | INTEGER | default 0 | 누적 주문 금액 |
| `point_balance` | INTEGER | default 0 | 현재 포인트 잔액 |
| `is_enabled` | BOOLEAN | default true | 계정 활성화 여부 (잠금 기능) |
| `deleted_at` | TIMESTAMP | nullable | 탈퇴 요청 일시 (soft delete) |
| `created_at` | TIMESTAMP | | 가입 일시 |
| `updated_at` | TIMESTAMP | | 최종 수정 일시 |

**특이사항:**
- `id`는 auto-increment가 아닌 UUID 문자열 (구글 소셜 로그인 대응)
- `deleted_at`이 not null이면 탈퇴 상태 (soft delete → 복구 가능)
- `grade`의 기본값은 `GREEN_BEAN`
- Spring Security `UserDetails` 인터페이스 구현

### 3.2 `user_points` — 포인트 내역

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 포인트 내역 ID |
| `user_id` | VARCHAR | **NOT NULL** | 사용자 ID (FK → users) |
| `order_id` | VARCHAR | nullable | 관련 주문 ID |
| `point_amount` | INTEGER | **NOT NULL** | 포인트 수량 (양수: 적립, 음수: 사용) |
| `type` | VARCHAR | **NOT NULL** | 유형 (`EARN`, `USE`, `EXPIRE`, `CANCEL`) |
| `balance_snapshot` | INTEGER | **NOT NULL** | 처리 후 잔액 스냅샷 |
| `description` | VARCHAR | | 설명 (예: "주문 완료 적립") |
| `expires_at` | TIMESTAMP | nullable | 포인트 만료일 |
| `created_at` | TIMESTAMP | | 생성 일시 |

---

## 4. 메뉴 & 카테고리

### 4.1 `menus` — 메뉴

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 메뉴 ID |
| `kor_name` | VARCHAR | | 한글 메뉴명 |
| `eng_name` | VARCHAR | | 영문 메뉴명 (URL 슬러그로 사용) |
| `description` | VARCHAR | | 메뉴 설명 |
| `price` | INTEGER | | 기본 가격 (원) |
| `category_id` | BIGINT | FK → categories | 카테고리 ID |
| `is_available` | BOOLEAN | | 판매 가능 여부 |
| `is_sold_out` | BOOLEAN | | 품절 여부 |
| `sort_order` | INTEGER | | 정렬 순서 |
| `created_at` | TIMESTAMP | | 생성 일시 |
| `updated_at` | TIMESTAMP | | 수정 일시 |

**특이사항:**
- `eng_name`은 프론트엔드에서 URL 슬러그로 사용 (예: `/menus/americano`)
- 고객용 조회 모듈(`menu`)과 관리자용 CRUD 모듈(`admin/menu`)에서 **같은 테이블을 별도 Entity로 참조**

### 4.2 `menu_images` — 메뉴 이미지

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 이미지 ID |
| `menu_id` | BIGINT | FK → menus | 메뉴 ID |
| `src_url` | VARCHAR | | 이미지 경로 (예: `/upload/xxx.webp`) |
| `sort_order` | INTEGER | | 정렬 순서 (0번이 메인 이미지) |
| `created_at` | TIMESTAMP | | 업로드 일시 |

### 4.3 `categories` — 카테고리

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 카테고리 ID |
| `name` | VARCHAR | | 카테고리명 (예: "커피", "논커피", "디저트") |
| `sort_order` | INTEGER | | 정렬 순서 |

---

## 5. 옵션 시스템

### 5.1 `option_groups` — 옵션 그룹

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 옵션 그룹 ID |
| `name` | VARCHAR(100) | **NOT NULL** | 그룹명 (예: "사이즈", "샷 추가", "시럽") |
| `type` | VARCHAR(20) | **NOT NULL** | 선택 방식 (`radio`: 단일 선택, `checkbox`: 다중 선택) |
| `is_required` | BOOLEAN | **NOT NULL** | 필수 선택 여부 |
| `sort_order` | INTEGER | **NOT NULL** | 정렬 순서 |
| `created_at` | TIMESTAMP | | 생성 일시 |

### 5.2 `option_items` — 옵션 항목

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 옵션 항목 ID |
| `option_group_id` | BIGINT | **NOT NULL**, FK → option_groups | 소속 옵션 그룹 |
| `name` | VARCHAR(100) | **NOT NULL** | 항목명 (예: "Tall", "Grande", "Venti") |
| `price_delta` | INTEGER | **NOT NULL** | 추가 금액 (원, 0이면 무료) |
| `sort_order` | INTEGER | **NOT NULL** | 정렬 순서 |
| `created_at` | TIMESTAMP | | 생성 일시 |

### 5.3 `category_option_group_map` — 카테고리 ↔ 옵션 매핑

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 매핑 ID |
| `category_id` | BIGINT | **NOT NULL**, FK → categories | 카테고리 ID |
| `option_group_id` | BIGINT | **NOT NULL**, FK → option_groups | 옵션 그룹 ID |
| `sort_order` | INTEGER | **NOT NULL** | 정렬 순서 |

**UNIQUE 제약:** `(category_id, option_group_id)` — 같은 카테고리에 같은 옵션 그룹 중복 매핑 방지

**역할:** "커피" 카테고리에 "사이즈", "샷 추가" 옵션 그룹을 연결하면, 해당 카테고리의 모든 메뉴에 자동으로 옵션이 표시됩니다.

### 5.4 `menu_option_exclusion` — 메뉴별 옵션 제외

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 제외 ID |
| `menu_id` | BIGINT | **NOT NULL**, FK → menus | 메뉴 ID |
| `option_group_id` | BIGINT | **NOT NULL**, FK → option_groups | 제외할 옵션 그룹 ID |

**UNIQUE 제약:** `(menu_id, option_group_id)`

**역할:** 카테고리에 옵션이 매핑되어 있지만, 특정 메뉴에서는 해당 옵션을 숨기고 싶을 때 사용합니다. (예: "에스프레소"에서 "사이즈" 옵션 제외)

### 옵션 적용 로직

```
1. 메뉴의 category_id로 categories 테이블에서 카테고리 조회
2. category_option_group_map에서 해당 카테고리에 매핑된 옵션 그룹 목록 조회
3. menu_option_exclusion에서 해당 메뉴에서 제외된 옵션 그룹 목록 조회
4. 최종 옵션 = (카테고리 매핑 옵션) - (메뉴별 제외 옵션)
```

---

## 6. 주문 & 결제

### 6.1 `orders` — 주문

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 주문 ID |
| `order_date` | DATE | **NOT NULL** | 주문 날짜 |
| `order_number` | INTEGER | **NOT NULL** | 당일 주문 번호 (#1, #2, ...) |
| `user_id` | VARCHAR | nullable | 회원 ID (비회원이면 null) |
| `customer_name` | VARCHAR(50) | **NOT NULL** | 주문자 이름 |
| `order_type` | ENUM | | 주문 유형 (`STORE`: 매장, `PICKUP`: 포장) |
| `status` | ENUM | **NOT NULL** | 주문 상태 |
| `total_price` | INTEGER | **NOT NULL** | 최종 결제 금액 (포인트 차감 후) |
| `used_points` | INTEGER | nullable | 사용한 포인트 |
| `earn_points` | INTEGER | nullable | 적립된 포인트 |
| `reject_reason` | VARCHAR | nullable | 주문 거절 사유 |
| `memo` | TEXT | nullable | 주문 메모 |
| `payment_id` | VARCHAR(100) | nullable | PortOne 결제 ID |
| `payment_method` | VARCHAR(20) | nullable | 결제 수단 (`KAKAOPAY`, `NAVERPAY`, `INICIS`) |
| `payment_status` | VARCHAR(20) | nullable | 결제 상태 (`PAID`, `TEST`) |
| `created_at` | TIMESTAMP | **NOT NULL** | 주문 생성 일시 |
| `updated_at` | TIMESTAMP | **NOT NULL** | 최종 수정 일시 |

**UNIQUE 제약:** `(order_date, order_number)` — 같은 날짜에 같은 주문 번호 중복 방지

**주문 상태 (OrderStatus):**

```
PREPARING    → 주문 접수 (제조 대기)
IN_PROGRESS  → 제조 중
COMPLETED    → 제조 완료 (픽업 대기)
PICKED_UP    → 픽업 완료
REJECTED     → 주문 거절
CANCELLED    → 주문 취소
```

### 6.2 `order_items` — 주문 항목

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 주문 항목 ID |
| `order_id` | BIGINT | **NOT NULL**, FK → orders | 주문 ID |
| `menu_id` | BIGINT | **NOT NULL** | 메뉴 ID |
| `menu_name` | VARCHAR(100) | **NOT NULL** | 주문 시점의 메뉴명 (스냅샷) |
| `quantity` | INTEGER | **NOT NULL**, default 1 | 수량 |
| `unit_price` | INTEGER | **NOT NULL** | 메뉴 기본 가격 (주문 시점) |
| `option_price` | INTEGER | **NOT NULL**, default 0 | 옵션 추가 금액 합계 |
| `subtotal` | INTEGER | **NOT NULL** | 소계 = (unit_price + option_price) × quantity |

**특이사항:** `menu_name`, `unit_price`는 주문 시점의 값을 **스냅샷으로 저장** — 나중에 메뉴 가격이 바뀌어도 주문 내역에는 영향 없음

### 6.3 `order_option_selections` — 주문 선택 옵션

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 선택 옵션 ID |
| `order_item_id` | BIGINT | **NOT NULL**, FK → order_items | 주문 항목 ID |
| `option_group_name` | VARCHAR(100) | **NOT NULL** | 옵션 그룹명 (스냅샷) |
| `option_item_name` | VARCHAR(100) | **NOT NULL** | 옵션 항목명 (스냅샷) |
| `price_delta` | INTEGER | **NOT NULL**, default 0 | 추가 금액 (스냅샷) |

**특이사항:** 옵션 이름과 가격을 **스냅샷으로 저장** — ID가 아닌 이름을 저장하여 옵션이 삭제/수정되어도 주문 내역 보존

---

## 7. 매출 통계

### 7.1 `daily_menu_sales` — 일별 메뉴 매출

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 매출 기록 ID |
| `sale_date` | DATE | **NOT NULL** | 매출 날짜 |
| `menu_id` | BIGINT | **NOT NULL** | 메뉴 ID |
| `menu_name` | VARCHAR(100) | **NOT NULL** | 메뉴명 (스냅샷) |
| `category_name` | VARCHAR(100) | nullable | 카테고리명 (스냅샷) |
| `quantity_sold` | INTEGER | **NOT NULL**, default 0 | 판매 수량 |
| `total_sales` | INTEGER | **NOT NULL**, default 0 | 총 매출액 |
| `created_at` | TIMESTAMP | **NOT NULL** | 생성 일시 |
| `updated_at` | TIMESTAMP | **NOT NULL** | 수정 일시 |

**UNIQUE 제약:** `(sale_date, menu_id)` — 같은 날짜에 같은 메뉴의 매출은 하나의 레코드로 합산

**역할:** 주문 완료 시 해당 메뉴의 일별 매출을 업데이트합니다. 관리자 매출 분석 페이지에서 차트/테이블 데이터로 사용됩니다.

---

## 8. 매장 & 공지

### 8.1 `store_settings` — 매장 설정

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | INTEGER | **PK**, default 1 | 설정 ID (항상 1, 싱글톤) |
| `is_open` | BOOLEAN | **NOT NULL**, default false | 영업 중 여부 |
| `opened_at` | TIMESTAMP | nullable | 최근 영업 시작 시간 |
| `closed_at` | TIMESTAMP | nullable | 최근 영업 종료 시간 |
| `open_time` | VARCHAR | nullable | 영업 시작 시간 (예: "09:00") |
| `close_time` | VARCHAR | nullable | 영업 종료 시간 (예: "22:00") |
| `cafe_name` | VARCHAR | nullable | 카페 이름 |
| `description` | VARCHAR | nullable | 카페 설명 |
| `contact_number` | VARCHAR | nullable | 연락처 |
| `address` | VARCHAR | nullable | 주소 (한글) |
| `address_en` | VARCHAR | nullable | 주소 (영문) |
| `favicon_url` | VARCHAR | nullable | 파비콘 경로 (라이트 모드) |
| `favicon_dark_url` | VARCHAR | nullable | 파비콘 경로 (다크 모드) |
| `updated_at` | TIMESTAMP | **NOT NULL** | 수정 일시 |

**특이사항:** **싱글톤 테이블** — 항상 1개의 레코드만 존재 (id=1). 매장 전체 설정을 하나의 레코드로 관리합니다.

### 8.2 `notice_popups` — 공지 팝업

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 팝업 ID |
| `title` | VARCHAR(255) | **NOT NULL** | 팝업 제목 |
| `content` | TEXT | **NOT NULL** | 팝업 내용 |
| `image_url` | VARCHAR(500) | nullable | 팝업 이미지 경로 |
| `is_active` | BOOLEAN | **NOT NULL** | 활성화 여부 |

---

## 9. 등급 시스템

### 9.1 `grade_settings` — 등급별 설정

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 등급 설정 ID |
| `grade` | VARCHAR(20) | **UNIQUE**, **NOT NULL** | 등급 코드 (예: `GREEN_BEAN`, `SILVER`) |
| `display_name` | VARCHAR(50) | **NOT NULL** | 표시명 (예: "실버", "골드") |
| `earn_rate` | INTEGER | **NOT NULL** | 포인트 적립률 (%, 예: 3) |
| `discount_rate` | INTEGER | **NOT NULL**, default 0 | 할인율 (%) |
| `upgrade_order_count` | INTEGER | nullable | 승급 기준: 누적 주문 횟수 |
| `upgrade_order_amount` | INTEGER | nullable | 승급 기준: 누적 주문 금액 |
| `sort_order` | INTEGER | **NOT NULL** | 등급 순서 (낮을수록 낮은 등급) |
| `main_color` | VARCHAR(7) | **NOT NULL** | 등급 대표 색상 (HEX) |
| `text_color` | VARCHAR(7) | **NOT NULL** | 등급 텍스트 색상 (HEX) |
| `updated_at` | TIMESTAMP | | 수정 일시 |

### 9.2 `grade_system_config` — 등급 시스템 전역 설정

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, 항상 1 | 설정 ID (싱글톤) |
| `is_enabled` | BOOLEAN | | 등급 시스템 활성화 여부 |
| `default_earn_rate` | INTEGER | **NOT NULL**, default 1 | 기본 적립률 (등급 미설정 시) |

**특이사항:** **싱글톤 테이블** — store_settings와 동일하게 id=1 레코드 하나만 사용

---

## 10. 즐겨찾기

### 10.1 `user_favorite_menus` — 즐겨찾기 메뉴

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 즐겨찾기 ID |
| `user_id` | VARCHAR | **NOT NULL**, FK → users | 사용자 ID |
| `menu_id` | BIGINT | **NOT NULL** | 메뉴 ID |
| `alias` | VARCHAR | nullable | 사용자 지정 별칭 (예: "나의 아아") |
| `created_at` | TIMESTAMP | | 등록 일시 |

### 10.2 `user_favorite_menu_options` — 즐겨찾기 선택 옵션

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | ID |
| `favorite_menu_id` | BIGINT | **NOT NULL**, FK → user_favorite_menus | 즐겨찾기 ID |
| `option_group_id` | BIGINT | **NOT NULL** | 옵션 그룹 ID |
| `option_item_id` | BIGINT | **NOT NULL** | 옵션 항목 ID |

**역할:** 즐겨찾기에 메뉴뿐 아니라 **선택한 옵션 조합까지 저장** — "아이스 아메리카노 + Grande + 샷 추가" 같은 커스텀 조합을 한 번에 장바구니에 추가 가능

---

## 11. 갤러리

### 11.1 `gallery_images` — 갤러리 이미지

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| `id` | BIGINT | **PK**, Auto | 이미지 ID |
| `image_url` | VARCHAR | **NOT NULL** | 이미지 경로 |
| `sort_order` | INTEGER | **NOT NULL**, default 0 | 정렬 순서 |
| `is_visible` | BOOLEAN | **NOT NULL**, default true | 표시 여부 |
| `created_at` | TIMESTAMP | **NOT NULL** | 업로드 일시 |

**역할:** About(매장 소개) 페이지의 무한 스크롤 갤러리에 표시되는 이미지를 관리합니다.

---

## 📝 핵심 설계 포인트

### 1. 스냅샷 저장 패턴
주문 관련 테이블(`order_items`, `order_option_selections`)에서 메뉴명, 옵션명, 가격을 **주문 시점의 값으로 복사하여 저장**합니다. 이를 통해 나중에 메뉴 가격이나 옵션이 변경되어도 과거 주문 내역의 정합성이 유지됩니다.

### 2. 싱글톤 테이블
`store_settings`, `grade_system_config`은 항상 1개의 레코드만 사용하는 싱글톤 테이블입니다. 별도 설정 파일 대신 DB에서 관리하여 런타임에 동적으로 변경 가능합니다.

### 3. 옵션 2단계 매핑
옵션을 메뉴에 직접 연결하지 않고, **카테고리 → 옵션 그룹** 매핑 + **메뉴별 제외** 방식으로 관리합니다. 이를 통해 새 메뉴를 등록할 때 옵션을 일일이 설정할 필요 없이 카테고리만 지정하면 자동으로 옵션이 적용됩니다.

### 4. 비회원 주문 대응
`orders.user_id`가 nullable이므로 비회원도 주문 가능합니다. `user_id = null`인 주문은 주문번호만 알면 누구나 조회 가능하고, `user_id`가 있는 주문은 본인만 조회 가능합니다.

### 5. 일별 매출 집계
`daily_menu_sales` 테이블은 주문 완료 시 자동으로 업데이트됩니다. 기간별 매출 분석, 메뉴 랭킹, 카테고리 분석 등 통계 조회 시 orders 테이블을 직접 집계하지 않고 이 테이블을 조회하여 **쿼리 성능을 최적화**합니다.
