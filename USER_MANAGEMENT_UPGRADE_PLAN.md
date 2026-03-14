# 🔧 회원 관리 시스템 업그레이드 청사진

> **목표:** 현재 간단한 `id/password/nickname/role` 구조의 사용자 모델을 확장하여,  
> 실제 서비스 수준의 회원 관리 시스템으로 발전시킨다.

---

## 📊 현재 상태 분석 (AS-IS)

### 백엔드 (`User.java 엔티티`)
| 필드 | 타입 | 비고 |
|------|------|------|
| `id` | `String` (UUID) | PK |
| `username` | `String` | **사실상 nickname으로 사용 중** (DB 컬럼명: `nickname`) |
| `password` | `String` | BCrypt 인코딩 |
| `role` | `String` | `ROLE_ADMIN` / `ROLE_USER` |

### 문제점
1. `username`과 `nickname`이 혼용됨 — `@Column(name = "nickname")` 으로 매핑된 `username` 필드
2. 이메일, 전화번호 등 개인정보 필드 없음
3. 권한이 2단계(`ADMIN`/`USER`)뿐이라 세밀한 관리 불가
4. 마이페이지 미존재: 개인정보 수정, 즐겨찾기, 주문 통계 기능 없음
5. 주문 시 고객정보 수동 입력 필요 (회원이어도 자동완성 안됨)

---

## 🎯 목표 상태 (TO-BE)

### 새로운 `users` 테이블 스키마

| 필드 | JPA 엔티티 필드 | DB 타입 | 설명 | Phase |
|------|-----------------|---------|------|-------|
| `id` | `id` | `VARCHAR(36)` PK | UUID | 1 |
| `username` | `username` | `VARCHAR(50)` UNIQUE NOT NULL | **로그인용 아이디** | 1 |
| `password` | `password` | `VARCHAR(255)` NOT NULL | BCrypt | 1 |
| `nickname` | `nickname` | `VARCHAR(50)` | 화면 표시명 | 1 |
| `role` | `role` | `VARCHAR(20)` NOT NULL | `ROLE_ADMIN`, `ROLE_SUB_ADMIN`, `ROLE_USER` | 1 |
| `email` | `email` | `VARCHAR(100)` | 이메일 | 1 |
| `phone_number` | `phoneNumber` | `VARCHAR(20)` | 전화번호 | 1 |
| `grade` | `grade` | `VARCHAR(20)` DEFAULT `'GREEN_BEAN'` | 회원 등급 | 7 |
| `total_order_count` | `totalOrderCount` | `INT` DEFAULT `0` | 누적 주문 횟수 | 7 |
| `total_order_amount` | `totalOrderAmount` | `INT` DEFAULT `0` | 누적 주문 금액 | 7 |
| `point_balance` | `pointBalance` | `INT` DEFAULT `0` | 현재 포인트 잔액 | 9 |
| `is_enabled` | `isEnabled` | `BOOLEAN` DEFAULT `true` | 계정 활성 여부 (관리자 잠금용) | 8 |
| `deleted_at` | `deletedAt` | `TIMESTAMP` nullable | 탈퇴 요청 시각 (soft delete) | 8 |
| `created_at` | `createdAt` | `TIMESTAMP` | 가입일 | 1 |
| `updated_at` | `updatedAt` | `TIMESTAMP` | 수정일 | 1 |

### 새로운 `user_favorite_menus` 테이블

| 필드 | DB 타입 | 설명 |
|------|---------|------|
| `id` | `BIGINT` PK AUTO | - |
| `user_id` | `VARCHAR(36)` FK | users.id |
| `menu_id` | `BIGINT` FK | menus.id |
| `alias` | `VARCHAR(100)` | 사용자 지정 별칭 (예: "연하게 아아") — nullable, 미지정 시 메뉴명 사용 |
| `created_at` | `TIMESTAMP` | 등록일 |

### 새로운 `user_favorite_menu_options` 테이블

> 즐겨찾기에 저장된 **옵션 선택 조합**을 기록하는 테이블.
> 하나의 즐겨찾기(`user_favorite_menus`)에 여러 옵션 항목이 연결된다.

