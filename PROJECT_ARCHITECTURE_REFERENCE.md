# 📚 프로젝트 아키텍처 레퍼런스 가이드

> **NCafe 프로젝트에서 겪은 아키텍처 문제와 리팩토링 경험을 기반으로 정리한 레퍼런스.**  
> 새 프로젝트 시작 시 같은 실수를 반복하지 않기 위한 체크리스트 및 패턴 가이드.

---

## 📖 목차

1. [백엔드 아키텍처 핵심 원칙](#1-백엔드-아키텍처-핵심-원칙)
2. [백엔드에서 반복된 실수 패턴](#2-백엔드에서-반복된-실수-패턴)
3. [백엔드 모듈 설계 체크리스트](#3-백엔드-모듈-설계-체크리스트)
4. [프론트엔드 아키텍처 핵심 원칙](#4-프론트엔드-아키텍처-핵심-원칙)
5. [프론트엔드에서 반복된 실수 패턴](#5-프론트엔드에서-반복된-실수-패턴)
6. [프론트엔드 컴포넌트 설계 체크리스트](#6-프론트엔드-컴포넌트-설계-체크리스트)
7. [공통 교훈 — 설계 시 기억할 것들](#7-공통-교훈--설계-시-기억할-것들)
8. [리팩토링 진행 방법론](#8-리팩토링-진행-방법론)

---

## 1. 백엔드 아키텍처 핵심 원칙

### 채택한 아키텍처: 헥사고날 (Ports & Adapters)

```
Adapter(In) → Port(In) → Service → Port(Out) → Adapter(Out)
                            ↓
                         Domain
```

### 5가지 불변 원칙

| # | 원칙 | 위반 시 발생하는 문제 |
|---|------|----------------------|
| 1 | **Domain은 순수 POJO** — JPA/Spring 어노테이션 없음 | DB 기술 교체 불가, 단위 테스트 어려움 |
| 2 | **Port(Out)은 도메인 모델만 반환** — JPA Entity 반환 금지 | Service가 인프라에 의존, Port 존재 의미 소멸 |
| 3 | **Service는 Port를 통해서만 DB 접근** — JPA Repository 직접 참조 금지 | 계층 우회, 변경 영향 범위 확대 |
| 4 | **Controller DTO와 Service DTO는 분리** — Web 전용 DTO는 adapter/in/web/dto에 | 계층 간 결합, API 변경이 Service에 영향 |
| 5 | **모듈 간 소통은 Port(인터페이스)를 통해서만** | 구현체 직접 참조 시 모듈 간 강결합 |

### 표준 모듈 구조 (모든 모듈이 따라야 할 템플릿)

```
module-name/
├── domain/
│   └── model/
│       ├── DomainModel.java          ← 순수 POJO (비즈니스 로직 포함)
│       └── StatusEnum.java
├── application/
│   ├── port/
│   │   ├── in/                       ← UseCase 인터페이스
│   │   │   └── CreateXxxUseCase.java
│   │   └── out/                      ← RepositoryPort 인터페이스 (도메인 모델만 반환!)
│   │       └── XxxRepositoryPort.java
│   ├── service/                      ← UseCase 구현체 (Port만 의존!)
│   │   └── CreateXxxService.java
│   ├── command/                      ← 입력 DTO (선택적)
│   └── result/                       ← 출력 DTO (선택적)
└── adapter/
    ├── in/web/
    │   ├── XxxController.java
    │   └── dto/
    │       ├── request/
    │       └── response/
    └── out/persistence/
        ├── XxxJpaEntity.java
        ├── XxxJpaRepository.java
        └── XxxPersistenceAdapter.java  ← Port 구현체 (Domain ↔ Entity 변환)
```

---

## 2. 백엔드에서 반복된 실수 패턴

### 🔴 실수 #1: Service에서 JPA Repository 직접 참조

> **빈도: 7개 모듈에서 발생** — 가장 빈번하고 심각한 위반

**잘못된 패턴:**
```java
// ❌ Service가 JPA Repository를 직접 import
@Service
public class GetOrderService {
    private final OrderJpaRepository orderRepository;       // Port 아닌 JPA 직접!
    private final MenuJpaRepository menuRepository;         // 다른 모듈 JPA까지!
}
```

**올바른 패턴:**
```java
// ✅ Service는 Port만 의존
@Service
public class GetOrderService {
    private final OrderRepositoryPort orderRepository;      // Port 인터페이스
    private final MenuRepositoryPort menuRepository;        // 다른 모듈도 Port로!
}
```

**왜 실수했는가:**
- 기능 구현 속도에 집중하다 보면 Port/Adapter를 잊고 "가장 빠른 경로"로 코딩
- 초기에 `menu` 모듈을 잘 만들어놨지만, 이후 모듈에서 그 패턴을 따르지 않음
- 특히 **여러 모듈을 조합하는 Service**(주문 생성 등)에서 빠르게 코딩하려다 위반

**예방법:**
- ✅ 새 모듈 생성 시 **Port(Out) + PersistenceAdapter를 먼저 만들고** Service 작성
- ✅ Service 클래스에서 `import ...adapter.out.persistence.*`가 보이면 즉시 리팩토링
- ✅ IDE에서 `adapter.out.persistence` 패키지를 Service에서 import 시 경고 설정

---

### 🔴 실수 #2: Port(Out)이 JPA Entity를 반환

**잘못된 패턴:**
```java
// ❌ Port 인터페이스가 JPA Entity를 반환 — Port의 존재 의미 없음
public interface SalesRepositoryPort {
    List<DailyMenuSalesJpaEntity> findBySaleDate(LocalDate date);
}
```

**올바른 패턴:**
```java
// ✅ Port는 도메인 모델만 반환
public interface SalesRepositoryPort {
    List<DailyMenuSales> findBySaleDate(LocalDate date);
}
```

**왜 실수했는가:**
- Port를 만들긴 했지만, Entity ↔ Domain 매핑 작업이 귀찮아서 Entity를 그대로 넘김
- "어차피 같은 데이터인데..."라는 안일한 생각

**예방법:**
- ✅ Port 인터페이스 작성 시 반환 타입에 `JpaEntity`인지 반드시 확인
- ✅ Domain 모델이 없으면 **먼저 Domain 모델을 생성**한 후 Port 작성

---

### 🔴 실수 #3: Domain 모델 없이 동작하는 모듈

**발생 모듈:** `sales` (domain/model 디렉토리 자체 없음), `payment` (파일 1개뿐)

**왜 실수했는가:**
- "간단한 기능이라 도메인 모델까지 필요 없다"고 판단
- 결과적으로 JPA Entity가 도메인 모델 역할까지 겸하게 됨

**예방법:**
- ✅ 아무리 간단해도 **domain/model 폴더와 POJO 모델을 먼저 생성**
- ✅ "이건 간단해서 괜찮겠지"라는 생각이 들면, 그게 바로 기술 부채의 시작

---

### 🔴 실수 #4: Port(Out), PersistenceAdapter 자체가 없는 모듈

**발생 모듈:** `notice`, `user/grade`, `user/favorite`

**구조적 누락:**
```
notice/
├── adapter/out/persistence/
│   ├── NoticePopupJpaEntity.java
│   └── NoticePopupJpaRepository.java  ← Adapter 없음!
├── application/
│   ├── port/in/                        ← out 포트 없음!
│   └── service/
│       └── AdminNoticePopupService.java ← JPA 직접 참조
```

**왜 실수했는가:**
- 급하게 기능을 추가하면서 헥사고날 구조의 절반만 구현
- Port(In)을 만들어서 "아키텍처를 따르고 있다"고 착각

**예방법:**
- ✅ **모듈 생성 체크리스트**를 사용 (아래 섹션 3 참고)
- ✅ Port(In) 만들었으면 반드시 Port(Out) + PersistenceAdapter도 생성

---

### 🟡 실수 #5: 빈혈 도메인 (Anemic Domain Model)

**잘못된 패턴:**
```java
// ❌ 상태만 바꾸려고 전체 빌더 재생성 — 도메인에 행위가 없어서 발생
Order updatedOrder = Order.builder()
    .id(order.getId())
    .orderDate(order.getOrderDate())
    .orderNumber(order.getOrderNumber())
    // ... 15개 필드 전부 다시 설정
    .status(newStatus)  // 이것만 바뀜
    .build();
```

**올바른 패턴:**
```java
// ✅ 도메인 모델에 행위 추가
public class Order {
    public void changeStatus(OrderStatus newStatus) {
        this.status = newStatus;
    }
    public void reject(String reason) {
        this.status = OrderStatus.REJECTED;
        this.rejectReason = reason;
    }
}

// 사용
order.changeStatus(newStatus);      // 한 줄로 끝
order.reject("재고 없음");            // 한 줄로 끝
```

**왜 실수했는가:**
- `@Builder` + `@Getter`만으로 도메인을 구성하면 "데이터 컨테이너"가 됨
- 비즈니스 규칙이 Service에 흩어지고, 도메인은 빈 껍데기

**예방법:**
- ✅ 도메인 모델 작성 시 "이 객체가 **스스로** 할 수 있는 행위"를 먼저 정의
- ✅ Builder 패턴과 함께 **상태 변경 메서드**도 반드시 추가
- ✅ Service에서 builder().set().build() 패턴이 보이면 → 도메인 메서드로 추출

---

### 🟡 실수 #6: 거대한 단일 Service 메서드

**발생 사례:** `CreateOrderService.createOrder()` — 238줄 단일 메서드에 모든 로직

```
가격 계산 → 포인트 확인 → 결제 검증 → Order 생성 → 아이템 저장 → 옵션 저장 
→ 포인트 사용/적립 → SSE 알림 → 응답 생성
```

**예방법:**
- ✅ 하나의 public 메서드는 **비즈니스 흐름 조율만** 담당
- ✅ 각 단계를 **private 메서드**로 분리: `calculatePrice()`, `verifyPayment()`, `saveOrderItems()`, `processPoints()`
- ✅ 메서드가 50줄을 넘기면 분리를 고려

---

### 🟡 실수 #7: `findAll().stream().filter()` 성능 문제

**잘못된 패턴:**
```java
// ❌ 전체 데이터를 메모리에 로드한 후 필터링
orderRepository.findAll().stream()
    .filter(o -> o.getOrderDate().equals(date) && o.getOrderNumber().equals(number))
    .findFirst()
    .orElseThrow();
```

**올바른 패턴:**
```java
// ✅ DB 쿼리로 필터링
orderRepository.findByOrderDateAndOrderNumber(date, number)
    .orElseThrow();
```

**왜 실수했는가:**
- 초기 데이터가 적어서 "잘 되니까 괜찮다"고 생각
- JPA 쿼리 메서드 작성이 귀찮아서 stream()으로 대충 해결

**예방법:**
- ✅ `findAll()`은 **관리자 전체 목록 조회**에서만 사용
- ✅ 조건이 있으면 반드시 **DB 쿼리로 필터링**
- ✅ 코드 리뷰 시 `findAll().stream().filter()` 패턴을 즉시 플래그

---

### 🟡 실수 #8: Controller에서 비즈니스 로직 처리

**발생 사례:**
- `AdminNoticePopupController`: UUID 생성, 파일 저장 로직이 Controller에 직접 구현
- `AdminUserController`: JPA Repository를 직접 주입받아 사용자 잠금 처리
- `AdminOrderController`: DTO가 Controller 내 inner class로 정의

**예방법:**
- ✅ Controller는 **HTTP 요청 파싱 + UseCase 호출 + 응답 생성**만 담당
- ✅ Controller에 비즈니스 로직이 10줄 이상이면 UseCase로 추출
- ✅ DTO는 항상 별도 파일 (`dto/request/`, `dto/response/`)에 정의

---

### 🟡 실수 #9: 잘못된 모듈 위치

**발생 사례:** `UserPointService`가 `auth` 패키지에 위치
- 포인트 관리는 인증(auth)과 무관한 기능
- `user/point/`로 이동해야 적절

**예방법:**
- ✅ 모듈 위치 결정 시 "이 기능은 어떤 도메인에 속하는가?" 질문
- ✅ "auth에 넣으면 편하니까"가 아니라 "비즈니스적으로 어디에 속하는가" 기준으로 배치

---

### 🟡 실수 #10: `Map<String, Object>` 타입의 Request Body

```java
// ❌ 타입 안전하지 않음, 어떤 필드가 필요한지 알 수 없음
public Map<String, String> addCategoryOptionMap(
    @RequestBody Map<String, Object> body) {
    Long optionGroupId = Long.valueOf(body.get("optionGroupId").toString());
}
```

**예방법:**
- ✅ 항상 **전용 Request DTO** 클래스를 생성
- ✅ `@RequestBody Map<String, Object>`는 절대 사용하지 않음

---

### 🟡 실수 #11: 보안 설정 과도한 허용

```java
// ❌ 모든 HTTP 메서드에 대해 permitAll
.requestMatchers("/orders/**").permitAll()
```

**예방법:**
- ✅ `permitAll()`은 **HTTP 메서드별로 세분화**
- ✅ `GET /orders/my/**` → `authenticated()`, `POST /orders` → `permitAll()` 등

---

## 3. 백엔드 모듈 설계 체크리스트

> 새 모듈을 생성할 때 아래 체크리스트를 **모두 통과**해야 합니다.

```
□ domain/model/ 폴더에 순수 POJO 도메인 모델 생성
  □ JPA 어노테이션 없음
  □ 비즈니스 행위 메서드 포함 (상태 변경, 검증 등)

□ application/port/in/ 에 UseCase 인터페이스 정의
  □ 네이밍: {동작}{도메인}UseCase

□ application/port/out/ 에 RepositoryPort 인터페이스 정의
  □ 반환 타입이 도메인 모델인지 확인 (JPA Entity 반환 금지!)
  □ 네이밍: {도메인}RepositoryPort

□ application/service/ 에 UseCase 구현체 생성
  □ Port만 의존하는지 확인 (import에 adapter.out.persistence가 없는지!)
  □ 단일 메서드가 50줄 이하인지 확인

□ adapter/in/web/ 에 Controller 생성
  □ UseCase 인터페이스에만 의존
  □ DTO는 dto/request/, dto/response/ 에 별도 파일로 정의
  □ Controller에 비즈니스 로직 없음

□ adapter/out/persistence/ 에 구현체 생성
  □ JpaEntity (JPA 어노테이션은 여기에만!)
  □ JpaRepository
  □ PersistenceAdapter (RepositoryPort 구현, Domain ↔ Entity 매핑)
```

---

## 4. 프론트엔드 아키텍처 핵심 원칙

### 채택한 기술 스택

| 기술 | 용도 |
|------|------|
| Next.js (App Router) | SSR/SSG, 파일 기반 라우팅, API Routes |
| TypeScript | 타입 안전성 |
| Zustand | 전역 상태 (인증, 장바구니, 챗봇) |
| CSS Modules + CSS 변수 | 스코프된 컴포넌트 스타일 |
| iron-session | 서버 사이드 세션 (httpOnly 쿠키) |

### 핵심 아키텍처: BFF (Backend For Frontend) 패턴

```
브라우저 → fetchAPI('/endpoint') → /api/[...path] (BFF) → Spring Boot
```

**BFF의 역할:**
1. iron-session에서 JWT 추출 → Authorization 헤더 자동 주입
2. JWT가 httpOnly 쿠키에 저장 (XSS 방어)
3. 실제 백엔드 주소 은닉
4. 이미지 업로드 시 자동 압축 (Sharp, WebP 변환)
5. 멀티 백엔드 라우팅 (Spring Boot + FastAPI 통합)

### 표준 폴더 구조 원칙

```
# 컴포넌트 구조 원칙
ComponentName/
├── ComponentName.tsx         # 컴포넌트 로직
├── ComponentName.module.css  # 전용 스타일
└── index.ts                  # re-export

# 페이지 구조 원칙  
app/some-page/
├── page.tsx                  # 150줄 이하! 레이아웃 + 조합만
├── page.module.css
└── _components/              # 페이지 전용 컴포넌트
    ├── SomeSection/
    └── AnotherSection/
```

---

## 5. 프론트엔드에서 반복된 실수 패턴

### 🔴 실수 #1: page.tsx에 모든 것을 다 넣기

**최악의 사례:** `mypage/page.tsx` — **619줄**, 5개 이상의 섹션이 단일 파일에

```
프로필 수정 + 비밀번호 변경 + 주문 내역 + 즐겨찾기 + 계정 탈퇴
→ 모두 하나의 page.tsx에
```

**리팩토링 후:**
```
page.tsx (127줄) — 탭 전환 + 레이아웃만
_components/
├── ProfileSection/
├── PasswordSection/
├── OrderHistory/
├── FavoritesList/
└── DeleteAccount/
```

**왜 실수했는가:**
- "잠깐만 여기에 추가하자" → 기능이 쌓이면 거대해짐
- `_components/` 폴더를 만드는 초기 비용이 귀찮게 느껴짐

**예방법:**
- ✅ page.tsx 생성 시 **동시에 `_components/` 폴더도 생성**
- ✅ page.tsx가 **150줄을 넘기면 즉시 분리**
- ✅ page.tsx의 역할: **레이아웃 조합 + 데이터 패칭 위임**만

---

### 🔴 실수 #2: 단일 컴포넌트에 UI + 로직 혼재

**최악의 사례:** `ChatWidget.tsx` — **560줄**, UI 렌더링 + 메시지 처리 + Cart 연동 + SSE 스트리밍

**리팩토링 후:**
```
ChatWidget/
├── ChatWidget.tsx (메인 컨테이너)
├── ChatHeader/
├── ChatMessages/
├── ChatInput/
├── ChatMessageBubble/
└── useChatLogic.ts (커스텀 훅 — 로직 분리)
```

**예방법:**
- ✅ **Feature Component + Custom Hook 패턴** 적용
  - `use{Feature}.ts`: API 호출, 상태 관리, 비즈니스 로직
  - `{Feature}.tsx`: UI 렌더링만
- ✅ 컴포넌트가 **300줄을 넘기면** 서브 컴포넌트로 분리

---

### 🟡 실수 #3: 컴포넌트가 폴더 없이 단독 파일로 존재

**잘못된 패턴:**
```
components/auth/
├── LoginForm.tsx           ← 폴더 없이 단독 파일
├── LoginForm.module.css
├── SignupForm.tsx           ← 폴더 없이 단독 파일 + LoginForm.module.css 공유!
└── AuthErrorHandler.tsx
```

**올바른 패턴:**
```
components/auth/
├── LoginForm/
│   ├── LoginForm.tsx
│   ├── LoginForm.module.css
│   └── index.ts
├── SignupForm/
│   ├── SignupForm.tsx
│   ├── SignupForm.module.css   ← 전용 CSS
│   └── index.ts
└── index.ts                    ← barrel export
```

**왜 실수했는가:**
- "파일 하나인데 폴더까지 만들어야 해?" → 규모가 커지면 관리 불가
- CSS를 공유하면 한쪽 수정이 다른 쪽에 영향

**예방법:**
- ✅ **모든 컴포넌트는 폴더로 생성** — 예외 없음
- ✅ 각 컴포넌트는 **전용 CSS Module** 보유
- ✅ `index.ts`로 re-export하여 import 경로 깔끔하게 유지

---

### 🟡 실수 #4: 코드 복붙

**발생 사례:** `LoginForm.tsx`와 `SignupForm.tsx`에 `CustomGoogleLoginButton`이 복붙으로 존재

**예방법:**
- ✅ 2번 이상 사용되는 코드 → 즉시 공유 컴포넌트로 추출
- ✅ `components/auth/GoogleLoginButton/`으로 분리

---

### 🟡 실수 #5: API 함수를 하나의 파일에 전부 작성

**잘못된 패턴:** `app/lib/api.ts` — 283줄에 모든 도메인 API 함수

**올바른 패턴:**
```
app/lib/api/
├── client.ts         # 공통 fetch wrapper
├── authAPI.ts        # 인증 API
├── userAPI.ts        # 사용자 API
├── adminAPI.ts       # 관리자 API
└── index.ts          # re-export
```

**예방법:**
- ✅ API 함수는 **도메인별로 별도 파일**로 분리
- ✅ 공통 fetch wrapper는 `client.ts`에 한 번만 정의

---

### 🟡 실수 #6: BFF 라우트 핸들러를 하나의 파일에 전부 작성

**잘못된 패턴:** `app/api/[...path]/route.ts` — 282줄에 로그인, 구글로그인, 프록시 등 모든 로직

**올바른 패턴:**
```
app/api/[...path]/
├── route.ts              # 라우터 (분기만 담당, ~40줄)
└── handlers/
    ├── authHandlers.ts   # 인증 관련 핸들러
    └── proxyHandler.ts   # 일반 API 프록시
```

**예방법:**
- ✅ route.ts는 **라우팅 분기만** 담당
- ✅ 실제 로직은 `handlers/` 폴더에 도메인별로 분리

---

## 6. 프론트엔드 컴포넌트 설계 체크리스트

> 새 페이지/컴포넌트를 생성할 때 아래 체크리스트를 따릅니다.

```
□ 페이지 (page.tsx) 생성 시
  □ 동시에 _components/ 폴더 생성
  □ page.tsx는 150줄 이하로 유지 계획
  □ 복잡한 로직은 커스텀 훅(use{Feature}.ts)으로 분리 계획
  □ 전용 page.module.css 생성

□ 컴포넌트 생성 시
  □ 폴더 구조: ComponentName/ComponentName.tsx + .module.css + index.ts
  □ 전용 CSS Module (다른 컴포넌트와 공유 금지)
  □ 300줄 초과 시 서브 컴포넌트 분리

□ 공유 컴포넌트 (components/) vs 페이지 전용 (_components/) 구분
  □ 2개 이상 페이지에서 사용 → components/
  □ 특정 페이지에서만 사용 → 해당 페이지의 _components/

□ API 함수
  □ 도메인별 별도 파일 (authAPI.ts, userAPI.ts 등)
  □ 공통 fetch wrapper(client.ts) 사용

□ 전역 상태 (Zustand)
  □ 관심사별 스토어 분리 (auth, cart, chat 등)
  □ JWT는 Zustand에 저장하지 않음 (서버 세션으로 관리)
```

---

## 7. 공통 교훈 — 설계 시 기억할 것들

### 교훈 1: "나중에 고치자"는 없다

> NCafe에서 16개의 리팩토링 항목이 나왔고, 모두 "나중에"가 누적된 결과.

- 처음부터 구조를 잡는 비용: **1시간**
- 나중에 리팩토링하는 비용: **10시간 이상** (영향 분석, 테스트, 회귀 검증)

### 교훈 2: 기준 모듈을 먼저 완성하라

> `menu` 모듈이 이상적인 기준이 되었고, 나머지 모듈을 이에 맞춰 리팩토링.

- **첫 번째 모듈을 가장 정성들여** 만들어라
- 이후 모듈은 그 구조를 **복사-붙여넣기 + 수정**으로 시작
- 기준 모듈 문서(아키텍처 가이드)를 먼저 작성

### 교훈 3: 고객용 / 관리자용 분리는 처음부터

> NCafe에서 고객용 `menu/`와 관리자용 `admin/menu/`를 분리한 것은 좋은 결정이었음.

- 같은 도메인이라도 **CRUD 주체가 다르면 모듈 분리**
- 보안 정책, 변경 빈도, UseCase가 완전히 다름

### 교훈 4: 파일 크기가 곧 아키텍처 품질의 지표

| 파일 크기 | 상태 |
|-----------|------|
| ~150줄 | ✅ 적정 |
| 150~300줄 | ⚠️ 분리 검토 |
| 300줄 이상 | 🔴 즉시 분리 |
| 500줄 이상 | 🚨 아키텍처 위반 |

### 교훈 5: 의존성 방향을 항상 확인하라

**백엔드:**
```
Adapter → Application(Port, Service) → Domain
(항상 바깥 → 안쪽으로만!)
```

**프론트엔드:**
```
페이지(page.tsx) → 컴포넌트 → 커스텀 훅 → API 클라이언트 → BFF → 백엔드
```

import 문을 보고 의존 방향이 역행하면 즉시 수정.

### 교훈 6: 명명 규칙을 통일하라

**백엔드:**
```
UseCase:    {동작}{도메인}UseCase     (CreateOrderUseCase)
Service:    {동작}{도메인}Service     (CreateOrderService)
Port(Out):  {도메인}RepositoryPort   (OrderRepositoryPort)
Controller: {역할}{도메인}Controller  (AdminMenuController)
Adapter:    {도메인}PersistenceAdapter (OrderPersistenceAdapter)
Command:    {동작}{도메인}Command     (CreateMenuCommand)
Result:     {동작}{도메인}Result      (GetMenuDetailResult)
```

**프론트엔드:**
```
페이지:     app/{route}/page.tsx
컴포넌트:   {ComponentName}/{ComponentName}.tsx
커스텀 훅:  use{Feature}.ts
API 함수:   {domain}API.ts
전역 상태:  use{Domain}Store.ts
```

---

## 8. 리팩토링 진행 방법론

### NCafe에서 검증된 Phase 전략

#### 백엔드 리팩토링 순서 (효과 대비 노력 기준)

| Phase | 내용 | 이유 |
|-------|------|------|
| **Phase 1** | 불완전한 모듈 구조 보완 (Port/Adapter 추가) | 가장 빠르게 구조 개선 가능 |
| **Phase 2** | 도메인 모델에 행위 추가 + DTO 분리 | 코드 중복 제거의 기반 |
| **Phase 3** | Service의 JPA 직접 참조 → Port 전환 | 가장 영향 범위가 큼, 신중하게 |
| **Phase 4** | 잔여 모듈 정리 + 위치 이동 | 마무리 작업 |
| **Phase 5** | 코드 품질 (DTO 타입화, inner class 분리) | 선택적 개선 |

#### 프론트엔드 리팩토링 순서

| Phase | 내용 | 이유 |
|-------|------|------|
| **Phase 1** | 600줄 이상 파일 분리 | 가장 심각한 문제 우선 |
| **Phase 2** | 300~600줄 파일 분리 | 중요도 순 |
| **Phase 3** | 공유 컴포넌트 폴더 구조 정리 | 컨벤션 통일 |
| **Phase 4** | API/라우트 핸들러 분리 | 선택적 개선 |

### 리팩토링 시 주의사항

1. **Phase 단위로 Git 브랜치** 분리하여 작업
2. 각 Phase 완료 후 **전체 기능 테스트** 실시
3. **import 경로 변경** 시 영향 받는 모든 파일 확인
4. CSS Module 분리 시 **기존 스타일 누락** 주의
5. 상태 관리 분리 시 **props 전달 체인** 검증

---

## 📝 최종 요약: 새 프로젝트 시작 전 필독

> [!IMPORTANT]
> **가장 중요한 3가지 원칙:**

### 1. 구조를 먼저 잡아라
- 백엔드: 첫 모듈을 헥사고날 구조로 완벽하게 만들고, 문서화
- 프론트엔드: 첫 페이지부터 `_components/` + 커스텀 훅 패턴 적용

### 2. 계층을 넘지 마라
- 백엔드: Service → JPA Repository 직접 참조 금지. Port를 통해서만!
- 프론트엔드: page.tsx에 비즈니스 로직 금지. 커스텀 훅으로 분리!

### 3. 파일 크기를 감시하라
- 300줄 넘으면 경고, 500줄 넘으면 즉시 분리
- "일단 여기에 추가하자"는 기술 부채의 시작
