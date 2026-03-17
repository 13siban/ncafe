# 🖥️ NCafe 프론트엔드 아키텍처 가이드

> **Next.js 16 (App Router) + TypeScript + Zustand + CSS Modules**  
> 이 문서는 NCafe 프론트엔드의 전체 구조, 주요 패턴, 폴더별 역할, 그리고 데이터 흐름을 정리합니다.

---

## 📖 목차

1. [기술 스택](#1-기술-스택)
2. [전체 폴더 구조](#2-전체-폴더-구조)
3. [핵심 아키텍처 패턴 — BFF](#3-핵심-아키텍처-패턴--bff)
4. [라우팅 구조 (App Router)](#4-라우팅-구조-app-router)
5. [폴더별 역할 상세](#5-폴더별-역할-상세)
6. [전역 상태 관리 (Zustand)](#6-전역-상태-관리-zustand)
7. [API 호출 구조](#7-api-호출-구조)
8. [인증 흐름](#8-인증-흐름)
9. [컴포넌트 설계 패턴](#9-컴포넌트-설계-패턴)
10. [스타일링 시스템](#10-스타일링-시스템)
11. [주요 기능 흐름](#11-주요-기능-흐름)
12. [외부 서비스 연동](#12-외부-서비스-연동)

---

## 1. 기술 스택

| 분류 | 기술 | 용도 |
|------|------|------|
| **프레임워크** | Next.js 16 (App Router) | SSR/SSG, 파일 기반 라우팅, API Routes |
| **언어** | TypeScript | 타입 안전성 |
| **상태 관리** | Zustand | 전역 상태 (인증, 장바구니, 챗봇) |
| **스타일링** | CSS Modules + CSS 변수 | 스코프된 컴포넌트 스타일 |
| **폰트** | Sweet(SUITE), Pretendard, Fraunces | 한글/영문 타이포그래피 |
| **아이콘** | Lucide React | 아이콘 라이브러리 |
| **애니메이션** | Framer Motion | 페이지 전환, 인터랙션 애니메이션 |
| **차트** | Recharts | 관리자 매출 분석/대시보드 차트 |
| **폼** | React Hook Form | 폼 상태 관리 및 유효성 검사 |
| **토스트** | React Hot Toast | 사용자 알림 메시지 |
| **DnD** | @dnd-kit | 드래그 앤 드롭 (메뉴 정렬 등) |
| **결제** | PortOne Browser SDK | 카카오페이/네이버페이/이니시스 결제 |
| **세션** | iron-session | 서버 사이드 세션 관리 (httpOnly 쿠키) |
| **이미지** | Sharp, react-dropzone | 이미지 압축/업로드 |

---

## 2. 전체 폴더 구조

```
frontend/
├── app/                         # 📁 Next.js App Router (페이지 + API Routes)
│   ├── layout.tsx               # 루트 레이아웃 (전역 구성)
│   ├── page.tsx                 # 홈페이지 (/)
│   ├── globals.css              # 전역 CSS (디자인 토큰, 리셋)
│   ├── loading.tsx              # 전역 로딩 UI
│   ├── not-found.tsx            # 404 페이지
│   │
│   ├── _components/             # 홈페이지 전용 섹션 컴포넌트
│   │   ├── Hero/                # 히어로 배너
│   │   ├── FeatureSections/     # 특징 소개 섹션
│   │   ├── SignatureSection/    # 시그니처 메뉴 섹션
│   │   └── GradeSection/       # 등급 혜택 섹션
│   │
│   ├── menus/                   # 📄 메뉴 목록 & 상세 (/menus, /menus/[id])
│   ├── cart/                    # 📄 장바구니 (/cart)
│   ├── order/                   # 📄 주문 관련 페이지 (/order/*)
│   │   ├── confirm/             #    주문 확인 & 결제
│   │   ├── [date]/[number]/     #    주문 추적 (실시간)
│   │   └── my/                  #    내 주문 내역
│   ├── login/                   # 📄 로그인 (/login)
│   ├── signup/                  # 📄 회원가입 (/signup)
│   ├── mypage/                  # 📄 마이페이지 (/mypage)
│   ├── about/                   # 📄 매장 소개 (/about)
│   │
│   ├── admin/                   # 📁 관리자 페이지 (/admin/*)
│   │   ├── layout.tsx           # 관리자 전용 레이아웃 (사이드바 + 헤더)
│   │   ├── page.tsx             # 대시보드 (/admin)
│   │   ├── _components/         # 관리자 공통 컴포넌트
│   │   ├── menus/               # 메뉴 관리 (CRUD)
│   │   ├── categories/          # 카테고리 관리
│   │   ├── options/             # 옵션 관리
│   │   ├── orders/              # 주문 관리
│   │   ├── users/               # 회원 관리
│   │   ├── sales/               # 매출 분석
│   │   ├── settings/            # 매장 설정
│   │   ├── notice-popups/       # 공지 팝업 관리
│   │   ├── grade-settings/      # 등급 설정
│   │   └── rag/                 # AI RAG 관리
│   │
│   ├── api/                     # 📁 API Routes (BFF 레이어)
│   │   ├── [...path]/           # Catch-all 프록시 라우트
│   │   │   ├── route.ts         # 통합 BFF 라우터
│   │   │   └── handlers/        # 핸들러 분리
│   │   │       ├── authHandlers.ts    # 인증 관련 처리
│   │   │       └── proxyHandler.ts    # 일반 API 프록시
│   │   └── chat/                # 챗봇 SSE 스트리밍 엔드포인트
│   │       └── route.ts
│   │
│   └── lib/                     # 앱 레벨 유틸리티
│       ├── session.ts           # iron-session 설정
│       └── api/                 # API 클라이언트 모듈
│           ├── client.ts        # 공통 fetch wrapper (fetchAPI)
│           ├── authAPI.ts       # 인증 API 모음
│           ├── adminAPI.ts      # 관리자 API 모음
│           └── userAPI.ts       # 사용자 API 모음
│
├── components/                  # 📁 재사용 컴포넌트 (페이지 독립적)
│   ├── common/                  # 공통 UI 컴포넌트
│   │   ├── Header/              # 고객용 헤더 (네비게이션)
│   │   ├── Footer/              # 고객용 푸터
│   │   ├── Logo/                # 로고
│   │   ├── Button/              # 공통 버튼
│   │   ├── Card/                # 공통 카드
│   │   ├── Input/               # 공통 인풋
│   │   ├── ImageUploader/       # 이미지 업로더 (드래그 앤 드롭)
│   │   ├── NoticePopupModal/    # 공지 팝업 모달
│   │   ├── GlobalOrderTracker/  # 전역 주문 추적 바
│   │   └── index.ts             # barrel export
│   ├── menu/                    # 메뉴 관련 컴포넌트
│   │   ├── CategoryTabs/        # 카테고리 탭 필터
│   │   ├── MenuList/            # 메뉴 목록
│   │   ├── MenuCard/            # 메뉴 카드
│   │   ├── MenuActionBar/       # 검색/필터 바
│   │   └── types.ts             # 메뉴 컴포넌트 타입
│   ├── auth/                    # 인증 관련 컴포넌트
│   │   ├── LoginForm/           # 로그인 폼
│   │   ├── SignupForm/          # 회원가입 폼
│   │   ├── GoogleLoginButton/   # 구글 소셜 로그인
│   │   └── AuthErrorHandler/    # 인증 에러 처리 (전역)
│   └── chat/                    # 챗봇 관련 컴포넌트
│       └── ChatWidget/          # AI 챗봇 위젯
│
├── store/                       # 📁 Zustand 전역 상태
│   ├── useAuthStore.ts          # 인증 상태 (로그인/로그아웃)
│   ├── useCartStore.ts          # 장바구니 상태 (LocalStorage persist)
│   └── useChatStore.ts          # 챗봇 상태 (메시지, SSE 스트리밍)
│
├── types/                       # 📁 공유 TypeScript 타입
│   ├── menu.ts                  # Menu, MenuImage, MenuOption 등
│   └── menuOption.ts            # OptionGroup, OptionItem 등
│
├── lib/                         # 📁 공통 유틸리티 (레거시 + 외부 SDK)
│   ├── api.ts                   # (레거시) → app/lib/api로 위임
│   └── portone.ts               # PortOne 결제 SDK 래퍼
│
├── mocks/                       # 📁 목업 데이터
│   └── menuData.ts              # 개발용 메뉴 더미 데이터
│
├── public/                      # 📁 정적 파일 (이미지, 파비콘)
│
├── middleware.ts                 # 📁 Next.js 미들웨어 (인증/권한 체크)
├── next.config.ts                # Next.js 설정 (BFF rewrites, 이미지 등)
├── package.json                  # 의존성 관리
└── tsconfig.json                 # TypeScript 설정
```

---

## 3. 핵심 아키텍처 패턴 — BFF

이 프로젝트의 가장 중요한 아키텍처 특징은 **BFF(Backend For Frontend)** 패턴입니다.

### BFF란?

클라이언트(브라우저)가 Spring Boot 백엔드와 직접 통신하지 않고, **Next.js 서버가 중간 프록시 역할**을 수행합니다.

```
┌──────────────────────────────────────────────────────────────┐
│                        브라우저                               │
│                                                              │
│  fetchAPI('/menus')  ──► fetch('/api/menus')                 │
│                          (쿠키는 브라우저가 자동 전송)          │
└─────────────────────────────┬────────────────────────────────┘
                              │ same-origin POST/GET
                              ▼
┌──────────────────────────────────────────────────────────────┐
│              Next.js 서버 (BFF 레이어)                        │
│                                                              │
│  /api/[...path]/route.ts  (Catch-all API Route)             │
│                                                              │
│  1. iron-session으로 쿠키에서 JWT 추출                        │
│  2. Authorization: Bearer {jwt} 헤더 자동 주입               │
│  3. 이미지 업로드 시 Sharp로 자동 압축 (WebP 변환)             │
│  4. Spring Boot / FastAPI 서버로 프록시 전달                  │
└─────────────────────────────┬────────────────────────────────┘
                              │ Authorization: Bearer JWT
                              ▼
┌──────────────────────────────────────────────────────────────┐
│           Spring Boot (port 8080)                            │
│           FastAPI Chat Server (port 8000)                    │
└──────────────────────────────────────────────────────────────┘
```

### BFF의 장점

| 장점 | 설명 |
|------|------|
| **JWT 노출 방지** | JWT가 httpOnly 쿠키에 저장되어 JavaScript로 접근 불가 (XSS 방어) |
| **API 주소 은닉** | 클라이언트는 `/api/*`만 호출, 실제 백엔드 주소 노출 안됨 |
| **이미지 자동 압축** | 업로드 시 Sharp 라이브러리로 WebP 변환 + 리사이즈 |
| **인증 자동 처리** | 개발자가 매 요청마다 토큰을 기억할 필요 없음 |
| **멀티 백엔드 라우팅** | Spring Boot와 FastAPI(챗봇) 서버를 하나의 API로 통합 |

### Catch-all 프록시 라우트 동작

`app/api/[...path]/route.ts`가 모든 `/api/*` 요청을 처리합니다:

```
요청 경로                           → 라우팅 대상
─────────────────────────────────────────────────
/api/auth/login  (POST)             → authHandlers.handleLogin()
/api/auth/google (POST)             → authHandlers.handleGoogleLogin()
/api/auth/logout (POST)             → authHandlers.handleLogout()
/api/auth/session (GET)             → authHandlers.handleSession()
/api/vector/*                       → FastAPI 챗봇 서버로 프록시
/api/* (그 외 전부)                  → Spring Boot로 프록시 전달
```

---

## 4. 라우팅 구조 (App Router)

### 고객 페이지

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | `page.tsx` | 홈 (Hero, 시그니처 메뉴, 등급 혜택) |
| `/menus` | `menus/page.tsx` | 메뉴 목록 (카테고리 필터, 검색) |
| `/menus/[id]` | `menus/[id]/page.tsx` | 메뉴 상세 (이미지 갤러리, 옵션 선택, 장바구니) |
| `/cart` | `cart/page.tsx` | 장바구니 (수량 변경, 옵션 수정) |
| `/order/confirm` | `order/confirm/page.tsx` | 주문 확인 & 결제 |
| `/order/[date]/[number]` | `order/[date]/[number]/page.tsx` | 주문 추적 (실시간 상태) |
| `/order/my` | `order/my/page.tsx` | 내 주문 내역 |
| `/login` | `login/page.tsx` | 로그인 (일반 + 구글) |
| `/signup` | `signup/page.tsx` | 회원가입 |
| `/mypage` | `mypage/page.tsx` | 마이페이지 (프로필, 주문, 포인트, 등급, 즐겨찾기) |
| `/about` | `about/page.tsx` | 매장 소개 |

### 관리자 페이지 (`/admin/*`)

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/admin` | 대시보드 | 오늘 매출, 주문 수, 최근 주문 등 |
| `/admin/menus` | 메뉴 관리 | 메뉴 목록(그리드/리스트), 검색, 필터 |
| `/admin/menus/new` | 메뉴 등록 | 새 메뉴 생성 폼 |
| `/admin/menus/[id]` | 메뉴 상세/수정 | 메뉴 수정, 이미지 관리 |
| `/admin/categories/[id]` | 카테고리 관리 | 카테고리 CRUD |
| `/admin/options` | 옵션 관리 | 옵션 그룹/아이템 관리 |
| `/admin/orders` | 주문 관리 | 주문 상태 변경, 거절 |
| `/admin/users` | 회원 관리 | 회원 목록, 역할/등급 변경, 계정 잠금 |
| `/admin/sales` | 매출 분석 | 일별/주별/월별 차트, 메뉴별 랭킹 |
| `/admin/settings` | 매장 설정 | 영업 시간, 매장 정보 |
| `/admin/notice-popups` | 공지 팝업 | 팝업 CRUD |
| `/admin/grade-settings` | 등급 설정 | 등급 기준, 적립률 |
| `/admin/rag` | AI RAG 관리 | 챗봇 학습 데이터 관리 |

### 레이아웃 계층

```
app/layout.tsx (루트 레이아웃)
├── 전역 CSS, 폰트 로드
├── AuthErrorHandler (인증 에러 전역 처리)
├── ChatWidget (AI 챗봇 위젯)
├── NoticePopupModal (공지 팝업 자동 표시)
├── GlobalOrderTracker (주문 실시간 추적 바)
├── Toaster (토스트 알림)
│
├── 고객 페이지들 → Header + children + Footer
│
└── app/admin/layout.tsx (관리자 레이아웃)
    ├── AdminSidebar (내비게이션 사이드바, 접기/펼치기)
    ├── AdminHeader (브레드크럼, 모바일 메뉴)
    └── 관리자 페이지 children
```

---

## 5. 폴더별 역할 상세

### 5.1 `app/` — 페이지 & API Routes

Next.js App Router의 파일 기반 라우팅을 따릅니다:

| 파일 | 역할 |
|------|------|
| `page.tsx` | 해당 경로의 페이지 UI |
| `layout.tsx` | 해당 경로 및 하위 경로에 적용되는 레이아웃 |
| `loading.tsx` | 서스펜스 fallback (로딩 UI) |
| `not-found.tsx` | 404 에러 페이지 |
| `page.module.css` | 해당 페이지 전용 스타일 |
| `types.ts` | 해당 페이지 로컬 타입 정의 |

**페이지 내부 컴포넌트 패턴 — `_components/`:**

각 라우트 폴더 안에 `_components/` 폴더를 두어 **해당 페이지에서만 사용되는 컴포넌트**를 관리합니다:

```
app/order/confirm/
├── page.tsx                      # 주문 확인 페이지
├── page.module.css               # 페이지 스타일
└── _components/                  # 이 페이지 전용 컴포넌트
    ├── CustomerInfoSection/      # 고객 정보 입력
    ├── OrderItemSummary/         # 주문 항목 요약
    ├── PaymentMethodSection/     # 결제 수단 선택
    ├── PointUsageSection/        # 포인트 사용
    └── useOrderConfirm.ts        # 주문 확인 커스텀 훅
```

> `_components` 폴더 이름 앞의 `_`(언더스코어)는 Next.js App Router에서 해당 폴더가 라우트로 취급되지 않도록 방지하는 컨벤션입니다.

### 5.2 `components/` — 재사용 컴포넌트

여러 페이지에서 공유하는 컴포넌트를 도메인별로 분류합니다:

| 폴더 | 역할 | 주요 컴포넌트 |
|------|------|-------------|
| `common/` | 범용 UI | `Header`, `Footer`, `Button`, `Card`, `Input`, `Logo`, `ImageUploader` |
| `menu/` | 메뉴 UI | `MenuList`, `MenuCard`, `CategoryTabs`, `MenuActionBar` |
| `auth/` | 인증 UI | `LoginForm`, `SignupForm`, `GoogleLoginButton`, `AuthErrorHandler` |
| `chat/` | 챗봇 UI | `ChatWidget` (AI 어시스턴트 위젯) |

각 컴포넌트는 **자체 폴더**를 가지며, 컴포넌트 파일(.tsx)과 스타일(.module.css)이 함께 위치합니다:

```
components/common/Header/
├── Header.tsx
├── Header.module.css
└── index.ts (선택적)
```

### 5.3 `store/` — Zustand 전역 상태

| 파일 | 역할 | persist |
|------|------|---------|
| `useAuthStore.ts` | 로그인 상태, 사용자 정보, 세션 동기화 | ❌ (서버 세션으로 관리) |
| `useCartStore.ts` | 장바구니 아이템, 수량, 옵션, 주문 유형 | ✅ localStorage |
| `useChatStore.ts` | 채팅 메시지, SSE 스트리밍, 펜딩 액션 | ❌ (세션 스토리지) |

### 5.4 `types/` — 공유 타입

여러 컴포넌트/페이지에서 사용하는 TypeScript 인터페이스를 정의합니다:

```typescript
// types/menu.ts
export interface Menu {
    id: number;
    korName: string;
    engName: string;
    price: number;
    images: MenuImage[];
    isAvailable: boolean;
    isSoldOut: boolean;
    options: MenuOption[];
    // ...
}
```

### 5.5 `app/lib/api/` — API 클라이언트 모듈

도메인별로 API 호출을 모듈화합니다:

| 파일 | 용도 | 주요 함수 |
|------|------|----------|
| `client.ts` | 공통 fetch wrapper | `fetchAPI(endpoint, options)` |
| `authAPI.ts` | 인증 API | `login()`, `logout()`, `getSession()`, `signup()` |
| `adminAPI.ts` | 관리자 API | `adminStoreAPI`, `galleryAPI`, `adminDashboardAPI`, `adminSalesAPI` |
| `userAPI.ts` | 사용자 API | `userAPI.getProfile()`, `userFavoriteAPI.addFavorite()` 등 |

### 5.6 `lib/` — 외부 SDK 래퍼

| 파일 | 용도 |
|------|------|
| `portone.ts` | PortOne 결제 SDK 래퍼 (카카오페이, 네이버페이, 이니시스) |
| `api.ts` | (레거시) `app/lib/api`로 위임, 하위 호환성용 |

---

## 6. 전역 상태 관리 (Zustand)

### 6.1 인증 스토어 (`useAuthStore`)

```
┌─────────────────────┐
│    useAuthStore      │
│                      │
│  user: SessionUser   │   ← checkAuth() 호출 시 서버 세션에서 동기화
│  isLoading: boolean  │
│                      │
│  checkAuth()         │   → fetchAPI('/auth/session') 호출
│  logout()            │   → fetchAPI('/auth/logout') 호출 → session 파괴
│  setUser()           │
│  clearUser()         │
└─────────────────────┘
```

- **JWT는 Zustand에 저장하지 않음** — iron-session의 httpOnly 쿠키로 관리
- 클라이언트에서는 `user` 정보(닉네임, 역할 등)만 가지고 UI를 렌더링

### 6.2 장바구니 스토어 (`useCartStore`)

```
┌──────────────────────────────────────────────────┐
│    useCartStore (persist → localStorage)         │
│                                                  │
│  orderType: 'STORE' | 'PICKUP'                  │
│  items: CartItem[]                               │
│    ├── cartId (menuId + options 조합 키)           │
│    ├── menuId, menuName, basePrice               │
│    ├── selectedOptions: CartOption[]              │
│    ├── quantity, subtotal                         │
│    └── stableId (React key용 영구 ID)             │
│                                                  │
│  addItem()       → 기존 동일 옵션 아이템이면 수량 합산  │
│  removeItem()    → cartId로 삭제                   │
│  updateQuantity()→ 수량 변경 시 subtotal 재계산      │
│  updateOptions() → 옵션 변경 시 cartId 재생성        │
│  clearCart()     → 주문 완료 후 초기화               │
│  getTotalPrice() → 전체 합계                       │
│  getTotalItems() → 전체 수량                       │
└──────────────────────────────────────────────────┘
```

- `localStorage`에 자동 영속화 → 새로고침해도 유지
- `cartId`는 `menuId-옵션조합`으로 구성 → 같은 메뉴라도 옵션이 다르면 별도 항목

### 6.3 챗봇 스토어 (`useChatStore`)

```
┌──────────────────────────────────────────────────┐
│    useChatStore                                  │
│                                                  │
│  messages: ChatMessage[]                         │
│  isOpen: boolean                                 │
│  isLoading: boolean                              │
│  pendingAction: Action | null                    │
│    ├── navigate     → 페이지 이동                  │
│    ├── add_to_cart  → 장바구니 추가                 │
│    ├── show_menu_cards → 메뉴 카드 표시            │
│    ├── reorder      → 재주문                      │
│    └── open_favorite_panel → 즐겨찾기 패널         │
│                                                  │
│  sendMessage()     → SSE 스트리밍 수신 + 실시간 UI  │
│  clearMessages()   → 대화 초기화 + 서버 세션 삭제   │
└──────────────────────────────────────────────────┘
```

- SSE(Server-Sent Events) 스트리밍으로 AI 응답을 실시간 렌더링
- Function Calling: AI가 `navigate`, `add_to_cart` 등 액션을 반환하면 프론트엔드가 실행

---

## 7. API 호출 구조

### fetchAPI — 공통 래퍼

모든 API 호출은 `fetchAPI(endpoint)` 함수를 통해 이루어집니다:

```typescript
// 사용 방법
import { fetchAPI } from '@/app/lib/api/client';

const menus = await fetchAPI('/menus');              // GET /api/menus
await fetchAPI('/orders', {                          // POST /api/orders
    method: 'POST',
    body: JSON.stringify(orderData)
});
```

**내부 동작:**
1. `endpoint`에 `/api` 접두사를 붙여 Next.js API Route로 요청
2. 브라우저가 쿠키를 자동 전송 (same-origin)
3. BFF 프록시가 JWT를 추출해 백엔드로 전달
4. 401 응답 시 자동으로 로그인 페이지 리다이렉트

### 도메인별 API 모듈 예시

```typescript
// 인증
import { authAPI } from '@/app/lib/api/authAPI';
await authAPI.login('user', 'pass');
await authAPI.getSession();

// 사용자
import { userAPI, userFavoriteAPI } from '@/app/lib/api/userAPI';
await userAPI.getProfile();
await userFavoriteAPI.addFavorite({ menuId: 1 });

// 관리자
import { adminStoreAPI, adminSalesAPI } from '@/app/lib/api/adminAPI';
await adminStoreAPI.openStore();
await adminSalesAPI.getSummary('daily');
```

---

## 8. 인증 흐름

### 로그인 흐름

```
1. 사용자가 LoginForm에서 ID/PW 입력
   │
2. authAPI.login(username, password)
   │  → POST /api/auth/login
   │
3. BFF authHandlers.handleLogin()
   │  → POST http://backend:8080/auth/login
   │  → JWT 수신
   │  → GET /auth/me 로 사용자 정보 조회
   │  → iron-session에 { token, user } 저장
   │  → httpOnly 쿠키로 브라우저에 전달
   │
4. 클라이언트: useAuthStore.setUser(session.user)
   │
5. 이후 모든 API 요청에 쿠키가 자동 포함됨
```

### 미들웨어 라우트 보호

`middleware.ts`가 요청을 가로채서 인증/권한을 체크합니다:

```
요청                      미들웨어 동작
──────────────────────────────────────────
/menus, /about, /login    → 공개 경로, 통과
/admin/*                  → 세션 쿠키 확인
                          → iron-session에서 role 확인
                          → ROLE_ADMIN/ROLE_SUB_ADMIN 아니면 차단
/mypage, /order/my        → 세션 쿠키 존재 여부만 확인
```

---

## 9. 컴포넌트 설계 패턴

### 9.1 Feature Component + Custom Hook 패턴

복잡한 페이지는 **로직(Custom Hook)** 과 **UI(Component)** 를 분리합니다:

```
app/menus/[id]/
├── page.tsx                  # 페이지 (UI 조합만)
└── _components/
    ├── useMenuDetail.ts      # 커스텀 훅: API 호출, 상태 관리 로직
    ├── MenuInfo/             # UI: 메뉴 정보 표시
    ├── ImageGallery/         # UI: 이미지 갤러리
    ├── MenuOptions/          # UI: 옵션 선택
    └── CartActionBar/        # UI: 장바구니 추가 바
```

### 9.2 Barrel Export 패턴

`index.ts` 파일을 통해 깔끔한 import를 지원합니다:

```typescript
// components/common/index.ts
export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Footer } from './Footer/Footer';
export { default as Header } from './Header/Header';

// 사용처
import { Header, Footer, Button } from '@/components/common';
```

### 9.3 `'use client'` 사용 패턴

Next.js App Router에서 대부분의 페이지가 `'use client'`로 클라이언트 컴포넌트입니다:
- 상태 관리(`useState`, `useEffect`)가 필요한 페이지
- Zustand 스토어를 사용하는 컴포넌트
- 이벤트 핸들러가 필요한 인터랙티브 UI

서버 컴포넌트는 주로 **루트 레이아웃**(`layout.tsx`)에서 메타데이터 생성 시 사용됩니다.

---

## 10. 스타일링 시스템

### 10.1 디자인 토큰 (`globals.css`)

CSS 변수로 일관된 디자인 시스템을 구현합니다:

```css
:root {
  /* 컬러 팔레트 — 그린 기반 (#3d6d64) */
  --color-primary-600: #3d6d64;      /* 메인 컬러 */
  --color-primary-100: #e5eeec;      /* 라이트 배경 */

  /* 타이포그래피 */
  --font-sans: 'Sweet', 'Pretendard', sans-serif;
  --font-serif: 'Fraunces', serif;    /* 영문 포인트 폰트 */

  /* 스페이싱, 보더 반경, 그림자 등 */
  --space-4: 1rem;
  --radius-md: 0.5rem;
  --shadow-md: 0 4px 6px ...;
  --transition-base: 200ms ease;
}
```

### 10.2 CSS Modules

각 컴포넌트/페이지는 자체 `.module.css` 파일을 가집니다:

```typescript
// MenuCard.tsx
import styles from './MenuCard.module.css';

export function MenuCard({ menu }) {
    return <div className={styles.card}>{/* ... */}</div>;
}
```

장점:
- 클래스명 충돌 방지 (자동 해싱)
- 디자인 토큰(`var(--color-primary-600)`)을 CSS 변수로 참조
- 컴포넌트별 스타일 스코핑

---

## 11. 주요 기능 흐름

### 11.1 메뉴 조회 → 장바구니 → 결제

```
/menus                          /menus/[id]
 ├── CategoryTabs               ├── ImageGallery
 ├── MenuActionBar (검색)        ├── MenuInfo (가격, 설명)
 └── MenuList → MenuCard 클릭 → ├── MenuOptions (옵션 선택)
                                └── CartActionBar → addItem()
                                         │
                                    useCartStore
                                         │
/cart                           /order/confirm
 ├── 수량 ±                     ├── CustomerInfoSection
 ├── 옵션 변경                   ├── OrderItemSummary
 ├── 아이템 삭제                 ├── PointUsageSection
 └── 주문하기 →                 ├── PaymentMethodSection
                                │    └── PortOne 결제 SDK
                                └── 결제 완료 → POST /api/orders
                                                    │
/order/[date]/[number]                              │
 ├── TrackingHeader              ← 주문 번호 반환 ←─┘
 ├── StatusCard (실시간 폴링)
 ├── OrderDetailsSummary
 └── TrackingFooter (픽업 완료)
```

### 11.2 AI 챗봇 흐름

```
ChatWidget (전역으로 항상 표시)
    │
    ├── 사용자 메시지 입력
    │       │
    │   useChatStore.sendMessage()
    │       │
    │   POST /api/chat (SSE 스트리밍)
    │       │
    │   ┌── Next.js API Route ────────────┐
    │   │  대화 히스토리 관리 (메모리)      │
    │   │  FastAPI 서버에 SSE 요청         │
    │   └──────────────────────────────────┘
    │       │
    │   SSE 청크 → 실시간 메시지 렌더링
    │       │
    │   pendingAction 감지
    │       ├── navigate → 페이지 이동
    │       ├── add_to_cart → 메뉴 상세 → 장바구니
    │       ├── show_menu_cards → 메뉴 카드 추천
    │       ├── reorder → 이전 주문 재주문
    │       └── open_favorite_panel → 즐겨찾기 등록
```

### 11.3 관리자 대시보드

```
/admin (AdminLayout)
    │
    ├── AdminSidebar               # 좌측 네비게이션
    │   ├── 접기/펼치기 (isCollapsed)
    │   └── 모바일 오버레이 (sidebarOpen)
    │
    ├── AdminHeader                # 상단 (브레드크럼, 햄버거)
    │
    └── 페이지 콘텐츠
        ├── DashboardStatsGrid     # 오늘 매출, 주문 수 등
        ├── RecentOrdersList       # 최근 주문 5건
        ├── PopularMenusList       # 인기 메뉴 TOP 5
        ├── QuickActions           # 빠른 실행 버튼
        ├── StoreSettings          # 영업 시간 설정
        └── StoreStatusBanner      # 영업 중/마감 배너
```

---

## 12. 외부 서비스 연동

### 12.1 결제 (PortOne)

```typescript
// lib/portone.ts
import * as PortOne from "@portone/browser-sdk/v2";

const paymentId = await requestPayment({
    orderName: "아메리카노 외 2건",
    totalAmount: 15000,
    method: "KAKAOPAY",  // 또는 "NAVERPAY", "INICIS"
    customerName: "홍길동"
});
// → paymentId를 백엔드 주문 생성 API에 전달
```

지원 결제 수단:
- 카카오페이 (간편결제)
- 네이버페이 (간편결제)
- 이니시스 (카드결제)

### 12.2 구글 소셜 로그인

```
GoogleLoginButton (@react-oauth/google)
    │
    ├── Google OAuth ID Token 수신
    │
    └── authAPI.googleLogin(idToken)
        → BFF → Spring Boot /auth/google
        → JWT + 세션 저장
```

### 12.3 이미지 리소스 프록시

`next.config.ts`의 rewrites로 이미지 경로를 BFF 프록시로 전달합니다:

```
/upload/*    → /api/upload/*   → Spring Boot /upload/*
/images/*    → /api/upload/*   → Spring Boot /upload/*
/*.png       → /api/*.png      → Spring Boot 정적 리소스
```

---

## 📝 요약

| 구분 | 위치 | 역할 |
|------|------|------|
| **페이지** | `app/라우트/page.tsx` | UI 조합, 라우팅 진입점 |
| **레이아웃** | `app/라우트/layout.tsx` | 공통 레이아웃 (헤더/사이드바 등) |
| **페이지 전용 컴포넌트** | `app/라우트/_components/` | 해당 페이지에서만 쓰이는 컴포넌트 |
| **공유 컴포넌트** | `components/도메인/` | 여러 페이지에서 재사용 |
| **전역 상태** | `store/use*Store.ts` | Zustand (인증, 장바구니, 챗봇) |
| **API 함수** | `app/lib/api/*.ts` | 도메인별 API 호출 모듈 |
| **BFF 프록시** | `app/api/[...path]/` | JWT 주입, 인증 처리, 프록시 |
| **미들웨어** | `middleware.ts` | 라우트 보호 (인증/권한) |
| **타입** | `types/*.ts` | 공유 TypeScript 타입 |
| **디자인 토큰** | `app/globals.css` | CSS 변수 (컬러, 폰트, 스페이싱) |
| **스타일** | `*.module.css` | 컴포넌트/페이지 스코프 CSS |
| **결제 SDK** | `lib/portone.ts` | PortOne 결제창 래퍼 |

**데이터 흐름:** `컴포넌트 → fetchAPI('/endpoint') → BFF (/api/[...path]) → 백엔드(Spring Boot/FastAPI)`
