# 메뉴 옵션 데이터베이스 설계 V2

## 개요
카페 메뉴의 **옵션 시스템**을 설계합니다.
카테고리(Coffee, Non-Coffee, Dessert, Bakery)별로 **기본 옵션 세트**를 지정하고,
특정 메뉴에서 불필요한 옵션은 **제외(exclude)** 할 수 있는 구조입니다.

---

## 핵심 설계 원칙

1. **카테고리 기반 옵션 관리**: 옵션 그룹을 카테고리 단위로 연결 → 해당 카테고리의 모든 메뉴가 자동으로 옵션 상속
2. **메뉴별 예외 처리**: 특정 메뉴에서 불필요한 옵션은 제외 테이블로 관리 (예: 에스프레소는 온도/사이즈 제외)
3. **옵션 그룹 재사용**: "포장 옵션"처럼 공통 옵션은 한 번만 정의하고 여러 카테고리에 연결
4. **가격 유연성**: 옵션별 추가금액 설정 가능

---

## 테이블 설계

### 1. `option_groups` (옵션 그룹 정의)

옵션의 **종류(틀)** 를 정의합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGSERIAL (PK) | 옵션 그룹 ID |
| `name` | VARCHAR(100) | 옵션 그룹 이름 (예: "온도 선택") |
| `type` | VARCHAR(20) | `'radio'` (단일선택) 또는 `'checkbox'` (다중선택) |
| `is_required` | BOOLEAN | 필수 선택 여부 |
| `sort_order` | INT | 기본 표시 순서 |
| `created_at` | TIMESTAMP | 생성일시 |

---

### 2. `option_items` (옵션 항목)

각 옵션 그룹에 속하는 **선택지** 를 정의합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGSERIAL (PK) | 옵션 항목 ID |
| `option_group_id` | BIGINT (FK) | 소속 옵션 그룹 ID |
| `name` | VARCHAR(100) | 항목 이름 (예: "ICE") |
| `price_delta` | INT | 추가 금액 (0 = 무료) |
| `sort_order` | INT | 표시 순서 |
| `created_at` | TIMESTAMP | 생성일시 |

---

### 3. `category_option_group_map` (카테고리 ↔ 옵션 그룹 연결)

**카테고리 단위**로 기본 옵션 그룹을 연결합니다.
해당 카테고리에 속하는 모든 메뉴가 이 옵션을 **자동 상속**합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGSERIAL (PK) | 매핑 ID |
| `category_id` | BIGINT (FK) | 카테고리 ID |
| `option_group_id` | BIGINT (FK) | 옵션 그룹 ID |
| `sort_order` | INT | 이 카테고리에서의 표시 순서 |

> **UNIQUE**: `(category_id, option_group_id)`

---

### 4. `menu_option_exclusion` (메뉴별 옵션 제외)

카테고리에서 상속받은 옵션 중, **특정 메뉴에서 제외할 옵션**을 지정합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGSERIAL (PK) | ID |
| `menu_id` | BIGINT (FK) | 메뉴 ID |
| `option_group_id` | BIGINT (FK) | 제외할 옵션 그룹 ID |

> **UNIQUE**: `(menu_id, option_group_id)`

---

## ERD (관계도)

```
categories ──< category_option_group_map >── option_groups
                                                  │
                                                  └──< option_items (1:N)

menus ──< menu_option_exclusion >── option_groups
```

**옵션 조회 로직**:
```
메뉴의 실제 옵션 = (해당 메뉴의 카테고리에 연결된 옵션 그룹)
                  - (menu_option_exclusion에 등록된 제외 옵션)
```

---

## SQL 스크립트 (PostgreSQL)

