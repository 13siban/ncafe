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

| 필드 | JPA 엔티티 필드 | DB 타입 | 설명 |
|------|-----------------|---------|------|
| `id` | `id` | `VARCHAR(36)` PK | UUID |
| `username` | `username` | `VARCHAR(50)` UNIQUE NOT NULL | **로그인용 아이디** |
| `password` | `password` | `VARCHAR(255)` NOT NULL | BCrypt |
| `nickname` | `nickname` | `VARCHAR(50)` | 화면 표시명 |
| `role` | `role` | `VARCHAR(20)` NOT NULL | `ROLE_ADMIN`, `ROLE_SUB_ADMIN`, `ROLE_USER` |
| `email` | `email` | `VARCHAR(100)` | 이메일 |
| `phone_number` | `phoneNumber` | `VARCHAR(20)` | 전화번호 |
| `created_at` | `createdAt` | `TIMESTAMP` | 가입일 |
| `updated_at` | `updatedAt` | `TIMESTAMP` | 수정일 |

### 새로운 `user_favorite_menus` 테이블

| 필드 | DB 타입 | 설명 |
|------|---------|------|
| `id` | `BIGINT` PK AUTO | - |
| `user_id` | `VARCHAR(36)` FK | users.id |
| `menu_id` | `BIGINT` FK | menus.id |
| `created_at` | `TIMESTAMP` | 등록일 |

### 권한 체계 (3단계)

| Role | 설명 | 접근 범위 |
|------|------|-----------|
| `ROLE_ADMIN` | 최고 관리자 | 모든 관리 기능 + **회원 권한 변경** |
| `ROLE_SUB_ADMIN` | 부관리자 | 메뉴·주문·매출·옵션·RAG·설정 관리 (회원 권한 변경 **불가**) |
| `ROLE_USER` | 일반 사용자 | 주문, 마이페이지 |

---

## 📋 Phase별 구현 계획

### Phase 1: User 엔티티 확장 및 DB 스키마 변경
> **테스트 기준:** 서버 기동 시 새로운 필드가 포함된 User 테이블이 생성되고, 초기 사용자 데이터가 올바르게 입력된다.

#### 백엔드
- [ ] `User.java` 엔티티에 `nickname`, `email`, `phoneNumber`, `createdAt`, `updatedAt` 필드 추가
- [ ] `username`은 로그인 아이디 전용으로 변경 (`@Column(name = "username")`)
- [ ] `nickname`은 별도 필드로 분리 (`@Column(name = "nickname")`)
- [ ] `DataInitializer.java` 초기 사용자에 nickname, email, phoneNumber 추가
- [ ] `UserJpaRepository`: `findByUsername` 유지 + `existsByUsername`, `existsByEmail` 추가

#### 프론트엔드
- [ ] `SignupForm.tsx`: 닉네임(표시명), 이메일, 전화번호 입력 필드 추가
- [ ] `authAPI.signup` 파라미터 확장
- [ ] `useAuthStore.ts`의 `SessionUser` 인터페이스에 `phoneNumber` 추가

---

### Phase 2: 3단계 권한 체계 (ADMIN / SUB_ADMIN / USER)
> **테스트 기준:** `ROLE_SUB_ADMIN` 계정으로 로그인 시 `/admin` 페이지 접근 가능하되, 회원 관리 페이지에서 권한 변경 불가. `ROLE_ADMIN`만 권한 변경 가능.

#### 백엔드
- [ ] `SecurityConfig.java`: `/admin/users/**` 엔드포인트에 `ROLE_ADMIN`만 접근 가능하도록 분리
- [ ] `/admin/**` 나머지 엔드포인트는 `ROLE_ADMIN` 또는 `ROLE_SUB_ADMIN` 허용
- [ ] `AdminUserController.java`: 회원 권한 변경 API 추가 (`PUT /admin/users/{id}/role`)
  - `ROLE_ADMIN`만 호출 가능, 자기 자신의 권한은 변경 불가
- [ ] `DataInitializer.java`: `subadmin` 계정 `ROLE_SUB_ADMIN`으로 변경