| 필드 | DB 타입 | 설명 |
|------|---------|------|
| `id` | `BIGINT` PK AUTO | - |
| `favorite_id` | `BIGINT` FK | user_favorite_menus.id (CASCADE DELETE) |
| `option_group_id` | `BIGINT` FK | option_groups.id |
| `option_item_id` | `BIGINT` FK | option_items.id |

### 새로운 `user_points` 테이블 (포인트 거래 내역)

| 필드 | DB 타입 | 설명 |
|------|---------|------|
| `id` | `BIGINT` PK AUTO | - |
| `user_id` | `VARCHAR(36)` FK | users.id |
| `type` | `VARCHAR(20)` NOT NULL | `EARN` (적립), `USE` (사용), `EXPIRE` (만료), `CANCEL` (취소 환불) |
| `amount` | `INT` NOT NULL | 포인트 수량 (적립: +, 사용/만료: -) |
| `balance` | `INT` NOT NULL | 거래 후 잔액 |
| `description` | `VARCHAR(200)` | 설명 (예: "주문 #1234 적립", "주문 #1235 사용") |
| `order_id` | `BIGINT` FK | 관련 주문 ID (nullable) |
| `expires_at` | `TIMESTAMP` | 포인트 만료일 (nullable, 적립 시만 설정) |
| `created_at` | `TIMESTAMP` | 거래일 |

### 권한 체계 (3단계)

| Role | 설명 | 접근 범위 |
|------|------|-----------|
| `ROLE_ADMIN` | 최고 관리자 | 모든 관리 기능 + **회원 권한 변경** |
| `ROLE_SUB_ADMIN` | 부관리자 | 메뉴·주문·매출·옵션·RAG·설정 관리 (회원 권한 변경 **불가**) |
| `ROLE_USER` | 일반 사용자 | 주문, 마이페이지 |

### 회원 등급 체계 (커피 로스팅 테마 4단계)

| 등급 | 영문명 | 컨셉 | 승급 조건 (예시) | 할인 혜택 | 적립률 |
|------|--------|------|-----------------|-----------|--------|
| 1단계 (신규) | **Green Bean** 🌱 | 볶지 않은 생두처럼 순수한 시작 | 가입 즉시 | - | 1% |
| 2단계 | **Golden Brown** ✨ | 볶기 시작하여 향이 피어나는 단계 | 누적 주문 10회 또는 5만원 | 2% 할인 | 2% |
| 3단계 | **Deep Brown** 🫘 | 진한 풍미가 완성된 단계 | 누적 주문 30회 또는 15만원 | 5% 할인 | 3% |
| 4단계 (최상위) | **Black Roast** 🖤 | 완벽한 로스팅의 정점 | 누적 주문 100회 또는 50만원 | 10% 할인 | 5% |

> ⚙️ 위 수치(할인 혜택, 적립률, 승급 조건)는 **초기 기본값**이며, 운영 중 관리자가 관리 페이지에서 동적으로 변경할 수 있다.  
> 상세 구현은 Phase 7 참조.

### 새로운 `grade_settings` 테이블 (등급별 설정 — 관리자 수정 가능)

> 등급별 할인율·적립률·승급 조건을 **하드코딩하지 않고 DB에서 관리**하여  
> 관리자가 운영 중에 동적으로 조정할 수 있도록 한다.

| 필드 | DB 타입 | 설명 |
|------|---------|------|
| `id` | `BIGINT` PK AUTO | - |
| `grade` | `VARCHAR(20)` UNIQUE NOT NULL | 등급 코드 (`GREEN_BEAN`, `GOLDEN_BROWN`, `DEEP_BROWN`, `BLACK_ROAST`) |
| `display_name` | `VARCHAR(50)` NOT NULL | 표시명 (예: "Green Bean 🌱") |
| `discount_rate` | `INT` NOT NULL DEFAULT `0` | 할인율 (%, 정수) |
| `earn_rate` | `INT` NOT NULL DEFAULT `1` | 포인트 적립률 (%, 정수) |
| `upgrade_order_count` | `INT` | 승급 필요 누적 주문 횟수 (NULL이면 횟수 조건 없음) |
| `upgrade_order_amount` | `INT` | 승급 필요 누적 주문 금액 (NULL이면 금액 조건 없음) |
| `sort_order` | `INT` NOT NULL DEFAULT `0` | 등급 순서 (1=최하위, 4=최상위) |
| `updated_at` | `TIMESTAMP` | 최종 수정일 |