```sql
-- 1. 옵션 그룹 테이블
CREATE TABLE option_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'radio',
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 옵션 항목 테이블
CREATE TABLE option_items (
    id BIGSERIAL PRIMARY KEY,
    option_group_id BIGINT NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_delta INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 카테고리-옵션그룹 연결 테이블
CREATE TABLE category_option_group_map (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    option_group_id BIGINT NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 1,
    UNIQUE (category_id, option_group_id)
);

-- 4. 메뉴별 옵션 제외 테이블
CREATE TABLE menu_option_exclusion (
    id BIGSERIAL PRIMARY KEY,
    menu_id BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    option_group_id BIGINT NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
    UNIQUE (menu_id, option_group_id)
);
```

---

## 옵션 그룹 & 항목 정의

### 📌 그룹 1: 온도 선택
| type: `radio` | is_required: `TRUE` |
|---|---|

| 항목 | 추가금액 |
|------|----------|
| HOT | 0원 |
| ICE | 0원 |

---

### 📌 그룹 2: 사이즈
| type: `radio` | is_required: `TRUE` |
|---|---|

| 항목 | 추가금액 |
|------|----------|
| Small | 0원 |
| Regular | 0원 |
| Large | +500원 |
| Extra Large | +1,000원 |

---

### 📌 그룹 3: 샷 추가
| type: `checkbox` | is_required: `FALSE` |
|---|---|

| 항목 | 추가금액 |
|------|----------|
| 에스프레소 샷 추가 (+1) | +500원 |
| 에스프레소 샷 추가 (+2) | +1,000원 |

---

### 📌 그룹 4: 시럽 추가
| type: `checkbox` | is_required: `FALSE` |
|---|---|

| 항목 | 추가금액 |
|------|----------|
| 바닐라 시럽 | +500원 |
| 헤이즐넛 시럽 | +500원 |
| 카라멜 시럽 | +500원 |

---

### 📌 그룹 5: 데움 여부
| type: `radio` | is_required: `TRUE` |
|---|---|

| 항목 | 추가금액 |
|------|----------|
| 그대로 | 0원 |
| 데워주세요 | 0원 |

---

### 📌 그룹 6: 포장 옵션
| type: `radio` | is_required: `TRUE` |
|---|---|

| 항목 | 추가금액 |
|------|----------|
| 매장 | 0원 |
| 포장 | 0원 |

---

### 📌 그룹 7: 쿠키 세트
| type: `radio` | is_required: `TRUE` |
|---|---|

| 항목 | 추가금액 |
|------|----------|
| 1개 | 0원 |
| 3개 세트 | +4,500원 |
| 6개 세트 | +8,500원 |

---

### 📌 그룹 8: 빵 종류 변경
| type: `radio` | is_required: `FALSE` |
|---|---|

| 항목 | 추가금액 |
|------|----------|
| 기본 빵 | 0원 |
| 치아바타로 변경 | +500원 |
| 통밀빵으로 변경 | 0원 |

---

## 카테고리별 기본 옵션 매핑

### ☕ Coffee 카테고리 → 기본 옵션 4개

| 순서 | 옵션 그룹 | 설명 |
|:----:|-----------|------|
| 1 | 온도 선택 | HOT / ICE |
| 2 | 사이즈 | Small ~ Extra Large |
| 3 | 샷 추가 | 에스프레소 샷 |
| 4 | 시럽 추가 | 바닐라 / 헤이즐넛 / 카라멜 |

**예외 (제외)**:
- **에스프레소**: 온도 선택 ❌, 사이즈 ❌, 시럽 추가 ❌ → 샷 추가만 가능

---

### 🧃 Non-Coffee 카테고리 → 기본 옵션 3개

| 순서 | 옵션 그룹 | 설명 |
|:----:|-----------|------|
| 1 | 온도 선택 | HOT / ICE |
| 2 | 사이즈 | Small ~ Extra Large |
| 3 | 시럽 추가 | 바닐라 / 헤이즐넛 / 카라멜 |

> 논커피는 샷 추가가 없음 (카테고리 레벨에서 제외)

---

### 🍪 Dessert 카테고리 → 기본 옵션 2개

