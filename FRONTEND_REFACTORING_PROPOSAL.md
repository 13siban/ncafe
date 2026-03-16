# 프론트엔드 리팩토링 제안서

> 작성일: 2026-03-16  
> 대상: `/frontend` 디렉토리 전체

---

## 1. 현재 구조 진단

### 1-1. 파일 크기 기준 문제 파일 (Top 15)

| 파일 | 라인 수 | 문제 |
|------|---------|------|
| `app/mypage/page.tsx` | **619줄** | 🔴 단일 파일에 프로필/비밀번호/주문내역/즐겨찾기/탈퇴 등 모든 섹션 |
| `components/chat/ChatWidget.tsx` | **560줄** | 🔴 채팅 UI + 로직 + 카트 연동이 한 파일에 혼재 |
| `app/order/confirm/page.tsx` | **417줄** | 🔴 주문확인 전체 로직이 단일 page.tsx, `_components` 없음 |
| `app/admin/grade-settings/page.tsx` | **398줄** | 🔴 등급 설정 전체가 단일 page.tsx, `_components` 없음 |
| `app/admin/rag/page.tsx` | **367줄** | 🟡 RAG 관리 전체가 단일 page.tsx, `_components` 없음 |
| `components/menu/MenuList/MenuList.tsx` | **318줄** | 🟡 메뉴 리스트 + 필터 + 정렬 로직 혼재 |
| `app/admin/menus/_components/MenuList/MenuList.tsx` | **310줄** | 🟡 관리자 메뉴 리스트 |
| `app/menus/[id]/page.tsx` | **277줄** | 🟡 메뉴 상세 전체가 단일 page.tsx |
| `app/admin/settings/page.tsx` | **250줄** | 🟡 설정 페이지, 일부만 `_components` 분리 |
| `components/auth/LoginForm.tsx` | **245줄** | 🟡 구글 버튼 컴포넌트가 같은 파일에 인라인 정의 |
| `components/auth/SignupForm.tsx` | **217줄** | 🟡 구글 버튼 컴포넌트가 같은 파일에 인라인 정의 |
| `app/order/my/page.tsx` | **152줄** | 🟢 단일 파일이지만 `_components` 없음 |

### 1-2. 구조적 문제 요약

#### ❌ 폴더/모듈 컨벤션 위반
```
# 현재 (문제)
components/auth/
  ├── LoginForm.tsx          ← 단독 파일 (폴더 없음)
  ├── LoginForm.module.css   ← 모듈은 있으나 SignupForm과 공유
  ├── SignupForm.tsx          ← 단독 파일 (폴더 없음)
  └── AuthErrorHandler.tsx

components/chat/
  ├── ChatWidget.tsx          ← 단독 파일 (폴더 없음)
  └── ChatWidget.module.css

components/common/
  ├── NoticePopupModal.tsx    ← 단독 파일 (폴더 없음)
  ├── NoticePopupModal.module.css
  └── index.ts
```

#### ❌ _components 폴더 누락 (page.tsx가 거대한 페이지들)
```
app/mypage/           ← _components 없음 (619줄)
app/order/confirm/    ← _components 없음 (417줄)
app/order/my/         ← _components 없음 (152줄)
app/admin/grade-settings/  ← _components 없음 (398줄)
app/admin/rag/        ← _components 없음 (367줄)
```

#### ❌ 중복 코드
- `LoginForm.tsx`와 `SignupForm.tsx`에 `CustomGoogleLoginButton` 컴포넌트가 **복붙**으로 존재
- `LoginForm.module.css`를 SignupForm도 공유 → 각자 전용 CSS 모듈이 없음

#### ❌ 관심사 혼재
- `ChatWidget.tsx` (560줄): UI 렌더링 + 메시지 처리 + 카트 연동 + 스트리밍 로직이 전부 한 파일
- `mypage/page.tsx` (619줄): 프로필 수정 + 비밀번호 변경 + 주문 내역 + 즐겨찾기 + 계정 탈퇴가 전부 한 파일

---

## 2. 리팩토링 규칙

### 컨벤션 원칙

1. **모든 컴포넌트는 폴더로 존재**하며, 같은 이름의 `.tsx` + `.module.css` 파일을 포함한다
2. **`index.ts`로 re-export**하여 import 경로를 깔끔하게 유지한다
3. **page.tsx는 150줄 이하**로 유지하며, 나머지는 `_components/`에 분리한다
4. **공유 컴포넌트는 `components/`**, 페이지 전용 컴포넌트는 해당 페이지의 `_components/`에 배치한다

### 폴더 구조 예시
```
ComponentName/
  ├── ComponentName.tsx         # 컴포넌트 로직
  ├── ComponentName.module.css  # 전용 스타일
  └── index.ts                  # export { default } from './ComponentName'
```

---

## 3. 리팩토링 상세 계획

### Phase 1: 🔴 긴급 (600줄 이상 파일)

#### 3-1. `app/mypage/page.tsx` (619줄 → 약 80줄)

현재 단일 파일에 5개 이상의 섹션이 포함되어 있음.

