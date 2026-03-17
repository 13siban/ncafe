# 🔧 백엔드 리팩토링 제안서

`menu` 모듈을 이상적인 헥사고날 아키텍처의 기준으로 삼고,  
나머지 모든 모듈의 아키텍처 위반 사항 및 코드 품질 이슈를 종합 분석한 결과입니다.

---

## 📐 기준: `menu` 모듈의 이상적 구조

```
menu/
├── adapter/
│   ├── in/web/
│   │   ├── MenuController.java              ← REST API
│   │   └── dto/
│   │       ├── request/                      ← 요청 DTO 별도 파일
│   │       └── response/                     ← 응답 DTO 별도 파일
│   └── out/persistence/
│       ├── MenuJpaEntity.java                ← JPA 엔티티 (도메인과 완전 분리)
│       ├── MenuJpaRepository.java            ← Spring Data 인터페이스
│       └── MenuPersistenceAdapter.java       ← Port 구현체 (Entity ↔ Domain 변환)
├── application/
│   ├── command/                              ← 입력 커맨드 객체
│   ├── port/
│   │   ├── in/  (UseCase 인터페이스)          ← 인바운드 포트
│   │   └── out/ (RepositoryPort 인터페이스)   ← 아웃바운드 포트 (도메인 모델만 반환)
│   ├── result/                               ← 출력 결과 객체
│   └── service/                              ← UseCase 구현체 (Port만 의존)
└── domain/model/
    ├── Menu.java                             ← 순수 POJO 도메인 모델
    └── MenuImage.java
```

**헥사고날 핵심 원칙:**
1. `domain` → JPA/Spring 의존 없는 순수 POJO
2. `application/port/out` → 도메인 모델만 반환 (JPA 엔티티 X)
3. `service` → Port를 통해서만 DB 접근 (JPA Repository 직접 참조 X)
4. `adapter/in/web/dto` → 요청/응답 DTO 별도 파일
5. 다른 모듈과 소통 시 → 해당 모듈의 Port(인터페이스)를 통해서만

---

## 🔴 우선순위 높음 — 아키텍처 위반

### 1. `GetOrderService` (217줄) — Service가 JPA Entity/Repository 직접 사용

> 가장 심각한 헥사고날 위반. Service 레이어에서 자신의 Persistence Adapter를 우회하여 JPA에 직접 접근.

```java
// GetOrderService.java — Service에서 Adapter 레이어 직접 참조 ❌
private final OrderJpaRepository orderRepository;          // Port 아닌 JPA Repository
private final OrderItemJpaRepository orderItemRepository;  // Port 아닌 JPA Repository
private final OrderOptionSelectionJpaRepository orderOptionRepository;
private final MenuJpaRepository menuRepository;            // 다른 모듈의 JPA Repository까지!
```

**추가 문제 — findAll() 후 stream().filter() 패턴 (N+1 성능 문제):**
```java
// 전체를 메모리에 로드 후 필터링 ❌ (데이터 많아지면 심각한 성능 문제)
orderRepository.findAll().stream()
    .filter(o -> o.getOrderDate().equals(date) && o.getOrderNumber().equals(number))  // L40-42
```
```java
orderItemRepository.findAll().stream()
    .filter(i -> i.getOrderId().equals(order.getId()))  // L137-138, L187-188
```
```java
orderOptionRepository.findAll().stream()
    .filter(opt -> opt.getOrderItemId().equals(item.getId()))  // L143-144
```

이 패턴이 **`getOrder()`, `mapToDto()`, `mapToListDto()`, `getMyOrders()`, `getAllOrders()`, `getOrdersByKeys()`** 6개 메서드에서 반복됨.

**제안:**
- `OrderRepositoryPort`에 `findByOrderDateAndOrderNumber()`, `findItemsByOrderId()` 등 추가
- `OrderPersistenceAdapter`에서 JPA 쿼리로 구현
- Service에서는 Port만 사용


### 2. `CreateOrderService` (238줄) — 다른 모듈의 JPA Repository 직접 참조

> Service에서 `admin.menu`와 `menuoption`의 persistence adapter 레이어에 직접 의존.

```java
// CreateOrderService.java L3-9: 다른 모듈의 Adapter 레이어 import ❌
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaEntity;
import com.new_cafe.app.backend.admin.menu.adapter.out.persistence.AdminMenuJpaRepository;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionGroupJpaEntity;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionGroupJpaRepository;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionItemJpaEntity;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionItemJpaRepository;
```

