# 🏗️ NCAFE 기능 추가 청사진

> **작성일**: 2026-03-15  
> **전략**: 모든 Phase의 백엔드를 먼저 구현 → 빌드 & API 테스트 → 프론트엔드 구현 순서  
> **복잡도 순서**: 백엔드 구현량이 많은 기능부터 진행

---

## 🗄️ DB 변경사항 한눈에 보기

### 📌 신규 테이블

```sql
-- Phase 1: 공지 팝업
CREATE TABLE notice_popups (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,          -- 팝업 제목
    content     TEXT NOT NULL,                   -- 팝업 내용 (HTML 가능)
    image_url   VARCHAR(500),                    -- 팝업 이미지 (nullable)
    is_active   BOOLEAN NOT NULL DEFAULT false,  -- 활성화 여부
    start_date  TIMESTAMP,                       -- 노출 시작일 (nullable)
    end_date    TIMESTAMP,                       -- 노출 종료일 (nullable)
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### 📌 기존 테이블 컬럼 추가

```sql
-- Phase 2: 등급 컬러 속성
ALTER TABLE grade_settings
    ADD COLUMN main_color VARCHAR(7) NOT NULL DEFAULT '#333333',  -- 등급 메인 컬러
    ADD COLUMN text_color VARCHAR(7) NOT NULL DEFAULT '#FFFFFF';  -- 등급 텍스트 컬러
```

### 📌 변경 없음 (기존 테이블 활용)

| Phase | 기능 | 사용 테이블 | 비고 |
|-------|------|------------|------|
| 3 | 주문 알림 | `orders` | 기존 주문 데이터 조회, DB 변경 없음 |
| 4 | 메뉴 리스트 뷰 | `menus` | 기존 필드로 batch update |
| 5 | 메뉴 드래그앤드롭 | `menus.sort_order` | 기존 컬럼 활용 |
| 6 | 메뉴 품절 토글 | `menus.is_sold_out` | 기존 컬럼 활용 |

---

## 📋 Phase 개요 (복잡도 순)

| Phase | 기능 | BE 복잡도 | FE 복잡도 | 신규 테이블 |
|-------|------|-----------|-----------|------------|
| 1 | 공지 팝업 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ `notice_popups` |
| 2 | 등급 컬러 속성 + About 페이지 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ (기존 테이블 수정) |
| 3 | 어드민 주문 알림 (벨 아이콘 + 토스트) | ⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ |
| 4 | 어드민 메뉴 리스트 뷰 + 인라인 편집 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ |
| 5 | 어드민 메뉴 드래그앤드롭 정렬 | ⭐⭐ | ⭐⭐⭐ | ❌ |
| 6 | 어드민 메뉴 품절 상태 토글 | ⭐ | ⭐⭐ | ❌ |
| - | 전체 빌드 테스트 & API 테스트 | - | - | - |

---

## 🔧 실행 순서

```
[BE Phase 1] → [BE Phase 2] → [BE Phase 3] → [BE Phase 4] → [BE Phase 5] → [BE Phase 6]
                                    ↓
                        [ 🧪 전체 빌드 & API 테스트 ]
                                    ↓
[FE Phase 1] → [FE Phase 2] → [FE Phase 3] → [FE Phase 4] → [FE Phase 5] → [FE Phase 6]
                                    ↓
                        [ 🧪 전체 통합 테스트 ]