---

## 📋 Phase별 구현 계획

### Phase 1: User 엔티티 확장 및 DB 스키마 변경
> **테스트 기준:** 서버 기동 시 새로운 필드가 포함된 User 테이블이 생성되고, 초기 사용자 데이터가 올바르게 입력된다.

#### 백엔드
- [x] `User.java` 엔티티에 `nickname`, `email`, `phoneNumber`, `createdAt`, `updatedAt` 필드 추가
- [x] `username`은 로그인 아이디 전용으로 변경 (`@Column(name = "username")`)
- [x] `nickname`은 별도 필드로 분리 (`@Column(name = "nickname")`)
- [x] `DataInitializer.java` 초기 사용자에 nickname, email, phoneNumber 추가
- [x] `UserJpaRepository`: `findByUsername` 유지 + `existsByUsername`, `existsByEmail` 추가

#### 프론트엔드
- [x] `SignupForm.tsx`: 닉네임(표시명), 이메일, 전화번호 입력 필드 추가
- [x] `authAPI.signup` 파라미터 확장
- [x] `useAuthStore.ts`의 `SessionUser` 인터페이스에 `phoneNumber` 추가

---

### Phase 2: 3단계 권한 체계 (ADMIN / SUB_ADMIN / USER)
> **테스트 기준:** `ROLE_SUB_ADMIN` 계정으로 로그인 시 `/admin` 페이지 접근 가능하되, 회원 관리 페이지에서 권한 변경 불가. `ROLE_ADMIN`만 권한 변경 가능.

#### 백엔드
- [x] `SecurityConfig.java`: `/admin/users/**` 엔드포인트에 `ROLE_ADMIN`만 접근 가능하도록 분리
- [x] `/admin/**` 나머지 엔드포인트는 `ROLE_ADMIN` 또는 `ROLE_SUB_ADMIN` 허용
- [x] `AdminUserController.java`: 회원 권한 변경 API 추가 (`PUT /admin/users/{id}/role`)
  - `ROLE_ADMIN`만 호출 가능, 자기 자신의 권한은 변경 불가
- [x] `DataInitializer.java`: `subadmin` 계정 `ROLE_SUB_ADMIN`으로 변경

#### 프론트엔드
- [x] `UserList.tsx`: 권한 드롭다운 셀렉트 추가 (ADMIN만 활성화, SUB_ADMIN은 보기/제한만 가능)
- [x] 3가지 권한 뱃지 스타일 추가 (`관리자` / `부관리자` / `일반회원`)
- [x] `AdminSidebar.tsx`: 모든 관리자가 회원 관리 메뉴 접근 가능하도록 허용
- [x] 로그인 시 `role` 값에 따른 라우트 가드 처리

---

### Phase 3: 사용자 마이페이지 (개인정보 수정)
> **테스트 기준:** 로그인한 사용자가 `/mypage`에서 닉네임, 이메일, 전화번호를 수정하고 저장하면 DB에 반영된다.

#### 백엔드
- [x] `UserProfileController.java` 신규 생성 (`/users/me`)
  - `GET /users/me` — 내 프로필 조회
  - `PUT /users/me` — 프로필 수정 (nickname, email, phoneNumber)
  - `PUT /users/me/password` — 비밀번호 변경 (기존 비밀번호 확인 후)
- [x] `UpdateUserProfileUseCase.java`, `UpdateUserProfileService.java` 구현 (조회 기능 포함)

#### 프론트엔드
- [x] `/mypage` 라우트 생성
- [x] 마이페이지 레이아웃 구성:
  - 프로필 카드 (닉네임, 이메일, 전화번호)
  - 비밀번호 변경 섹션
  - 프로필 이미지 (추후 확장 가능하도록 틀 분리 고려함)
- [x] `Header`에 마이페이지 링크 추가 (로그인 상태일 때)
- [x] 정보 수정 폼 + 유효성 검사

---