**추가 문제 — 238줄 단일 메서드에 모든 로직:**
- 가격 계산 (L76-87)
- 포인트 잔액 확인 (L92-99)
- 결제 검증 (L103-113)
- 등급별 적립률 계산 (L115-121)
- Order 엔티티 생성 (L123-139)
- 주문 아이템 + 옵션 저장 루프 (L144-195)
- 포인트 사용/적립 처리 (L197-209)
- SSE 알림 전송 (L215-222)
- 응답 생성 (L224-236)

**제안:**
```diff
- private final AdminMenuJpaRepository menuRepository;           // ❌
- private final OptionGroupJpaRepository optionGroupRepository;  // ❌
- private final OptionItemJpaRepository optionItemRepository;    // ❌
+ private final MenuRepositoryPort menuRepository;               // ✅ Port
+ private final MenuOptionRepositoryPort optionRepository;       // ✅ Port
```
메서드 분리:
- `calculateOrderPrice()` → 금액 계산
- `verifyPayment()` → 결제 검증 + 포인트 확인
- `saveOrderAndItems()` → 주문 + 아이템 + 옵션 저장
- `processPointsAndNotify()` → 포인트 + 등급 + SSE 알림


### 3. `ManageOrderStatusService` (157줄) — 여러 모듈의 JPA Repository 직접 참조

```java
// ManageOrderStatusService.java — 4개 모듈의 Adapter 직접 참조 ❌
private final OrderItemJpaRepository orderItemRepository;      // 자기 모듈인데 Port 안쓰고 직접
private final DailyMenuSalesJpaRepository dailyMenuSalesRepository; // sales 모듈
private final AdminMenuJpaRepository menuRepository;              // admin.menu 모듈
private final CategoryJpaRepository categoryRepository;           // category 모듈
```

**추가 문제 — `aggregateDailySales()`에서 findAll().stream().filter() 패턴 반복 (L126-128, L131-132)**

**추가 문제 — `changeOrderStatus()`와 `rejectOrder()`의 Order 빌더 중복 (L41-58과 L90-107이 거의 동일)**

**제안:**
- Order 도메인에 상태 변경 메서드 추가: `order.changeStatus(newStatus)`, `order.reject(reason)`
- `aggregateDailySales()`를 SalesRepositoryPort 쪽에 위임


### 4. `notice` 모듈 — 가장 불완전한 헥사고날

| 누락/위반 | 상세 |
|---|---|
| **Persistence Adapter 없음** | Entity와 Repository만 있고, Port 구현체가 없음 |
| **Out Port 없음** | `application/port/out/` 디렉터리 자체가 없음 |
| **Service → JPA Entity/Repository 직접 참조** | `AdminNoticePopupService`가 `NoticePopupJpaEntity` import |
| **Controller에 DTO 내장** | `NoticePopupRequest` 클래스가 Controller.java L78-84에 붙어있음 |
| **Controller에 파일 업로드 로직** | UUID 생성, 파일 저장이 Controller에 직접 구현 (L51-75) |

**현재 구조:**
```
notice/
├── adapter/in/web/
│   ├── AdminNoticePopupController.java  ← 파일 업로드 + DTO 클래스 내장
│   └── NoticePopupController.java
├── adapter/out/persistence/
│   ├── NoticePopupJpaEntity.java
│   └── NoticePopupJpaRepository.java     ← Adapter 없음!
├── application/
│   ├── port/in/                           ← out 포트 없음!
│   └── service/
│       └── AdminNoticePopupService.java   ← JPA Entity+Repository 직접 참조
└── domain/
    └── NoticePopup.java
```


### 5. `sales` 모듈 — Out Port가 JPA Entity 반환

```java
// SalesRepositoryPort.java — Port 인터페이스가 JPA Entity를 반환 ❌
public interface SalesRepositoryPort {
    List<DailyMenuSalesJpaEntity> findBySaleDate(LocalDate date);           // ❌
    List<DailyMenuSalesJpaEntity> findBySaleDateBetween(LocalDate start, LocalDate end);  // ❌
}
```

**문제:** Port가 `DailyMenuSalesJpaEntity`(JPA 엔티티)를 반환하므로, Service가 JPA에 의존하게 됨. Port의 존재 의미가 없어짐.