```

---

---

## Phase 1: 공지 팝업 기능

> 어드민에서 공지 팝업 내용을 설정하면, 사용자가 최초 접속 시 모달 팝업이 노출됨  
> 어느 페이지에서든 동작하며, "오늘 하루 안 보기" 등의 닫기 옵션 포함

### BE 체크리스트

- [ ] **DB 테이블 설계** — `notice_popups`
  - `id` (PK), `title`, `content` (TEXT/HTML), `image_url` (nullable)
  - `is_active` (boolean), `start_date`, `end_date` (nullable, 기간 제한용)
  - `created_at`, `updated_at`
- [ ] **JPA Entity** — `NoticePopupJpaEntity`
- [ ] **Repository** — `NoticePopupJpaRepository`
- [ ] **도메인 모델** — `NoticePopup`
- [ ] **UseCase** — `ManageNoticePopupUseCase`
  - `createPopup()`, `updatePopup()`, `deletePopup()`
  - `getAllPopups()`, `getActivePopups()` (현재 활성 + 기간 내)
- [ ] **Service** — `AdminNoticePopupService` implements UseCase
- [ ] **Controller** — `AdminNoticePopupController` (`/admin/notice-popups`)
  - `POST /admin/notice-popups` — 생성
  - `PUT /admin/notice-popups/{id}` — 수정
  - `DELETE /admin/notice-popups/{id}` — 삭제
  - `GET /admin/notice-popups` — 전체 목록 (어드민용)
- [ ] **공개 API Controller** — `NoticePopupController`
  - `GET /notice-popups/active` — 현재 활성 팝업 목록 (사용자 접속 시 호출)
- [ ] **DTO** — `CreateNoticePopupRequest`, `UpdateNoticePopupRequest`, `NoticePopupResponse`

### FE 체크리스트

- [ ] **어드민 페이지** — `/admin/notice-popups`
  - 팝업 목록 (활성/비활성 상태 표시)
  - 팝업 생성/수정 폼 (제목, HTML 내용, 이미지, 활성 여부, 기간 설정)
  - 팝업 삭제 기능
  - 미리보기 기능
- [ ] **사용자 모달 컴포넌트** — `NoticePopupModal`
  - 전역 레이아웃에 배치 (어느 페이지든 동작)
  - `GET /notice-popups/active` 호출하여 활성 팝업 확인
  - "오늘 하루 안 보기" 버튼 → `localStorage`에 날짜 기록
  - "닫기" 버튼
  - 여러 팝업이 있을 경우 순차 표시 또는 캐러셀
- [ ] **어드민 사이드바/네비게이션에 메뉴 추가**

### 테스트 TODO

- [ ] 팝업 CRUD API 정상 동작 확인
- [ ] 활성 팝업 필터링 (is_active + 기간) 정상 동작
- [ ] 비로그인 사용자도 공지 팝업 확인 가능
- [ ] "오늘 하루 안 보기" 작동 확인 (localStorage)
- [ ] 활성 팝업 없을 시 모달 미노출 확인
- [ ] 복수 팝업 동시 활성 시 정상 표시 확인
- [ ] 어드민 권한 없는 사용자가 관리 API 접근 불가 확인

---

## Phase 2: 등급 컬러 속성 + About 페이지 등급 안내

> 등급에 mainColor, textColor 속성 추가  
> 마이페이지 등급 카드에 해당 컬러 테마 적용  
> About 페이지에 등급 안내 섹션 추가 (각 등급별 테마 적용)  
> 등급 기능 미사용 시 섹션 미노출 + API 미호출

### BE 체크리스트

- [ ] **DB 컬럼 추가** — `grade_settings` 테이블
  - `main_color` (VARCHAR, default `#333333`)
  - `text_color` (VARCHAR, default `#FFFFFF`)
- [ ] **JPA Entity 수정** — `GradeSettingsJpaEntity`에 `mainColor`, `textColor` 필드 추가
- [ ] **도메인 모델 수정** — `GradeSettings`에 컬러 필드 추가
- [ ] **DTO 수정** — `CreateGradeSettingsRequest`, 등급 응답 DTO에 컬러 필드 포함
- [ ] **Service 수정** — `AdminGradeSettingsService`에서 컬러 저장/반환 로직
- [ ] **공개 API** — 등급 목록 공개 조회 (About 페이지용)
  - `GET /grades/public` — 등급 시스템 활성 시에만 목록 반환
  - 응답에 `gradeName`, `displayName`, `earnRate`, `mainColor`, `textColor`, `upgradeOrderCount`, `upgradeOrderAmount` 포함
  - 등급 시스템 비활성 시 빈 배열 또는 404 반환