#### 프론트엔드
- [ ] `UserList.tsx`: 권한 드롭다운 셀렉트 추가 (ADMIN만 활성화)
- [ ] 3가지 권한 뱃지 스타일 추가 (`관리자` / `부관리자` / `일반회원`)
- [ ] `AdminSidebar.tsx`: `ROLE_SUB_ADMIN`일 때 회원 관리 메뉴 숨기기 또는 비활성화
- [ ] 로그인 시 `role` 값에 따른 라우트 가드 처리

---

### Phase 3: 사용자 마이페이지 (개인정보 수정)
> **테스트 기준:** 로그인한 사용자가 `/mypage`에서 닉네임, 이메일, 전화번호를 수정하고 저장하면 DB에 반영된다.

#### 백엔드
- [ ] `UserProfileController.java` 신규 생성 (`/users/me`)
  - `GET /users/me` — 내 프로필 조회
  - `PUT /users/me` — 프로필 수정 (nickname, email, phoneNumber)
  - `PUT /users/me/password` — 비밀번호 변경 (기존 비밀번호 확인 후)
- [ ] `UpdateUserProfileUseCase.java`, `UpdateUserProfileService.java` 구현

#### 프론트엔드
- [ ] `/mypage` 라우트 생성
- [ ] 마이페이지 레이아웃 구성:
  - 프로필 카드 (닉네임, 이메일, 전화번호)
  - 비밀번호 변경 섹션
  - 프로필 이미지 (추후 확장)
- [ ] `Header`에 마이페이지 링크 추가 (로그인 상태일 때)
- [ ] 정보 수정 폼 + 유효성 검사

---

### Phase 4: 즐겨찾기 메뉴 기능
> **테스트 기준:** 사용자가 메뉴 상세 페이지에서 하트 버튼을 눌러 즐겨찾기를 추가/해제할 수 있고, 마이페이지에서 즐겨찾기 목록이 조회된다.

#### 백엔드
- [ ] `UserFavoriteMenu` 엔티티 + `user_favorite_menus` 테이블 생성
- [ ] `UserFavoriteController.java` 신규 생성
  - `POST /users/me/favorites/{menuId}` — 즐겨찾기 추가
  - `DELETE /users/me/favorites/{menuId}` — 즐겨찾기 해제
  - `GET /users/me/favorites` — 즐겨찾기 목록 조회

#### 프론트엔드
- [ ] 메뉴 상세 페이지(`/menus/[id]`)에 하트(♥) 토글 버튼 추가
- [ ] 마이페이지 내 "즐겨찾기 메뉴" 섹션 구현 (메뉴 카드 그리드)
- [ ] 로그인 상태에서만 즐겨찾기 기능 활성화

---

### Phase 5: 내 주문 내역 및 자주 주문한 메뉴 Top
> **테스트 기준:** 마이페이지에서 내 주문 내역이 최신순으로 조회되고, 가장 자주 주문한 메뉴 Top 5가 표시된다.

#### 백엔드
- [ ] `GET /users/me/orders` — 내 주문 내역 (이미 `/orders/my` 존재, 리팩토링)
- [ ] `GET /users/me/top-menus` — 자주 주문한 메뉴 Top N 조회 API 신규 생성
  - 주문 아이템 테이블을 `userId` 기준으로 GROUP BY + COUNT 집계

#### 프론트엔드
- [ ] 마이페이지 내 "주문 내역" 탭 구현
  - 기존 `/order/my` 로직 재활용, 마이페이지 내 통합
- [ ] "자주 주문한 메뉴 Top 5" 카드 구현
  - 순위, 메뉴 이미지, 이름, 주문 횟수 표시
  - 클릭 시 해당 메뉴 상세로 이동
- [ ] 마이페이지 탭 구조: `프로필` | `주문 내역` | `즐겨찾기` | `자주 주문한 메뉴`

---

### Phase 6: 회원 주문 시 개인정보 자동 입력
> **테스트 기준:** 로그인한 회원이 주문 확인 페이지에 진입하면, 이메일과 전화번호가 자동으로 채워져 있다.