**추가 문제 — domain/model 디렉터리 자체가 없음.** 도메인 모델 없이 JPA Entity로만 동작.

**제안:**
```diff
+ // domain/model/DailyMenuSales.java 생성
- List<DailyMenuSalesJpaEntity> findBySaleDate(LocalDate date);
+ List<DailyMenuSales> findBySaleDate(LocalDate date);
```


### 6. `FavoriteService` (177줄) — 6개 모듈의 JPA Repository 직접 참조

> 가장 많은 외부 모듈 의존성을 가진 서비스.

```java
// FavoriteService.java L3-12: 4개 외부 모듈의 Adapter 직접 참조 ❌
import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
import com.new_cafe.app.backend.menu.adapter.out.persistence.MenuImageJpaEntity;
import com.new_cafe.app.backend.menu.adapter.out.persistence.MenuImageJpaRepository;
import com.new_cafe.app.backend.menu.adapter.out.persistence.MenuJpaEntity;
import com.new_cafe.app.backend.menu.adapter.out.persistence.MenuJpaRepository;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionGroupJpaEntity;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionGroupJpaRepository;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionItemJpaEntity;
import com.new_cafe.app.backend.menuoption.adapter.out.persistence.OptionItemJpaRepository;
```

**제안:** 각 모듈의 Port를 통해 접근
```diff
- private final MenuJpaRepository menuRepository;
- private final MenuImageJpaRepository menuImageRepository;
- private final OptionGroupJpaRepository optionGroupRepository;
- private final OptionItemJpaRepository optionItemRepository;
+ private final MenuRepositoryPort menuRepository;
+ private final MenuImageRepositoryPort menuImageRepository;
+ private final MenuOptionRepositoryPort optionRepository;
```


### 7. `AdminGradeSettingsService` (168줄) — Service가 JPA Entity/Repository 직접 참조

```java
// AdminGradeSettingsService.java — Adapter 직접 참조 ❌
private final GradeSettingsJpaRepository repository;
private final GradeSystemConfigJpaRepository configRepository;
private final UserJpaRepository userRepository;  // 다른 모듈(auth)의 JPA Repository
```

**Out Port(`GradeSettingsRepositoryPort`)과 Persistence Adapter가 없음.**


---

## 🟡 우선순위 중간 — 설계/구조 문제

### 8. `payment` 모듈 — 패키지 구조 전무

```
payment/
└── PaymentVerificationService.java   ← 파일 1개뿐. adapter/port/domain 없음.
```

다른 모든 모듈과 달리 헥사고날 구조가 전혀 없음.
`CreateOrderService`와 `ManageOrderStatusService`가 이 Service를 직접 주입받아 사용.

**제안:**
```
payment/
├── application/
│   ├── port/in/PaymentVerificationUseCase.java   ← 인터페이스 추출
│   └── service/PaymentVerificationService.java
```


### 9. `AdminUserController` (120줄) — Controller에서 JPA Repository 직접 사용

```java
// AdminUserController.java L14, L37
import com.new_cafe.app.backend.auth.adapter.out.persistence.UserJpaRepository;
private final UserJpaRepository userJpaRepository;  // Controller에서 JPA 직접! ❌
```

`toggleLock()` 메서드 (L69-83)에서 Controller가 JPA Repository로 직접 User를 조회/저장.
이 로직은 UseCase로 추출해야 함.


### 10. 주문 모듈 DTO 구조 문제

**UseCase 인터페이스에 inner class DTO가 너무 많음:**

```java
// GetOrderUseCase.java 내부에 OrderDto, OrderListDto, TopMenuDto, OrderKey 정의
// CreateOrderUseCase.java 내부에 CreateOrderCommand, OrderResponse, OrderItemResponse, 
//   OrderOptionResponse, OrderItemCommand, OrderOptionCommand 정의
```

**추가 문제: `GetOrderService`가 `CreateOrderUseCase.OrderItemResponse`를 응답으로 사용 (L141, L155)**
→ Get 서비스가 Create UseCase의 응답 DTO에 의존하는 구조적 순환

**제안:** 공통 DTO는 별도 `dto/` 패키지로 분리


### 11. `AdminOrderController` — inner class DTO

```java
// AdminOrderController.java L54-62
@Data
static class StatusRequest { ... }
@Data
static class RejectRequest { ... }
```

별도 `dto/` 디렉터리로 분리 필요.