### Phase 4: 즐겨찾기 메뉴 기능 (옵션 포함)
> **테스트 기준:** 사용자가 메뉴 상세 페이지에서 옵션을 선택한 뒤 "즐겨찾기 저장" 버튼을 누르면 메뉴 + 선택 옵션 조합이 저장된다. 마이페이지에서 즐겨찾기 목록이 선택된 옵션과 함께 표시되고, "장바구니 담기" 클릭 시 동일한 옵션 조합으로 장바구니에 추가된다. **메뉴가 삭제·품절·숨김되거나 옵션이 삭제된 경우 주문 불가 상태로 표시된다.**

#### 백엔드
- [x] `UserFavoriteMenu` 엔티티 + `user_favorite_menus` 테이블 생성
- [x] `UserFavoriteMenuOption` 엔티티 + `user_favorite_menu_options` 테이블 생성
  - `@ManyToOne` → `UserFavoriteMenu` (cascade delete)
  - `optionGroupId`, `optionItemId` 저장
- [x] `UserFavoriteController.java` 신규 생성
  - `POST /users/me/favorites` — 즐겨찾기 추가
    - Request Body: `{ menuId, alias?, selectedOptions: [{ optionGroupId, optionItemId }] }`
  - `DELETE /users/me/favorites/{favoriteId}` — 즐겨찾기 삭제 (ID 기반)
  - `GET /users/me/favorites` — 즐겨찾기 목록 조회 (옵션 정보 포함)
  - `GET /users/me/favorites/check?menuId={menuId}` — 특정 메뉴 즐겨찾기 여부 확인
- [x] 즐겨찾기 조회 시 옵션 그룹명, 옵션 항목명, 추가 금액 정보를 JOIN하여 반환
- [x] 동일 메뉴라도 **옵션 조합이 다르면 별도 즐겨찾기**로 저장 가능 (예: "아메리카노 + ICE + 샷추가" vs "아메리카노 + HOT")
- [x] ⚠️ **즐겨찾기 유효성 검증 로직** 구현
  - 즐겨찾기 목록 조회(`GET /users/me/favorites`) 시 각 항목에 주문 가능 상태 정보 포함:
    - `orderable: boolean` — 최종 주문 가능 여부
    - `unavailableReason: string | null` — 주문 불가 사유
  - **주문 불가로 판정되는 경우:**
    | 상황 | `unavailableReason` 값 | 판정 기준 |
    |------|----------------------|----------|
    | 메뉴 삭제됨 | `MENU_DELETED` | `menus` 테이블에 해당 `menu_id` 없음 |
    | 메뉴 숨김 처리 | `MENU_HIDDEN` | `Menu.isAvailable == false` |
    | 메뉴 품절 | `MENU_SOLD_OUT` | `Menu.isSoldOut == true` |
    | 옵션 그룹 삭제됨 | `OPTION_GROUP_DELETED` | `option_groups`에 해당 `option_group_id` 없음 |
    | 옵션 항목 삭제됨 | `OPTION_ITEM_DELETED` | `option_items`에 해당 `option_item_id` 없음 |
  - 즐겨찾기에서 **"장바구니 담기"** 요청 시 서버에서 유효성 재검증 후 불가 시 에러 응답 반환
    - HTTP 409 Conflict + `{ reason: "MENU_SOLD_OUT" }` 형태 (프론트엔드에서 alert 처리로 구현)

#### 프론트엔드
- [x] 메뉴 상세 페이지(`/menus/[id]`)에 즐겨찾기 저장 버튼 추가
  - 옵션 선택 후 ★ 버튼 클릭 → 현재 선택된 옵션 조합을 즐겨찾기로 저장
  - 선택적으로 별칭(alias) 입력 모달 표시 (예: "연하게 아아")
- [x] 마이페이지 내 "즐겨찾기 메뉴" 섹션 구현
  - 각 즐겨찾기 카드에 표시: 메뉴 이미지, 메뉴명 (또는 별칭), 선택된 옵션 태그, 예상 금액
  - 각 카드에 **"장바구니 담기"** 버튼 → 저장된 옵션 조합 그대로 장바구니 추가 (원클릭)
  - 각 카드에 **삭제** 버튼