```
app/mypage/
  ├── page.tsx                          # 탭 전환 + 레이아웃만 담당
  ├── mypage.module.css                 # 공통 레이아웃 스타일만 유지
  └── _components/
      ├── ProfileSection/
      │   ├── ProfileSection.tsx        # 닉네임/이메일/전화번호 수정
      │   ├── ProfileSection.module.css
      │   └── index.ts
      ├── PasswordSection/
      │   ├── PasswordSection.tsx       # 비밀번호 변경 (소셜 로그인 시 숨김)
      │   ├── PasswordSection.module.css
      │   └── index.ts
      ├── OrderHistory/
      │   ├── OrderHistory.tsx          # 주문 내역 + 자주 시킨 메뉴
      │   ├── OrderHistory.module.css
      │   └── index.ts
      ├── FavoritesList/
      │   ├── FavoritesList.tsx         # 즐겨찾기 목록
      │   ├── FavoritesList.module.css
      │   └── index.ts
      └── DeleteAccount/
          ├── DeleteAccount.tsx         # 계정 탈퇴 (소셜 로그인 분기 포함)
          ├── DeleteAccount.module.css
          └── index.ts
```

#### 3-2. `components/chat/ChatWidget.tsx` (560줄 → 약 100줄)

```
components/chat/
  └── ChatWidget/
      ├── ChatWidget.tsx                # 메인 컨테이너 (열기/닫기 + 조합)
      ├── ChatWidget.module.css         # 공통 레이아웃 스타일
      ├── index.ts
      ├── ChatHeader/
      │   ├── ChatHeader.tsx            # 챗봇 헤더 (제목, 닫기 버튼)
      │   ├── ChatHeader.module.css
      │   └── index.ts
      ├── ChatMessages/
      │   ├── ChatMessages.tsx          # 메시지 목록 렌더링
      │   ├── ChatMessages.module.css
      │   └── index.ts
      ├── ChatInput/
      │   ├── ChatInput.tsx             # 입력 폼 + 전송 버튼
      │   ├── ChatInput.module.css
      │   └── index.ts
      └── ChatMessageBubble/
          ├── ChatMessageBubble.tsx      # 개별 메시지 버블 (봇/사용자)
          ├── ChatMessageBubble.module.css
          └── index.ts
```

### Phase 2: 🟠 중요 (300~600줄 파일)

#### 3-3. `app/order/confirm/page.tsx` (417줄 → 약 80줄)

```
app/order/confirm/
  ├── page.tsx                          # 레이아웃만
  ├── page.module.css
  └── _components/
      ├── OrderItemList/
      │   ├── OrderItemList.tsx         # 주문 상품 목록
      │   ├── OrderItemList.module.css
      │   └── index.ts
      ├── PaymentMethod/
      │   ├── PaymentMethod.tsx         # 결제 수단 선택
      │   ├── PaymentMethod.module.css
      │   └── index.ts
      ├── PointsUsage/
      │   ├── PointsUsage.tsx           # 포인트 사용
      │   ├── PointsUsage.module.css
      │   └── index.ts
      └── OrderSummary/
          ├── OrderSummary.tsx           # 최종 금액 + 주문 버튼
          ├── OrderSummary.module.css
          └── index.ts
```

#### 3-4. `app/admin/grade-settings/page.tsx` (398줄 → 약 60줄)

```
app/admin/grade-settings/
  ├── page.tsx
  ├── page.module.css
  └── _components/
      ├── GradeCard/
      │   ├── GradeCard.tsx             # 개별 등급 카드
      │   ├── GradeCard.module.css
      │   └── index.ts
      ├── GradeEditModal/
      │   ├── GradeEditModal.tsx        # 등급 수정 모달
      │   ├── GradeEditModal.module.css
      │   └── index.ts
      └── GradeBenefits/
          ├── GradeBenefits.tsx          # 등급 혜택 표시
          ├── GradeBenefits.module.css
          └── index.ts
```

#### 3-5. `app/admin/rag/page.tsx` (367줄 → 약 60줄)

```
app/admin/rag/
  ├── page.tsx
  ├── page.module.css
  └── _components/
      ├── DocumentUploader/
      │   ├── DocumentUploader.tsx
      │   ├── DocumentUploader.module.css
      │   └── index.ts
      ├── DocumentList/
      │   ├── DocumentList.tsx
      │   ├── DocumentList.module.css
      │   └── index.ts
      └── RagSettings/
          ├── RagSettings.tsx
          ├── RagSettings.module.css
          └── index.ts
```

#### 3-6. `app/menus/[id]/page.tsx` (277줄 → 약 60줄)

```
app/menus/[id]/
  ├── page.tsx
  ├── page.module.css
  ├── types.ts
  └── _components/
      ├── MenuDetailGallery/            # 이미 존재
      ├── MenuDetailInfo/
      │   ├── MenuDetailInfo.tsx        # 메뉴 기본 정보 (이름, 가격, 설명)
      │   ├── MenuDetailInfo.module.css
      │   └── index.ts
      ├── MenuOptionSelector/
      │   ├── MenuOptionSelector.tsx    # 옵션 선택 UI
      │   ├── MenuOptionSelector.module.css
      │   └── index.ts
      └── MenuOrderActions/
          ├── MenuOrderActions.tsx       # 수량 선택 + 장바구니/바로주문
          ├── MenuOrderActions.module.css
          └── index.ts
```