### 12. 도메인 모델에 행위(메서드) 부재 — 빈혈 도메인(Anemic Domain) 문제

**`Order` 도메인에 상태 변경 메서드가 없어서 매번 빌더로 전체 재생성:**
```java
// ManageOrderStatusService.java — Order 업데이트할 때 (L41-58)
Order updatedOrder = Order.builder()
    .id(order.getId())
    .orderDate(order.getOrderDate())
    .orderNumber(order.getOrderNumber())
    .userId(order.getUserId())
    .customerName(order.getCustomerName())
    .status(newStatus)               // 이것만 바뀜
    .totalPrice(order.getTotalPrice())
    .usedPoints(order.getUsedPoints())
    .earnPoints(order.getEarnPoints())
    .rejectReason(order.getRejectReason())
    .memo(order.getMemo())
    .paymentId(order.getPaymentId())
    .paymentMethod(order.getPaymentMethod())
    .paymentStatus(order.getPaymentStatus())
    .createdAt(order.getCreatedAt())
    .updatedAt(order.getUpdatedAt())
    .build();
```

**동일한 패턴이 `rejectOrder()`에서도 반복 (L90-107)**

**`GalleryImageService`도 같은 문제:**
```java
// GalleryImageService.java — sortOrder만 바꾸려고 전체 빌더 사용
GalleryImage updated = GalleryImage.builder()
    .id(image.getId())
    .imageUrl(image.getImageUrl())
    .sortOrder(sortOrder)         // 이것만 바뀜
    .isVisible(image.getIsVisible())
    .createdAt(image.getCreatedAt())
    .build();
```

**제안:** 도메인 모델에 행위 추가
```java
// Order.java
public void changeStatus(OrderStatus newStatus) { this.status = newStatus; }
public void reject(String reason) { this.status = OrderStatus.REJECTED; this.rejectReason = reason; }

// GalleryImage.java
public void updateSort(int sortOrder) { this.sortOrder = sortOrder; }
public void updateVisibility(boolean visible) { this.isVisible = visible; }
```


### 13. `UserPointService`가 `auth` 패키지에 위치

```
auth/application/service/UserPointService.java  ← 포인트 관련인데 auth에?
```

포인트 관리는 인증(auth)과 무관한 기능. `user/point/` 하위 패키지로 이동하는 것이 적절.


---

## 🟢 우선순위 낮음 — 코드 품질

### 14. `AdminMenuOptionController` — DTO 대신 `Map<String, Object>` 사용

```java
// AdminMenuOptionController.java L60-68
public Map<String, String> addCategoryOptionMap(
    @PathVariable Long id,
    @RequestBody Map<String, Object> body) {    // ❌ 타입 안전하지 않음
    Long optionGroupId = Long.valueOf(body.get("optionGroupId").toString());
    Integer sortOrder = body.containsKey("sortOrder") ? ... : 1;
```

`@RequestBody Map<String, Object>` 대신 전용 Request DTO를 사용해야 함.
같은 문제가 L88-93에서도 반복.


### 15. `SecurityConfig` — `/orders/**` 전체 허용

```java
// SecurityConfig.java L49
.requestMatchers("/orders/**", "/api/orders/**").permitAll()
```

주문 생성(POST), 주문 조회(GET)가 모두 인증 없이 가능.  
`GET /orders/{date}/{number}`로 아무나 다른 사람의 주문을 조회할 수 있는 보안 문제.

**제안:**
```java
.requestMatchers(HttpMethod.POST, "/orders/**").permitAll()    // 비회원 주문 허용
.requestMatchers(HttpMethod.GET, "/orders/my/**").authenticated()  // 내 주문 조회는 인증 필요
```


### 16. `GetOrderUseCase.getOrder()` — 전체 스캔 후 필터링

```java
// GetOrderService.java L40-43
OrderJpaEntity order = orderRepository.findAll().stream()
    .filter(o -> o.getOrderDate().equals(date) && o.getOrderNumber().equals(number))
    .findFirst()
    .orElseThrow();
```

`findAll()` 후 stream filter는 주문이 많아지면 심각한 성능 문제.
`findByOrderDateAndOrderNumber(date, number)` 쿼리 메서드 추가 필요.


---

## 📊 모듈별 아키텍처 준수도 종합 평가