- [x] ⚠️ **주문 불가 즐겨찾기 UI 처리**
  - `orderable == false`인 카드: 반투명 오버레이 + 사유 배지 표시
    - 🚫 "메뉴가 삭제되었습니다" / 🔒 "숨김 처리된 메뉴입니다" / 📦 "품절" / ⚙️ "선택한 옵션이 변경되었습니다"
  - "장바구니 담기" 버튼 비활성화 (disabled + 툴팁으로 사유 안내)
  - **"주문 불가 즐겨찾기 정리"** 일괄 삭제 버튼 제공 (상단에 "N개의 주문 불가 항목이 있습니다" 배너)
- [x] 로그인 상태에서만 즐겨찾기 기능 활성화
- [x] 같은 메뉴의 다른 옵션 조합은 별도의 즐겨찾기 카드로 표시

---

### Phase 5: 내 주문 내역 및 자주 주문한 메뉴 Top
> **테스트 기준:** 마이페이지에서 내 주문 내역이 최신순으로 조회되고, 가장 자주 주문한 메뉴 Top 5가 표시된다.

#### 백엔드
- [x] `GET /users/me/orders` — 내 주문 내역 (이미 `/orders/my` 존재, 리팩토링)
- [x] `GET /users/me/top-menus` — 자주 주문한 메뉴 Top N 조회 API 신규 생성
  - 주문 아이템 테이블을 `userId` 기준으로 GROUP BY + COUNT 집계

#### 프론트엔드
- [x] 마이페이지 내 "주문 내역" 탭 구현
  - 기존 `/order/my` 로직 재활용, 마이페이지 내 통합
- [x] "자주 주문한 메뉴 Top 5" 카드 구현
  - 순위, 메뉴 이미지, 이름, 주문 횟수 표시
  - 클릭 시 해당 메뉴 상세로 이동
- [x] 마이페이지 탭 구조: `프로필` | `주문 내역` | `즐겨찾기` | `자주 주문한 메뉴`

---

### Phase 6: 회원 주문 시 개인정보 자동 입력
> **테스트 기준:** 로그인한 회원이 주문 확인 페이지에 진입하면, 이메일과 전화번호가 자동으로 채워져 있다.

#### 백엔드
- [x] `/auth/me` 응답에 `email`, `phoneNumber` 포함하도록 `MeResponse` 수정
- [x] 주문 생성 시 회원인 경우 `userId`로부터 이름/이메일/번호 자동 매핑

#### 프론트엔드
- [x] 주문 확인 페이지(`/order/confirm`): 로그인 상태일 때 `useAuthStore`의 사용자 정보로 이름, 이메일, 전화번호 필드 자동 채우기
- [x] 비회원은 기존대로 수동 입력

---

### Phase 7: 회원 등급 시스템 ☕
> **테스트 기준:** 주문 횟수/누적 금액에 따라 회원 등급이 자동 변경되고, 마이페이지에서 현재 등급과 다음 등급까지의 프로그레스가 표시된다. 등급별 할인율이 주문 시 자동 적용된다.
> 📌 등급 체계 및 `users` 테이블 확장 필드는 상단 **목표 상태 (TO-BE)** 참조

#### 백엔드
- [ ] `User.java` 엔티티에 등급 관련 필드 추가 (`grade`, `totalOrderCount`, `totalOrderAmount` — 스키마 상단 참조)
- [ ] `UserGrade` Enum 생성 — 등급 코드 정의 (실제 수치는 DB `grade_settings`에서 조회)
- [ ] `GradeSettings` 엔티티 + `grade_settings` 테이블 생성 (스키마 상단 참조)
- [ ] `UserGradeService.java` 신규 생성
  - 주문 완료 이벤트 발생 시 누적 횟수/금액 갱신 → **DB의 `grade_settings`에서 승급 조건 조회** → 조건 충족 시 자동 등급 변경
  - `GET /users/me/grade` — 현재 등급, 다음 등급 조건, 진행 상황 조회 (DB에서 동적으로 읽어옴)
