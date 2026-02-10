# 메뉴 옵션 데이터베이스 설계

## 개요
메뉴의 옵션 정보(온도 선택, 사이즈 업, 샷/시럽 추가 등)를 저장하기 위한 데이터베이스 테이블 설계안입니다.

---

## 테이블 설계

### 1. `menu_option_group` (옵션 그룹 테이블)
메뉴에 연결된 옵션 카테고리(예: "온도 선택", "사이즈 업")를 저장합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGINT (PK) | 옵션 그룹 ID |
| `menu_id` | BIGINT (FK) | 연결된 메뉴 ID |
| `name` | VARCHAR(100) | 옵션 그룹 이름 (예: "온도 선택") |
| `type` | VARCHAR(20) | 선택 방식: `'radio'` (단일) 또는 `'checkbox'` (다중) |
| `is_required` | BOOLEAN | 필수 여부 |
| `sort_order` | INT | 표시 순서 |
| `created_at` | TIMESTAMP | 생성일시 |

---

### 2. `menu_option_item` (옵션 항목 테이블)
각 옵션 그룹에 속하는 개별 항목(예: "HOT", "ICE", "그란데 사이즈")을 저장합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGINT (PK) | 옵션 항목 ID |
| `option_group_id` | BIGINT (FK) | 연결된 옵션 그룹 ID |
| `name` | VARCHAR(100) | 항목 이름 (예: "ICE") |
| `price_delta` | INT | 추가 금액 (0 = 무료) |
| `sort_order` | INT | 표시 순서 |
| `created_at` | TIMESTAMP | 생성일시 |

---

## 관계도 (ERD)

```
menu (기존)
  │
  └──< menu_option_group (1:N)
           │
           └──< menu_option_item (1:N)
```

- 하나의 메뉴는 여러 개의 옵션 그룹을 가질 수 있습니다.
- 하나의 옵션 그룹은 여러 개의 옵션 항목을 가질 수 있습니다.

---

## SQL 스크립트 (MySQL 기준)

```sql
-- 옵션 그룹 테이블
CREATE TABLE menu_option_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    menu_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'radio',
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE
);

-- 옵션 항목 테이블
CREATE TABLE menu_option_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    option_group_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price_delta INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (option_group_id) REFERENCES menu_option_group(id) ON DELETE CASCADE
);
```

---

## 예시 데이터

### menu_option_group
| id | menu_id | name | type | is_required | sort_order |
|----|---------|------|------|-------------|------------|
| 1 | 1 | 온도 선택 | radio | TRUE | 1 |
| 2 | 1 | 사이즈 업 | checkbox | FALSE | 2 |
| 3 | 1 | 샷/시럽 추가 | checkbox | FALSE | 3 |

### menu_option_item
| id | option_group_id | name | price_delta | sort_order |
|----|-----------------|------|-------------|------------|
| 1 | 1 | HOT | 0 | 1 |
| 2 | 1 | ICE | 500 | 2 |
| 3 | 2 | 그란데 사이즈 | 500 | 1 |
| 4 | 2 | 벤티 사이즈 | 1000 | 2 |
| 5 | 3 | 에스프레소 샷 추가 | 500 | 1 |
| 6 | 3 | 바닐라 시럽 추가 | 500 | 2 |
| 7 | 3 | 헤이즐넛 시럽 추가 | 500 | 3 |

---

## 설계의 장점

1. **정규화**: 옵션 그룹과 항목이 분리되어 데이터 중복이 없습니다.
2. **확장성**: 새로운 옵션 타입이나 속성 추가가 쉽습니다.
3. **Cascade Delete**: 메뉴가 삭제되면 관련 옵션들도 자동 삭제됩니다.
4. **유연한 정렬**: `sort_order` 컬럼을 통해 표시 순서를 자유롭게 조절할 수 있습니다.

---

## 다음 단계

1. **백엔드 Entity 생성**: `MenuOptionGroup`, `MenuOptionItem` 클래스 작성
2. **Repository 생성**: 데이터 접근 레이어 구현
3. **DTO 생성**: API 응답용 DTO 구현
4. **Controller 엔드포인트 추가**: 옵션 조회/생성/수정/삭제 API 구현
5. **프론트엔드 연동**: 더미 데이터를 실제 API 호출로 교체

---

## 확장: 메뉴별 옵션 가격이 다른 경우