| 모듈 | Port (in) | Port (out) | Adapter | 도메인 분리 | DTO 분리 | Service 순수성 | 점수 |
|---|---|---|---|---|---|---|---|
| **menu** (기준) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Port만 참조 | ⭐⭐⭐⭐⭐ |
| **admin/menu** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐⭐ |
| **menuoption** | ✅ | ✅ | ✅ | ✅ | ⚠️ Map 사용 | ✅ | ⭐⭐⭐⭐ |
| **category** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ |
| **store** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ⭐⭐⭐⭐ |
| **auth** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ JPA 직접 | ⭐⭐⭐ |
| **gallery** | ✅ | ✅ | ✅ | ⚠️ 빈혈 도메인 | ❌ | ✅ | ⭐⭐⭐ |
| **order** | ✅ | ✅ | ✅ | ⚠️ 빈혈 도메인 | ❌ inner class | ❌ JPA 직접 | ⭐⭐ |
| **user/grade** | ✅ | ❌ 없음 | ❌ 없음 | ✅ | ✅ | ❌ JPA 직접 | ⭐⭐ |
| **user/favorite** | ✅ | ❌ 없음 | ❌ 없음 | ✅ | ✅ | ❌ 6개 JPA 직접 | ⭐ |
| **sales** | ✅ | ⚠️ JPA Entity 반환 | ✅ | ❌ 도메인 없음 | ❌ | ❌ JPA Entity 참조 | ⭐ |
| **notice** | ✅ | ❌ 없음 | ❌ 없음 | ✅ | ❌ 내장 | ❌ JPA 직접 | ⭐ |
| **payment** | ❌ 없음 | ❌ 없음 | ❌ 없음 | ❌ 없음 | ❌ | N/A | ☆ |


---

## 🏁 추천 작업 순서

> 효과 대비 노력이 적은 순서로 정렬

### Phase 1: 빠른 수정 ✅ 완료
1. ✅ **notice 모듈 리팩토링** — Out Port + PersistenceAdapter + DTO 분리 완료
2. ✅ **sales Out Port 수정** — 도메인 모델 `DailyMenuSales` 추가, Port/Adapter/Service 반영
3. ✅ **payment 구조화** — `PaymentVerificationUseCase` 인터페이스 추출

### Phase 2: 도메인 개선 ✅ 완료
4. ✅ **Order 도메인에 행위 추가** — `changeStatus()`, `reject()` 메서드 추가
5. ✅ **GalleryImage 도메인에 행위 추가** — `updateSort()`, `updateVisibility()` 추가
6. ✅ **Order DTO inner class를 별도 파일로 분리** — `StatusRequest`, `RejectRequest`

### Phase 3: 의존성 정리 ✅ 완료
7. ✅ **GetOrderService 리팩토링** — JPA Entity/Repository 6개 직접 참조 → OrderRepositoryPort + MenuRepositoryPort. findAll().filter() 성능 문제 해결.
8. ✅ **CreateOrderService 리팩토링** — AdminMenuJpaRepo/OptionGroupJpaRepo/OptionItemJpaRepo 3개 → MenuRepositoryPort + MenuOptionRepositoryPort. 238줄 모노리식 메서드 → 7개 private 메서드로 분리.
9. ✅ **ManageOrderStatusService 리팩토링** — 빌더 중복 제거 + 포인트 환급 메서드 추출 + orderItemRepo → Port

### Phase 4: 잔여 모듈 정리 ✅ 완료
10. ✅ **FavoriteService** — 6개 JPA Repository → Port 전환 (FavoriteRepositoryPort + LoadUserPort + MenuRepositoryPort + MenuImageRepositoryPort + MenuOptionRepositoryPort)
11. ✅ **AdminGradeSettingsService** — GradeSettingsRepositoryPort + GradeSettingsPersistenceAdapter 추가
12. ✅ **AdminUserController** — `toggleLock()` → `ToggleAdminUserLockUseCase`로 추출
13. ✅ **UserPointService** — `auth` → `user/point` 패키지 이동 완료
14. ✅ **SecurityConfig** — `/orders/**` permitAll 유지 + OrderController 런타임 권한 체크 (비회원 주문 호환)

### Phase 5: 코드 품질 ✅ 완료
15. ✅ **AdminMenuOptionController** — `Map<String, Object>` → `CategoryOptionMapRequest` / `MenuOptionExclusionRequest` DTO
16. ✅ **AdminOrderController** — inner class DTO → 별도 `dto/` 패키지 분리