- [ ] `AdminUserController.java`: 회원 등급 수동 변경 API 추가 (`PUT /admin/users/{id}/grade`)
- [ ] 주문 생성 시 회원 등급에 따른 할인율 자동 적용 로직 (**`grade_settings.discount_rate` 참조**)
- [ ] `DataInitializer.java`: 초기 사용자에 기본 등급(`GREEN_BEAN`) 설정 + **`grade_settings` 초기 데이터 삽입** (위 표의 기본값)
- [ ] ⚙️ **등급 설정 관리 API** 신규 생성 (`AdminGradeSettingsController.java`)
  - `GET /admin/grade-settings` — 전체 등급 설정 목록 조회
  - `PUT /admin/grade-settings/{grade}` — 등급별 설정 수정
    - Request Body: `{ discountRate, earnRate, upgradeOrderCount, upgradeOrderAmount }`
  - 수정 즉시 반영 (서버 재시작 불필요) — DB 기반이므로 별도 캐시 무효화 불필요
  - `ROLE_ADMIN`만 접근 가능 (부관리자도 조회는 가능하되 수정 불가)

#### 프론트엔드
- [ ] 관리자 회원 목록(`UserList.tsx`)에 **등급 변경 드롭다운** 추가 (관리자가 수동으로 등급 변경 가능하도록)
- [ ] 마이페이지 내 **등급 카드** 섹션 구현
  - 현재 등급 아이콘/이름/컨셉 설명
  - 다음 등급까지의 **프로그레스 바** (주문 횟수/금액 기준, **DB의 승급 조건 기준**)
  - 현재 적용 중인 할인율 표시
- [ ] `Header`에 등급 뱃지 아이콘 표시 (로그인 시)
- [ ] 주문 확인 페이지에 등급 할인 적용 내역 표시 (`할인: -500원 (Deep Brown 5%)`)
- [ ] 등급별 고유 색상/아이콘 디자인
  - 🌱 Green Bean: `#8BC34A` 연두
  - ✨ Golden Brown: `#D4A574` 골드
  - 🫘 Deep Brown: `#6D4C41` 브라운
  - 🖤 Black Roast: `#212121` 블랙 (프리미엄 느낌)
- [ ] ⚙️ **관리자 등급 설정 페이지** (`/admin/grade-settings`) 신규 생성
  - 4개 등급 카드를 나란히 표시하고, 각 카드에서 할인율·적립률·승급 조건을 인라인 편집 가능
  - 수정 후 "저장" 버튼 클릭 시 `PUT /admin/grade-settings/{grade}` 호출
  - 변경 전후 값 비교 표시 (예: `적립률: 2% → 3%`)
  - `AdminSidebar.tsx`에 "등급 설정" 메뉴 항목 추가

---

### Phase 8: 탈퇴 기능 및 계정 비활성화
> **테스트 기준:** 사용자가 마이페이지에서 계정 탈퇴를 요청하면 soft delete 처리되고, 30일 이내 복구 가능하다. 관리자가 특정 계정을 잠금(lock)하면 해당 계정으로 로그인이 불가능하다.

#### 백엔드
- [ ] `User.java` 엔티티에 필드 추가 (`isEnabled`, `deletedAt` — 스키마 상단 참조)
- [ ] `DELETE /users/me` — 계정 탈퇴 요청
  - 비밀번호 재확인 후 `deletedAt = now()` 설정 (즉시 삭제 아님)
  - 탈퇴 후 JWT 무효화 (로그아웃 처리)
- [ ] `POST /users/me/restore` — 탈퇴 취소 (30일 이내, 로그인 시 안내)
- [ ] `PUT /admin/users/{id}/lock` — 관리자 계정 잠금/해제 (`isEnabled` 토글)
- [ ] 로그인 시 `isEnabled == false`이면 "계정이 잠겨 있습니다" 에러 반환
- [ ] 로그인 시 `deletedAt != null`이면 "탈퇴 처리 중입니다. 복구하시겠습니까?" 안내
- [ ] 스케줄러: `deletedAt`이 30일 이상 경과한 계정 hard delete (배치)

#### 프론트엔드
- [ ] 마이페이지 내 **"계정 탈퇴"** 섹션 (하단, 위험 영역 스타일)
  - 비밀번호 재확인 모달 → 확인 시 탈퇴 처리
  - "탈퇴 후 30일 이내에 로그인하면 계정을 복구할 수 있습니다" 안내 문구