- [ ] **기존 API 수정** — 등급 관련 응답에 컬러 정보 포함
  - `GET /users/me/grade` 응답에 `mainColor`, `textColor` 추가
  - `GET /admin/grade-settings` 응답에 컬러 포함

### FE 체크리스트

- [ ] **어드민 등급 설정 페이지** — 등급 카드에 컬러 피커 추가
  - mainColor, textColor 각각 컬러 피커 또는 텍스트 입력
  - 실시간 미리보기 (카드 헤더에 선택한 컬러 반영)
- [ ] **마이페이지 등급 카드** — 사용자 등급의 `mainColor`, `textColor` 적용
  - 등급 카드 배경색/텍스트색을 API 응답 기반으로 동적 적용
- [ ] **About 페이지 등급 안내 섹션**
  - `GET /grades/public` 호출
  - 등급 시스템 비활성 시: API 호출하지 않음 + 섹션 자체 미노출
  - 등급 시스템 활성 시: 각 등급별 카드 UI (mainColor/textColor 테마 적용)
  - 승급 조건 안내 (주문 횟수, 주문 금액)
  - 혜택 안내 (적립률)

### 테스트 TODO

- [ ] 등급 설정에서 컬러 저장/수정 정상 동작
- [ ] 마이페이지 등급 카드에 컬러 동적 적용 확인
- [ ] About 페이지에서 등급 목록 정상 렌더링
- [ ] About 페이지에서 각 등급별 고유 컬러 테마 적용 확인
- [ ] 등급 시스템 비활성 시 About 페이지에 등급 섹션 미노출 확인
- [ ] 등급 시스템 비활성 시 `/grades/public` API 호출 없음 확인
- [ ] 컬러 미설정 등급의 기본 컬러 fallback 확인

---

## Phase 3: 어드민 주문 알림 (벨 아이콘 + 토스트)

> 어드민 헤더에 종(벨) 아이콘 추가  
> 새 주문 들어오면 벨 아이콘 배경이 깜빡이며 하이라이트  
> 알림 토스트 메시지 표시

### BE 체크리스트

- [ ] **SSE(Server-Sent Events) 엔드포인트** 또는 **Polling 엔드포인트**
  - **방법 A (SSE 추천)**: `GET /admin/orders/subscribe` — SSE 스트림
    - 새 주문 생성 시 이벤트 발행
    - `SseEmitter`를 사용한 실시간 알림
    - 주문 서비스(`CreateOrderService`)에서 주문 생성 후 이벤트 발행
  - **방법 B (Polling 대안)**: `GET /admin/orders/new-count?since={timestamp}`
    - 특정 시간 이후 신규 주문 수 반환
    - 프론트에서 5~10초 간격으로 폴링
- [ ] **이벤트 발행 로직** (SSE 방식 선택 시)
  - `OrderNotificationService` 생성
  - `SseEmitter` 관리 (연결/해제/전송)
  - `CreateOrderService`에서 주문 생성 후 `OrderNotificationService.notify()` 호출
- [ ] **알림 데이터 DTO** — `OrderNotificationDto`
  - `orderId`, `displayNumber`, `customerName`, `totalPrice`, `summary`, `createdAt`

### FE 체크리스트

- [ ] **어드민 헤더 벨 아이콘** — 항상 노출
  - 기본: 일반 벨 아이콘
  - 새 주문: 벨 아이콘 옆 빨간 dot + 배경 깜빡이는 CSS 애니메이션
  - 클릭 시: 주문 관리 페이지로 이동 + 알림 상태 리셋
- [ ] **토스트 컴포넌트** — `OrderToast`
  - 새 주문 알림 시 화면 우상단에 슬라이드인
  - "🔔 새 주문이 들어왔습니다! #번호 - 메뉴요약"
  - 5초 후 자동 사라짐 또는 클릭으로 닫기
  - 클릭 시 해당 주문 상세로 이동