| 순서 | 옵션 그룹 | 설명 |
|:----:|-----------|------|
| 1 | 포장 옵션 | 매장 / 포장 |
| 2 | 쿠키 세트 | 1개 / 3개 / 6개 |

**예외 (제외)**:
- **딸기 케이크**: 쿠키 세트 ❌ → 포장만 가능
- **초콜릿 무스**: 쿠키 세트 ❌ → 포장만 가능

---

### 🥖 Bakery 카테고리 → 기본 옵션 3개

| 순서 | 옵션 그룹 | 설명 |
|:----:|-----------|------|
| 1 | 데움 여부 | 그대로 / 데워주세요 |
| 2 | 포장 옵션 | 매장 / 포장 |
| 3 | 빵 종류 변경 | 기본빵 / 치아바타 / 통밀빵 |

**예외 (제외)**:
- **베이글 크림치즈**: 빵 종류 변경 ❌
- **비프 베이글**: 빵 종류 변경 ❌
- **초콜릿 크로와상**: 빵 종류 변경 ❌

> 빵 종류 변경은 **샌드위치류만** 가능 (베이글/크로와상은 제외)

---

## 실제 옵션 조회 결과 시뮬레이션

### 예시 1: 아메리카노 (Coffee)
```
카테고리 "Coffee"의 옵션: [온도, 사이즈, 샷추가, 시럽추가]
제외 테이블: (없음)
─────────────────────────────
결과: 온도 선택 / 사이즈 / 샷 추가 / 시럽 추가  ← 4개 모두 표시
```

### 예시 2: 에스프레소 (Coffee)
```
카테고리 "Coffee"의 옵션: [온도, 사이즈, 샷추가, 시럽추가]
제외 테이블: [온도, 사이즈, 시럽추가]
─────────────────────────────
결과: 샷 추가  ← 1개만 표시
```

### 예시 3: 참치 샌드위치 (Bakery)
```
카테고리 "Bakery"의 옵션: [데움여부, 포장옵션, 빵종류변경]
제외 테이블: (없음)
─────────────────────────────
결과: 데움 여부 / 포장 옵션 / 빵 종류 변경  ← 3개 모두 표시
```

### 예시 4: 초콜릿 크로와상 (Bakery)
```
카테고리 "Bakery"의 옵션: [데움여부, 포장옵션, 빵종류변경]
제외 테이블: [빵종류변경]
─────────────────────────────
결과: 데움 여부 / 포장 옵션  ← 2개만 표시
```

### 예시 5: 딸기 케이크 (Dessert)
```
카테고리 "Dessert"의 옵션: [포장옵션, 쿠키세트]
제외 테이블: [쿠키세트]
─────────────────────────────
결과: 포장 옵션  ← 1개만 표시
```

---

## 옵션 조회 SQL (참고)

```sql
-- 특정 메뉴의 실제 적용 옵션 조회
SELECT og.*
FROM option_groups og
JOIN category_option_group_map cogm ON og.id = cogm.option_group_id
JOIN menus m ON m.category_id = cogm.category_id
WHERE m.id = :menuId
  AND og.id NOT IN (
      SELECT moe.option_group_id
      FROM menu_option_exclusion moe
      WHERE moe.menu_id = :menuId
  )
ORDER BY cogm.sort_order;
```

---

## 설계의 장점

1. **카테고리 기반 관리**: 새 커피 메뉴를 추가하면 별도 설정 없이 온도/사이즈/샷/시럽 옵션이 자동 적용
2. **예외 처리 간편**: 특정 메뉴에서 빼고 싶은 옵션만 제외 테이블에 추가
3. **옵션 일괄 수정**: 옵션 가격을 바꾸면 모든 메뉴에 즉시 반영
4. **데이터 중복 최소화**: 옵션 그룹을 1번만 정의, 여러 카테고리에서 재사용 가능 (예: "포장 옵션"을 Dessert와 Bakery에 모두 연결)
5. **확장 용이**: 새 카테고리(예: Smoothie) 추가 시 옵션 그룹만 연결하면 완료