#### 백엔드
- [ ] `/auth/me` 응답에 `email`, `phoneNumber` 포함하도록 `MeResponse` 수정
- [ ] 주문 생성 시 회원인 경우 `userId`로부터 이름/이메일/번호 자동 매핑

#### 프론트엔드
- [ ] 주문 확인 페이지(`/order/confirm`): 로그인 상태일 때 `useAuthStore`의 사용자 정보로 이름, 이메일, 전화번호 필드 자동 채우기
- [ ] 비회원은 기존대로 수동 입력

---

## 🌟 추천 추가 기능

### 추천 1: 프로필 이미지 업로드
- `/users/me/avatar`로 프로필 사진 업로드/삭제
- 관리자 사이드바, 마이페이지, 주문 상세에서 프로필 이미지 표시

### 추천 2: 주문 재주문 (Quick Reorder)
- 과거 주문 내역에서 "다시 주문하기" 버튼 → 동일 메뉴+옵션을 장바구니에 추가
- 자주 주문한 메뉴에서도 원클릭 장바구니 담기

### 추천 3: 회원 등급 시스템
- 주문 횟수/금액에 따른 등급 (예: Bronze → Silver → Gold → VIP)
- 등급별 할인율 또는 특전 부여
- 마이페이지에 등급 프로그레스 바 표시

### 추천 4: 포인트/적립 시스템
- 결제 금액의 일정 비율 포인트 적립
- 포인트로 결제 가능 (부분/전액)
- 마이페이지에서 적립/사용 내역 조회

### 추천 5: 회원 활동 로그 (Admin)
- 관리자 페이지에서 회원별 활동 이력 조회 (로그인, 주문, 설정 변경 등)
- 비정상 활동 감지 기초 자료

### 추천 6: 탈퇴 기능 및 계정 비활성화
- 사용자 스스로 계정 탈퇴 (soft delete → 30일 후 hard delete)
- 관리자가 특정 계정 잠금(lock) 가능
- `isEnabled`, `deletedAt` 필드 추가

### 추천 7: 소셜 로그인 연동
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
| `DataInitializer.java` | 1, 2 | 초기 사용자 데이터 확장 |
| **신규** `UserProfileController.java` | 3 | 프로필 조회/수정 API |
| **신규** `UserFavoriteController.java` | 4 | 즐겨찾기 CRUD |
| **신규** `UserFavoriteMenu.java` | 4 | 즐겨찾기 엔티티 |

### 프론트엔드 (주요 수정/생성 파일)
| 파일 | Phase | 변경 내용 |
|------|-------|-----------|
| `SignupForm.tsx` | 1 | 입력 필드 확장 |
| `useAuthStore.ts` | 1 | SessionUser 인터페이스 확장 |
| `UserList.tsx` | 2 | 권한 변경 드롭다운 |
| `AdminSidebar.tsx` | 2 | SUB_ADMIN 메뉴 제한 |
| **신규** `/mypage/page.tsx` | 3 | 마이페이지 메인 |
| **신규** `/mypage/layout.tsx` | 3-5 | 탭 네비게이션 레이아웃 |
| `/menus/[id]/page.tsx` | 4 | 즐겨찾기 버튼 |
| `/order/confirm/page.tsx` | 6 | 회원 정보 자동 입력 |

---

## ⚠️ 주의사항

1. **데이터 마이그레이션:** H2(개발) 환경에서는 `spring.jpa.hibernate.ddl-auto=create` 로 자동 처리되지만, 프로덕션 전환 시 Flyway/Liquibase 마이그레이션 스크립트 필요
2. **기존 주문 데이터 호환:** `userId` 필드가 이미 주문에 저장되어 있으므로 기존 주문 데이터와의 호환성 유지
3. **JWT 토큰 갱신:** User 엔티티 변경 시 기존 발급 토큰의 claims에 새 필드 반영 여부 결정
4. **비밀번호 정책:** Phase 3에서 비밀번호 변경 시 최소 길이, 복잡도 규칙 적용 권장