- [ ] **SSE/Polling 연결 관리**
  - 어드민 레이아웃에서 SSE 연결 (또는 폴링 시작)
  - 언마운트 시 연결 해제
  - 재연결 로직 (SSE 끊김 시)
- [ ] **사운드 알림 (선택)**
  - 새 주문 시 알림음 재생 (선택적 구현)

### 테스트 TODO

- [ ] 새 주문 생성 시 SSE/폴링으로 알림 수신 확인
- [ ] 벨 아이콘 깜빡임 애니메이션 정상 동작
- [ ] 토스트 메시지 표시 및 자동 사라짐 확인
- [ ] 벨 아이콘 클릭 시 주문 페이지 이동 + 알림 리셋
- [ ] SSE 연결 끊김 후 재연결 확인
- [ ] 어드민이 아닌 사용자는 SSE 구독 불가 확인
- [ ] 복수 어드민 동시 접속 시 모두 알림 수신 확인
- [ ] 브라우저 탭 전환 후에도 알림 정상 수신 확인

---

## Phase 4: 어드민 메뉴 리스트 뷰 + 인라인 편집

> 기존 카드형 메뉴 목록과 별개로, 이미지 없는 리스트 형태로 전환 가능  
> 리스트에서 메뉴 이름, 가격, 카테고리 등을 바로 수정 가능  
> 드래그앤드롭도 리스트 뷰에서 지원

### 구현 방식 추천

> **추천 방안: 같은 페이지 내 뷰 전환 (토글 버튼)**
>
> | 방안 | 장점 | 단점 |
> |------|------|------|
> | **A. 같은 페이지 내 토글** ⭐ | 상태 유지, UX 자연스러움 | 컴포넌트 복잡도 증가 |
> | B. 별도 페이지 (`/admin/menus/list`) | 분리가 깔끔, 독립 개발 | 페이지 이동 시 상태 초기화 |
> | C. 탭 UI | 직관적 | 탭이 많아지면 복잡 |
>
> **추천: 방안 A** — 우측 상단에 **그리드/리스트 아이콘 토글 버튼**을 두고,
> 내부적으로 `viewMode` state에 따라 `<MenuGrid />` 또는 `<MenuListTable />` 
> 컴포넌트를 교체하는 방식. 필터/검색 상태가 뷰 전환 시에도 유지됩니다.

### BE 체크리스트

- [ ] **Batch Update API** — `PUT /admin/menus/batch`
  - 여러 메뉴의 간단한 필드를 한 번에 업데이트
  - body: `[{ menuId, korName, price, categoryId, isAvailable, isSoldOut, sortOrder }]`
- [ ] **Inline Update API 확인** — 기존 `PUT /admin/menus/{id}` 엔드포인트 활용 가능 여부 확인
  - 개별 필드만 변경 가능하도록 partial update 지원

### FE 체크리스트

- [ ] **뷰 전환 토글 버튼** — 그리드 아이콘 ↔ 리스트 아이콘
  - `viewMode` state: `'grid' | 'list'`
  - localStorage에 사용자 선호 뷰 저장
- [ ] **`MenuListTable` 컴포넌트** (신규)
  - 테이블 형태: 순서 | 이름 | 가격 | 카테고리 | 상태(판매/숨김/품절) | 액션
  - 각 셀 클릭 시 인라인 편집 모드 전환 (input으로 변경)
  - Enter 또는 blur 시 저장, Esc 시 취소
  - 행 끝에 "상세" 버튼 → 기존 메뉴 수정 모달/페이지로 이동
- [ ] **드래그앤드롭** — 리스트 뷰에서도 행 드래그로 순서 변경
  - 드래그 핸들 (☰ 아이콘) 좌측 배치
- [ ] **Batch 저장** — 여러 항목 수정 시 "변경사항 저장" 버튼 표시
  - 수정된 행 하이라이트
  - 저장 시 batch API 호출

### 테스트 TODO