### Phase 3: 🟡 개선 (공유 컴포넌트 정리)

#### 3-7. `components/auth/` 폴더 구조 개선

```
# AS-IS
components/auth/
  ├── LoginForm.tsx
  ├── LoginForm.module.css      ← SignupForm도 이 CSS 사용
  ├── SignupForm.tsx
  └── AuthErrorHandler.tsx

# TO-BE
components/auth/
  ├── LoginForm/
  │   ├── LoginForm.tsx
  │   ├── LoginForm.module.css
  │   └── index.ts
  ├── SignupForm/
  │   ├── SignupForm.tsx
  │   ├── SignupForm.module.css  ← 전용 CSS 분리
  │   └── index.ts
  ├── GoogleLoginButton/
  │   ├── GoogleLoginButton.tsx  ← 공통 구글 버튼 (중복 제거)
  │   ├── GoogleLoginButton.module.css
  │   └── index.ts
  ├── AuthErrorHandler/
  │   ├── AuthErrorHandler.tsx
  │   └── index.ts
  └── index.ts
```

#### 3-8. `components/common/` 잔존 파일 폴더화

```
# AS-IS
components/common/
  ├── NoticePopupModal.tsx       ← 폴더 없이 단독 파일
  ├── NoticePopupModal.module.css
  ├── Button/ ✅
  ├── Card/ ✅
  ├── Footer/ ✅
  ├── Header/ ✅
  ...

# TO-BE
components/common/
  ├── NoticePopupModal/
  │   ├── NoticePopupModal.tsx
  │   ├── NoticePopupModal.module.css
  │   └── index.ts
  ├── Button/ ✅
  ...
```

### Phase 4: 🟢 선택 (추가 개선)

#### 3-9. `app/lib/api.ts` 분리 (283줄)

```
# AS-IS
app/lib/api.ts   ← authAPI, userAPI, menuAPI, orderAPI 등이 전부 한 파일

# TO-BE
app/lib/api/
  ├── index.ts          # re-export
  ├── client.ts         # 공통 fetch wrapper
  ├── authAPI.ts        # 인증 관련 API
  ├── userAPI.ts        # 사용자 프로필 API
  ├── menuAPI.ts        # 메뉴 관련 API
  ├── orderAPI.ts       # 주문 관련 API
  └── adminAPI.ts       # 관리자 API
```

#### 3-10. `app/api/[...path]/route.ts` 분리 (282줄)

```
# AS-IS
app/api/[...path]/route.ts  ← 로그인, 구글로그인, 로그아웃, 세션, 프록시가 전부 한 파일

# TO-BE
app/api/[...path]/
  ├── route.ts              # 라우터 (분기만 담당)
  ├── handlers/
  │   ├── authHandlers.ts   # 로그인/로그아웃/구글로그인/세션
  │   └── proxyHandler.ts   # 일반 API 프록시
  └── utils.ts              # 공통 유틸
```

---

## 4. 우선순위 요약

| 순서 | 대상 | 라인 | 긴급도 | 상태 |
|------|------|------|--------|------|
| 1 | `mypage/page.tsx` | 619→127 | 🔴 | ✅ 완료 |
| 2 | `ChatWidget.tsx` | 560→263(UI) + useChatLogic(로직분리) | 🔴 | ✅ 완료 |
| 3 | `order/confirm/page.tsx` | 417→71 + useOrderConfirm(로직분리) | 🟠 | ✅ 완료 |
| 4 | `admin/grade-settings/page.tsx` | 398→181 | 🟠 | ✅ 완료 |
| 5 | `admin/rag/page.tsx` | 367→82 | 🟠 | ✅ 완료 |
| 6 | `menus/[id]/page.tsx` | 277→130 | 🟡 | ✅ 완료 |
| 7 | `components/auth/` 구조 정리 | - | 🟡 | ✅ 완료 |
| 8 | `components/common/` 잔존 파일 | - | 🟢 | ✅ 완료 |
| 9 | `app/lib/api.ts` 분리 | 283→직접import 4모듈 | 🟢 | ✅ 완료 |
| 10 | `app/api/[...path]/route.ts` 분리 | 282→38 | 🟢 | ✅ 완료 |

---

## 5. 리팩토링 시 주의사항

1. **import 경로 변경**: 컴포넌트를 폴더화하면 기존 import 경로가 모두 변경됨. `index.ts` re-export로 최소화한다.
2. **CSS 모듈 분리**: `LoginForm.module.css`를 공유하던 `SignupForm`은 전용 CSS로 분리해야 한다.
3. **상태 관리 유지**: 부모→자식으로 props 전달 시 기존 상태 로직이 깨지지 않도록 주의한다.
4. **테스트**: 각 Phase 완료 후 해당 페이지의 기능 동작을 반드시 확인한다.
5. **Git 브랜치**: Phase별로 별도 브랜치에서 작업 후 merge하는 것을 권장한다.