---

## 구현 체크리스트

### 🔵 Phase 1: 백엔드 기반 구축 (JPA Entity + Repository)

> 데이터베이스 테이블과 1:1 대응하는 JPA 엔티티 및 리포지토리 생성

- [x] **1-1.** `OptionGroupJpaEntity` 엔티티 생성 (`option_groups` 테이블)
- [x] **1-2.** `OptionItemJpaEntity` 엔티티 생성 (`option_items` 테이블)
- [x] **1-3.** `CategoryOptionGroupMapJpaEntity` 엔티티 생성 (`category_option_group_map` 테이블)
- [x] **1-4.** `MenuOptionExclusionJpaEntity` 엔티티 생성 (`menu_option_exclusion` 테이블)
- [x] **1-5.** 각 엔티티에 대한 JPA Repository 인터페이스 생성
- [x] **1-6.** 빌드 성공 확인 (`./gradlew build -x test`)

---

### 🟢 Phase 2: 초기 데이터 삽입 (DataInitializer 수정)

> 서버 기동 시 옵션 그룹, 항목, 카테고리 매핑, 메뉴별 제외 데이터가 자동 생성되도록 수정

- [x] **2-1.** `DataInitializer`에 옵션 관련 Repository 주입
- [x] **2-2.** 옵션 그룹 8개 생성 (온도, 사이즈, 샷, 시럽, 데움, 포장, 쿠키세트, 빵종류)
- [x] **2-3.** 각 옵션 그룹의 항목(Items) 생성
- [x] **2-4.** 카테고리별 옵션 매핑 생성 (`category_option_group_map`)
    - Coffee → 온도, 사이즈, 샷추가, 시럽추가
    - Non-Coffee → 온도, 사이즈, 시럽추가
    - Dessert → 포장, 쿠키세트
    - Bakery → 데움, 포장, 빵종류변경
- [x] **2-5.** 메뉴별 옵션 제외 데이터 생성 (`menu_option_exclusion`)
    - 에스프레소 → 온도, 사이즈, 시럽 제외
    - 딸기케이크/초콜릿무스 → 쿠키세트 제외
    - 베이글/크로와상 → 빵종류변경 제외
- [x] **2-6.** 도커 서버 재시작 → DB 데이터 확인

---

### 🟡 Phase 3: 백엔드 API 구현

> 프론트엔드에서 옵션 데이터를 사용할 수 있도록 REST API 구축

- [x] **3-1.** **옵션 조회 API** (Public) — `GET /menus/{id}/options`
    - 메뉴 ID → 카테고리의 옵션 그룹 - 제외 옵션 = 실제 표시할 옵션 반환
    - 응답에 옵션 그룹 + 항목(items) 포함
- [x] **3-2.** **카테고리별 옵션 목록 조회 API** (Admin) — `GET /admin/categories/{id}/options`
    - 해당 카테고리에 연결된 옵션 그룹 목록 반환
- [x] **3-3.** **카테고리 옵션 매핑 추가/삭제 API** (Admin)
    - `POST /admin/categories/{id}/options` — 옵션 그룹 연결
    - `DELETE /admin/categories/{id}/options/{groupId}` — 옵션 그룹 연결 해제
- [x] **3-4.** **메뉴별 옵션 제외 관리 API** (Admin)
    - `GET /admin/menus/{id}/option-exclusions` — 현재 제외 목록 조회
    - `POST /admin/menus/{id}/option-exclusions` — 제외 추가
    - `DELETE /admin/menus/{id}/option-exclusions/{groupId}` — 제외 해제
- [x] **3-5.** **옵션 그룹 CRUD API** (Admin)
    - `GET /admin/option-groups` — 전체 옵션 그룹 목록
    - `POST /admin/option-groups` — 새 옵션 그룹 생성
    - `PUT /admin/option-groups/{id}` — 옵션 그룹 수정
    - `DELETE /admin/option-groups/{id}` — 옵션 그룹 삭제