- [ ] 그리드 ↔ 리스트 뷰 전환 정상 동작
- [ ] 뷰 전환 시 필터/검색 상태 유지 확인
- [ ] 인라인 편집 후 저장 정상 동작
- [ ] 인라인 편집 Esc 취소 확인
- [ ] Batch 업데이트 API 정상 동작
- [ ] 리스트 뷰에서 드래그앤드롭 순서 변경 확인
- [ ] localStorage에 뷰 모드 선호 저장/복원 확인

---

## Phase 5: 어드민 메뉴 드래그앤드롭 정렬

> 그리드(카드) 뷰에서 이미지 위에 이동 핸들(드래그 버튼) 표시  
> 핸들을 드래그하면 메뉴 카드가 이동되어 순서(sortOrder) 변경

### BE 체크리스트

- [ ] **Sort Order Batch Update API** — `PUT /admin/menus/reorder`
  - body: `[{ menuId: 1, sortOrder: 0 }, { menuId: 3, sortOrder: 1 }, ...]`
  - 카테고리 내 또는 전체 메뉴의 sortOrder를 일괄 업데이트
- [ ] **Service** — `AdminMenuService.reorderMenus(List<ReorderRequest>)`
  - 각 메뉴의 `sortOrder` 업데이트

### FE 체크리스트

- [ ] **드래그 핸들 UI** — 메뉴 카드 이미지 좌상단에 이동 아이콘 (☰ 또는 ⠿)
  - 호버 시에만 표시 또는 항상 표시 (반투명)
  - 핸들에 `cursor: grab` / `cursor: grabbing`
- [ ] **DnD 라이브러리 선택**
  - 추천: `@dnd-kit/core` + `@dnd-kit/sortable` (가볍고 접근성 우수)
  - 대안: `react-beautiful-dnd` (익숙한 API, 하지만 유지보수 중단)
  - 대안: 네이티브 HTML5 Drag & Drop (라이브러리 없이)
- [ ] **드래그 동작 구현**
  - 같은 카테고리 내에서만 이동 또는 전체 이동 허용
  - 드래그 중 플레이스홀더 표시
  - 드롭 시 `PUT /admin/menus/reorder` 호출
- [ ] **정렬 변경 시 시각적 피드백**
  - 드래그 중 원래 위치에 빈 공간 표시
  - 드롭 완료 시 성공 토스트

### 테스트 TODO

- [ ] 드래그 핸들을 통해서만 드래그 시작 확인
- [ ] 카드 외 영역 드래그 시 미동작 확인
- [ ] 드래그 후 정렬 순서 서버 저장 확인
- [ ] 페이지 새로고침 후 변경된 순서 유지 확인
- [ ] 카테고리 필터 적용 중 드래그 정상 동작

---

## Phase 6: 어드민 메뉴 품절 상태 토글

> admin/menus 에서 각 메뉴의 품절 상태를 확인하고 쉽게 토글

### BE 체크리스트

- [ ] **품절 토글 API 확인/추가** — `PATCH /admin/menus/{id}/sold-out`
  - body: `{ isSoldOut: true/false }`
  - 기존 API에 포함되어 있는지 확인 → 없으면 추가
- [ ] **기존 메뉴 목록 API 응답에 `isSoldOut` 포함 여부 확인**

### FE 체크리스트

- [ ] **그리드(카드) 뷰**
  - 품절 메뉴: 이미지에 "품절" 오버레이 + 반투명 처리
  - 품절 토글 버튼: 카드 하단 또는 액션 메뉴에 "품절 설정/해제" 버튼
  - 즉시 반영 (optimistic update)
- [ ] **리스트 뷰** (Phase 4와 연계)
  - 상태 컬럼에 품절 뱃지 표시
  - 토글 스위치로 품절 상태 변경

### 테스트 TODO

- [ ] 품절 토글 API 정상 동작 확인
- [ ] 품절 상태 변경 후 UI 즉시 반영 확인
- [ ] 품절 메뉴가 사용자 페이지에서 "품절" 표시 확인
- [ ] 품절 메뉴 주문 시 주문 불가 처리 확인

---

---

## 🧪 전체 빌드 & API 테스트 (BE 완료 후)