- [ ] 탈퇴 처리된 계정으로 로그인 시도 시 **복구 안내 모달** 표시
  - "탈퇴 요청일: YYYY-MM-DD" / "삭제 예정일: YYYY-MM-DD"
  - "계정 복구" 버튼 + "확인" 버튼
- [ ] 관리자 회원 목록(`UserList.tsx`)에 잠금 상태 표시 + 잠금/해제 토글 버튼

---

### Phase 9: 포인트/적립 시스템 🏦
> **테스트 기준:** 주문 완료 시 결제 금액의 일정 비율(등급별 차등)이 포인트로 적립된다. 주문 시 포인트를 사용하여 부분/전액 결제할 수 있고, 마이페이지에서 적립/사용 내역이 조회된다.

> 📌 `user_points` 테이블 스키마 및 등급별 적립률은 상단 **목표 상태 (TO-BE)** 참조

#### 백엔드
- [ ] `UserPoint` 엔티티 + `user_points` 테이블 생성
- [ ] `User.java`에 `pointBalance` (`INT`, 기본값 0) 필드 추가 — 현재 잔액 캐시
- [ ] `UserPointController.java` 신규 생성
  - `GET /users/me/points` — 현재 포인트 잔액 조회
  - `GET /users/me/points/history` — 적립/사용 내역 조회 (페이징)
- [ ] `UserPointService.java` 신규 생성
  - `earnPoints(userId, orderId, amount)` — 주문 완료 시 적립 (**`grade_settings.earn_rate`에서 등급별 적립률 동적 조회하여 적용**)
  - `usePoints(userId, orderId, amount)` — 주문 시 포인트 차감
  - `cancelPoints(userId, orderId)` — 주문 취소 시 포인트 환불
  - 잔액 부족 시 예외 처리
  - > ⚠️ 적립률을 Enum 상수가 아닌 **DB(`grade_settings`)에서 조회**하므로,  
    > 관리자가 적립률을 변경하면 다음 주문부터 즉시 반영됨
- [ ] 주문 생성 로직 수정
  - 요청 시 `usePoints` 금액 포함 → 총 결제액에서 포인트 차감
  - 주문 완료 시 실결제 금액 기준 포인트 적립 (포인트 결제 부분은 적립 제외)
- [ ] 스케줄러: 만료일 도래 포인트 자동 차감 (배치, 예: 적립일로부터 1년)

#### 프론트엔드
- [ ] 마이페이지 내 **"포인트"** 탭/섹션 구현
  - 현재 잔액 크게 표시 + 등급별 적립률 안내
  - 적립/사용 내역 타임라인 (날짜, 유형, 금액, 잔액)
  - 만료 예정 포인트 안내 ("🕔 7일 내 만료 예정: 500P")
- [ ] 주문 확인 페이지에 **포인트 사용** 섹션 추가
  - 사용 가능 포인트 표시 + 사용할 포인트 금액 입력 (또는 "전액 사용" 버튼)
  - 결제 요약: `상품 금액 - 등급 할인 - 포인트 사용 = 최종 결제액`
  - 예상 적립 포인트 미리보기 ("이 주문으로 150P 적립 예정")
- [ ] `Header`에 포인트 잔액 표시 (로그인 시, 등급 뱃지 옥)
- [ ] 마이페이지 탭 구조 확장: `프로필` | `주문 내역` | `즐겨찾기` | `자주 주문` | `포인트`

---

## 🌟 추천 추가 기능

### 추천 1: 프로필 이미지 업로드
- `/users/me/avatar`로 프로필 사진 업로드/삭제
- 관리자 사이드바, 마이페이지, 주문 상세에서 프로필 이미지 표시

### 추천 2: 주문 재주문 (Quick Reorder)
- 과거 주문 내역에서 "다시 주문하기" 버튼 → 동일 메뉴+옵션을 장바구니에 추가
- 자주 주문한 메뉴에서도 원클릭 장바구니 담기

### 추천 3: 회원 활동 로그 (Admin)
- 관리자 페이지에서 회원별 활동 이력 조회 (로그인, 주문, 설정 변경 등)
- 비정상 활동 감지 기초 자료

### 추천 4: 소셜 로그인 연동
- 카카오, 네이버, 구글 OAuth2 로그인
- 기존 계정과 소셜 계정 연동