위 설계는 **옵션 항목의 가격이 모든 메뉴에서 동일**하다고 가정합니다.
만약 **같은 "사이즈 업" 옵션이라도 메뉴마다 추가 금액이 다르다면**, 가격 정보를 별도 테이블로 분리해야 합니다.

### 변경된 테이블 구조

#### `menu_option_item` (가격 정보 제거)
옵션 항목의 **템플릿** 역할만 수행합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGINT (PK) | 옵션 항목 ID |
| `option_group_id` | BIGINT (FK) | 옵션 그룹 ID |
| `name` | VARCHAR(100) | 항목 이름 (예: "그란데") |
| `sort_order` | INT | 표시 순서 |
| `created_at` | TIMESTAMP | 생성일시 |

### `menu_option_item` (옵션 항목 테이블)
각 옵션 그룹에 속하는 개별 항목(예: "HOT", "ICE", "그란데 사이즈")을 저장합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGINT (PK) | 옵션 항목 ID |
| `option_group_id` | BIGINT (FK) | 연결된 옵션 그룹 ID |
| `name` | VARCHAR(100) | 항목 이름 (예: "ICE") |
| `price_delta` | INT | 추가 금액 (0 = 무료) |
| `sort_order` | INT | 표시 순서 |
| `created_at` | TIMESTAMP | 생성일시 |

#### `menu_option_price` **(신규 테이블)**
메뉴별 옵션 항목의 실제 가격을 저장합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGINT (PK) | ID |
| `menu_id` | BIGINT (FK) | 메뉴 ID |
| `option_item_id` | BIGINT (FK) | 옵션 항목 ID |
| `price_delta` | INT | **이 메뉴에서의** 추가 금액 |

### 변경된 ERD

```
menu
  │
  └──< menu_option_group (1:N)
           │
           └──< menu_option_item (1:N)
                    │
menu ──────────────┼──< menu_option_price (M:N 관계)
```

### SQL 스크립트 (확장 버전)

```sql
-- 옵션 항목 테이블 (가격 정보 없음)
CREATE TABLE menu_option_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    option_group_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (option_group_id) REFERENCES menu_option_group(id) ON DELETE CASCADE
);

-- 메뉴별 옵션 가격 테이블 (신규)
CREATE TABLE menu_option_price (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    menu_id BIGINT NOT NULL,
    option_item_id BIGINT NOT NULL,
    price_delta INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_id) REFERENCES menu(id) ON DELETE CASCADE,
    FOREIGN KEY (option_item_id) REFERENCES menu_option_item(id) ON DELETE CASCADE,
    UNIQUE KEY unique_menu_option (menu_id, option_item_id)
);
```

### 예시 데이터 (메뉴별 다른 가격)

#### menu_option_price
| id | menu_id | option_item_id | price_delta |
|----|---------|----------------|-------------|
| 1 | 1 (아메리카노) | 3 (그란데) | 500 |
| 2 | 1 (아메리카노) | 4 (벤티) | 1000 |
| 3 | 2 (카페라떼) | 3 (그란데) | 700 |
| 4 | 2 (카페라떼) | 4 (벤티) | 1200 |

> 위 예시에서 아메리카노의 그란데 사이즈 업은 +500원이지만, 카페라떼는 +700원입니다.

### 확장 설계의 장점

1. **유연성**: 메뉴별로 다른 가격 책정 가능
2. **일관성**: 옵션 이름이나 구조를 한 곳에서 관리 가능
3. **확장성**: 특정 메뉴에서 특정 옵션만 비활성화하는 기능도 쉽게 추가 가능

### 대안: 옵션 그룹을 메뉴별로 복제

옵션을 **메뉴마다 완전히 별개로** 관리하는 방법도 있습니다. 
즉, "아메리카노의 사이즈 업"과 "카페라떼의 사이즈 업"이 각각 다른 `menu_option_group` 레코드가 됩니다.

- **장점**: 테이블 구조가 단순
- **단점**: 옵션 이름/구조 변경 시 모든 메뉴를 개별 수정해야 함 (데이터 중복)

---

## 권장사항

- **옵션 가격이 모든 메뉴에서 동일**한 경우: 기본 설계 사용 (`menu_option_item`에 `price_delta` 포함)
- **메뉴별로 옵션 가격이 다른** 경우: 확장 설계 사용 (`menu_option_price` 테이블 추가)