> 모든 Phase의 백엔드 구현이 완료된 후, 빌드 및 API 테스트를 일괄 수행합니다.

### 빌드 테스트

- [ ] `./gradlew bootJar -x test` 성공 확인
- [ ] Docker 빌드 성공 확인 (`docker compose up -d --build backend`)
- [ ] 서버 정상 기동 확인 (로그에 에러 없음)
- [ ] Hibernate DDL 자동 업데이트 정상 확인 (새 테이블/컬럼 생성)

### API 테스트 (Phase별)

#### Phase 1: 공지 팝업

- [ ] `POST /admin/notice-popups` — 팝업 생성
- [ ] `GET /admin/notice-popups` — 전체 목록 조회
- [ ] `PUT /admin/notice-popups/{id}` — 수정
- [ ] `DELETE /admin/notice-popups/{id}` — 삭제
- [ ] `GET /notice-popups/active` — 활성 팝업 조회 (비인증)

#### Phase 2: 등급 컬러

- [ ] `PUT /admin/grade-settings/{grade}` — 컬러 포함 저장
- [ ] `GET /admin/grade-settings` — 컬러 포함 응답 확인
- [ ] `GET /grades/public` — 등급 시스템 활성 시 목록 반환
- [ ] `GET /grades/public` — 등급 시스템 비활성 시 빈 반환

#### Phase 3: 주문 알림

- [ ] `GET /admin/orders/subscribe` — SSE 연결 성공 (또는 polling 엔드포인트)
- [ ] 새 주문 생성 후 SSE 이벤트 수신 확인

#### Phase 4: 메뉴 리스트 뷰

- [ ] `PUT /admin/menus/batch` — 배치 업데이트 정상 동작

#### Phase 5: 메뉴 드래그앤드롭

- [ ] `PUT /admin/menus/reorder` — sortOrder 일괄 업데이트

#### Phase 6: 메뉴 품절

- [ ] `PATCH /admin/menus/{id}/sold-out` — 품절 토글

---

## 🧪 전체 통합 테스트 (FE 완료 후)

> 프론트엔드까지 완료 후 실제 사용 시나리오 기반 통합 테스트

- [ ] **공지 팝업**: 어드민에서 팝업 생성 → 사용자 페이지 접속 → 팝업 표시 → 오늘 하루 안 보기 → 새로고침 시 미표시
- [ ] **등급 컬러**: 어드민에서 등급 컬러 설정 → 마이페이지 등급 카드 컬러 반영 → About 페이지 등급 섹션 컬러 반영
- [ ] **등급 미사용**: 등급 시스템 비활성화 → About 페이지 등급 섹션 미노출 + API 미호출
- [ ] **주문 알림**: 사용자 주문 → 어드민 벨 아이콘 깜빡임 + 토스트 표시 → 벨 클릭 → 주문 페이지 이동
- [ ] **메뉴 리스트 뷰**: 뷰 전환 → 인라인 편집 → 저장 → 그리드 뷰로 전환 → 변경 사항 반영 확인
- [ ] **메뉴 드래그앤드롭**: 그리드 뷰에서 핸들 드래그 → 순서 변경 → 새로고침 → 순서 유지 확인
- [ ] **메뉴 품절**: 품절 토글 → 사용자 페이지에서 품절 표시 → 품절 메뉴 장바구니 담기 시 불가 확인

---

## 📎 참고사항

### 기술 스택
- **BE**: Spring Boot, JPA/Hibernate, SSE (`SseEmitter`)
- **FE**: Next.js (App Router), React, CSS Modules
- **DnD**: `@dnd-kit` 추천 (Phase 4, 5)

### 기존 파일 참고
- 등급 관련: `AdminGradeSettingsService.java`, `GradeSettingsJpaEntity.java`
- 메뉴 관련: `AdminMenuController.java`, `AdminMenuService.java`
- 주문 관련: `CreateOrderService.java`, `AdminOrderController.java`
- 어드민 레이아웃: `frontend/app/admin/layout.tsx`