---

## 🗂 파일 영향 범위 요약

### 백엔드 (주요 수정 파일)
| 파일 | Phase | 변경 내용 |
|------|-------|-----------|
| `User.java` | 1 | 필드 추가 (nickname, email, phoneNumber, timestamps) |
| `UserJpaRepository.java` | 1 | 쿼리 메서드 추가 |
| `SignupService.java` | 1 | 새 필드 반영 |
| `SignupUseCase.java` | 1 | Command에 필드 추가 |
| `AuthController.java` | 1, 6 | signup 파라미터 확장, me 응답 확장 |
| `SecurityConfig.java` | 2 | SUB_ADMIN 권한 추가, 엔드포인트 분리 |
| `AdminUserController.java` | 2 | 권한 변경 API 추가 |
| `DataInitializer.java` | 1, 2, 7 | 초기 사용자 데이터 확장, 기본 등급 설정 |
| **신규** `UserProfileController.java` | 3 | 프로필 조회/수정 API |
| **신규** `UserFavoriteController.java` | 4 | 즐겨찾기 CRUD (옵션 포함) |
| **신규** `UserFavoriteMenu.java` | 4 | 즐겨찾기 엔티티 |
| **신규** `UserFavoriteMenuOption.java` | 4 | 즐겨찾기 옵션 엔티티 |
| **신규** `UserGrade.java` (Enum) | 7 | 등급 코드 정의 (GREEN_BEAN ~ BLACK_ROAST) |
| **신규** `GradeSettings.java` (엔티티) | 7 | 등급별 할인율·적립률·승급 조건 DB 관리 |
| **신규** `AdminGradeSettingsController.java` | 7 | 등급 설정 조회/수정 API |
| **신규** `UserGradeService.java` | 7 | 등급 산정·승급 로직 (DB 설정 기반) |
| `User.java` | 7, 8, 9 | grade, totalOrderCount/Amount, isEnabled, deletedAt, pointBalance 추가 |
| **신규** `UserPoint.java` | 9 | 포인트 거래 엔티티 |
| **신규** `UserPointController.java` | 9 | 포인트 조회 API |
| **신규** `UserPointService.java` | 9 | 적립/사용/환불/만료 로직 (DB 적립률 참조) |

### 프론트엔드 (주요 수정/생성 파일)
| 파일 | Phase | 변경 내용 |
|------|-------|-----------|
| `SignupForm.tsx` | 1 | 입력 필드 확장 |
| `useAuthStore.ts` | 1 | SessionUser 인터페이스 확장 |
| `UserList.tsx` | 2, 7, 8 | 권한 변경 드롭다운, 등급 변경 드롭다운, 계정 잠금 토글 |
| `AdminSidebar.tsx` | 2 | SUB_ADMIN 메뉴 제한 |
| **신규** `/mypage/page.tsx` | 3, 7, 8, 9 | 마이페이지 메인, 등급 카드, 탈퇴 섹션, 포인트 탭 |
| **신규** `/mypage/layout.tsx` | 3-5, 9 | 탭 네비게이션 레이아웃 (포인트 탭 추가) |
| `/menus/[id]/page.tsx` | 4 | 즐겨찾기 버튼 |
| `/order/confirm/page.tsx` | 6, 7, 9 | 회원 정보 자동 입력, 등급 할인, 포인트 사용 |
| **신규** `/admin/grade-settings/page.tsx` | 7 | 등급별 할인율·적립률·승급 조건 관리 UI |

---

## ⚠️ 주의사항

1. **데이터 마이그레이션:** H2(개발) 환경에서는 `spring.jpa.hibernate.ddl-auto=create` 로 자동 처리되지만, 프로덕션 전환 시 Flyway/Liquibase 마이그레이션 스크립트 필요
2. **기존 주문 데이터 호환:** `userId` 필드가 이미 주문에 저장되어 있으므로 기존 주문 데이터와의 호환성 유지
3. **JWT 토큰 갱신:** User 엔티티 변경 시 기존 발급 토큰의 claims에 새 필드 반영 여부 결정
4. **비밀번호 정책:** Phase 3에서 비밀번호 변경 시 최소 길이, 복잡도 규칙 적용 권장