- [x] **3-6.** **옵션 항목 CRUD API** (Admin)
    - `GET /admin/option-groups/{id}/items` — 항목 목록
    - `POST /admin/option-groups/{id}/items` — 항목 추가
    - `PUT /admin/option-groups/{id}/items/{itemId}` — 항목 수정
    - `DELETE /admin/option-groups/{id}/items/{itemId}` — 항목 삭제

---

### 🟠 Phase 4: 프론트엔드 — 사용자 메뉴 상세 페이지 옵션 표시

> 일반 사용자가 메뉴를 볼 때 옵션 선택 UI 제공

- [x] **4-1.** 메뉴 상세 페이지(`/menus/[id]`)에서 옵션 조회 API 연동
- [x] **4-2.** 옵션 선택 UI 컴포넌트 구현
    - `radio` 타입 → 라디오 버튼 그룹 (단일 선택)
    - `checkbox` 타입 → 체크박스 그룹 (다중 선택)
    - 필수 옵션(`is_required`)은 선택하지 않으면 주문 불가 표시
- [x] **4-3.** 추가 금액(`price_delta`) 실시간 반영 — 옵션 선택 시 총 금액 변경
- [x] **4-4.** 옵션 없는 메뉴는 옵션 섹션 숨김 처리

---

### 🔴 Phase 5: 프론트엔드 — 관리자 옵션 설정 페이지

> 관리자가 옵션 그룹/항목/매핑을 시각적으로 관리할 수 있는 페이지

- [x] **5-1.** 관리자 사이드바에 **"옵션 관리"** 메뉴 탭 추가
- [x] **5-2.** **옵션 그룹 관리 페이지** (`/admin/options`)
    - 전체 옵션 그룹 목록 표시 (테이블)
    - 옵션 그룹 추가/수정/삭제 기능
    - 각 그룹 클릭 시 하위 항목(items) 편집 UI
- [x] **5-3.** **카테고리별 옵션 설정 페이지** (`/admin/categories/[id]/options`)
    - 해당 카테고리에 연결된 옵션 그룹 표시
    - 드래그 또는 체크박스로 옵션 그룹 추가/제거
- [x] **5-4.** **메뉴 상세 페이지 옵션 제외 설정** (`/admin/menus/[id]` 내부)
    - 기존 메뉴 상세 페이지에 "옵션 제외 관리" 섹션 추가
    - 카테고리에서 상속받은 옵션 목록 표시 + 체크박스로 제외 토글

---

### ⚪ Phase 6: 검증 및 마무리

- [ ] **6-1.** 전체 시나리오 테스트
    - 새 카테고리 추가 → 옵션 연결 → 해당 카테고리 메뉴에 옵션 자동 표시 확인
    - 특정 메뉴 옵션 제외 → 해당 메뉴만 옵션 숨김 확인
    - 옵션 가격 변경 → 모든 연결된 메뉴에 반영 확인
- [ ] **6-2.** 도커 배포 테스트 (`docker compose up --build -d`)
- [ ] **6-3.** Git 커밋 & 푸시 → CI/CD 파이프라인 통과 확인

---

### 📋 구현 순서 요약

```
Phase 1 (Entity/Repo)
    ↓
Phase 2 (초기 데이터)  ← 여기까지 하면 DB에 옵션 데이터 존재
    ↓
Phase 3 (API)          ← 여기까지 하면 백엔드 완성
    ↓
Phase 4 (사용자 UI)    ← 여기까지 하면 사용자가 옵션 볼 수 있음
    ↓
Phase 5 (관리자 UI)    ← 여기까지 하면 관리자가 옵션 편집 가능
    ↓
Phase 6 (검증)         ← 최종 확인
```

> **권장**: Phase 1~3을 먼저 완성한 뒤, Phase 4와 5는 순서를 바꿔도 됩니다.
> 관리자 페이지가 먼저 필요하면 Phase 5를 먼저 진행해도 무방합니다.
