# 🚪 Port In / Port Out 쉽게 이해하기

> **헥사고날 아키텍처의 핵심 개념인 Port In과 Port Out을 카페 비유로 설명합니다.**  
> 이 문서는 [BACKEND_HEXAGONAL_ARCHITECTURE.md](./BACKEND_HEXAGONAL_ARCHITECTURE.md)의 보충 자료입니다.

---

## 📖 목차

1. [한줄 요약](#1-한줄-요약)
2. [Port In — 주문 카운터](#2-port-in--주문-카운터-)
3. [Port Out — 재료 주문서](#3-port-out--재료-주문서-)
4. [전체 흐름 한눈에 보기](#4-전체-흐름-한눈에-보기)
5. [비교 표](#5-비교-표)
6. [실제 코드로 보는 흐름](#6-실제-코드로-보는-흐름)
7. [왜 이렇게 나누는가?](#7-왜-이렇게-나누는가)

---

## 1. 한줄 요약

> Port In/Out은 둘 다 **인터페이스(계약서)**인데, **누가 호출하고 누가 구현하느냐**의 방향이 반대입니다.

| | Port In | Port Out |
|---|---------|----------|
| **한줄 정의** | "나한테 이렇게 요청해" | "나는 이게 필요해" |
| **호출하는 쪽** | Controller (외부) | Service (내부) |
| **구현하는 쪽** | Service (내부) | DB Adapter (외부) |

---

## 2. Port In — 주문 카운터 🛎️

### 개념

> **"외부에서 우리한테 뭘 요청할 수 있는지"** 를 정의하는 **메뉴판(계약서)**

카페의 카운터에 메뉴판이 있습니다. 손님은 메뉴판에 적힌 것만 주문할 수 있죠.  
**Port In = 그 메뉴판**입니다.

Controller(손님)가 "이런 일을 해주세요"라고 **요청할 수 있는 기능 목록**을 인터페이스로 정의합니다.

```
손님(Controller) → 카운터 메뉴판(Port In = UseCase) → 바리스타(Service가 만들어줌)
```

### 코드 예시

```java
// ✅ Port In 예시 — "우리 카페에서 할 수 있는 것들"
public interface CreateOrderUseCase {
    OrderResponse createOrder(CreateOrderCommand command, String userId);
}

public interface GetMenuListUseCase {
    List<MenuSummary> getMenuList();
}

public interface ManageOrderStatusUseCase {
    void acceptOrder(Long orderId);
    void rejectOrder(Long orderId, String reason);
}
```

### 핵심 포인트

- Controller는 `CreateOrderService`(구현체)를 **직접 모릅니다**
- `CreateOrderUseCase`(인터페이스)만 알고 호출합니다
- 이것이 **느슨한 결합(Loose Coupling)**의 핵심!
- 네이밍 규칙: `{동작}{도메인}UseCase` (예: `CreateOrderUseCase`, `GetMenuDetailUseCase`)

### 우리 프로젝트의 Port In 예시

| UseCase | 역할 |
|---------|------|
| `CreateOrderUseCase` | 주문 생성 |
| `GetMenuDetailUseCase` | 메뉴 상세 조회 |
| `ManageOrderStatusUseCase` | 주문 상태 변경 (수락/거절) |
| `LoginUseCase` | 로그인 |
| `ManageFavoriteUseCase` | 즐겨찾기 추가/삭제 |
| `GetStoreSettingsUseCase` | 매장 설정 조회 |

---

## 3. Port Out — 재료 주문서 📦

### 개념

> **"우리(비즈니스 로직)가 외부에 뭘 부탁해야 하는지"** 를 정의하는 **요청서(계약서)**

바리스타(Service)가 커피를 만들려면 원두, 우유 등의 재료가 필요합니다.  
바리스타는 "원두 가져와", "우유 가져와"라고 **창고(DB)에 요청**합니다.  
**Port Out = 그 요청서**입니다.

바리스타는 창고가 어디 있는지, 어떻게 관리되는지 **알 필요 없이** 요청서만 쓰면 됩니다.

```
바리스타(Service) → 재료 주문서(Port Out = RepositoryPort) → 창고(PersistenceAdapter가 가져다줌)
```

### 코드 예시

```java
// ✅ Port Out 예시 — "우리가 외부에 필요한 것들"
public interface OrderRepositoryPort {
    Order save(Order order);                     // "이 주문 저장해줘"
    Optional<Order> findById(Long id);           // "이 주문 찾아줘"
    List<Order> findByUserId(String userId);     // "이 사람 주문 다 가져와"
    Integer getNextOrderNumber(LocalDate date);  // "다음 주문번호 알려줘"
}
```

### 핵심 포인트

- Service는 `OrderPersistenceAdapter`(JPA 구현체)를 **직접 모릅니다**
- "save 해줘, find 해줘"라고 **인터페이스에만 요청**합니다
- 나중에 DB를 PostgreSQL → MongoDB로 바꿔도 **Service 코드는 한 줄도 안 바뀝니다!**
- 네이밍 규칙: `{도메인}RepositoryPort` 또는 `{동작}{도메인}Port`

### 우리 프로젝트의 Port Out 예시

| RepositoryPort | 역할 |
|----------------|------|
| `OrderRepositoryPort` | 주문 데이터 저장/조회 |
| `MenuRepositoryPort` | 메뉴 데이터 조회 |
| `LoadUserPort` | 사용자 정보 로드 |
| `SaveUserPort` | 사용자 정보 저장 |
| `SaveAdminMenuPort` | 관리자 메뉴 저장 |
| `FavoriteRepositoryPort` | 즐겨찾기 데이터 관리 |

---

## 4. 전체 흐름 한눈에 보기

```
      요청이 들어오는 방향 →                           → 데이터를 가져오는 방향

  [Controller]  →  Port In(UseCase)  →  [Service]  →  Port Out(RepositoryPort)  →  [DB Adapter]
   (손님)          (메뉴판)              (바리스타)     (재료 주문서)                  (창고)

              ← 결과 반환 ←                          ← 데이터 반환 ←
```

### 주문 생성 흐름 (POST /orders)

```
① 손님이 카운터에 주문
   Controller.createOrder(request)
            │
            ▼
② 메뉴판에 있는 기능 호출 (Port In)
   CreateOrderUseCase.createOrder(command, userId)
            │
            ▼
③ 바리스타가 만들기 시작 (Service)
   CreateOrderService.createOrder()
            │
            ├── ④ "메뉴 정보 가져와" (Port Out)
            │       MenuRepositoryPort.findById(menuId)
            │               │
            │               ▼
            │       MenuPersistenceAdapter가 DB에서 조회 (Adapter Out)
            │
            ├── ⑤ "주문 저장해줘" (Port Out)
            │       OrderRepositoryPort.save(order)
            │               │
            │               ▼
            │       OrderPersistenceAdapter가 DB에 저장 (Adapter Out)
            │
            └── ⑥ 결과 반환
                    OrderResponse
```

---

## 5. 비교 표

| 구분 | Port In (인바운드) | Port Out (아웃바운드) |
|------|-------------------|---------------------|
| **방향** | 밖 → 안 (외부가 나를 호출) | 안 → 밖 (내가 외부를 호출) |
| **카페 비유** | 카운터 메뉴판 🛎️ | 재료 주문서 📦 |
| **누가 정의?** | Application 계층 | Application 계층 |
| **누가 호출?** | Controller (Adapter In) | Service (Application) |
| **누가 구현?** | Service (Application) | PersistenceAdapter (Adapter Out) |
| **인터페이스 예시** | `CreateOrderUseCase` | `OrderRepositoryPort` |
| **구현체 예시** | `CreateOrderService` | `OrderPersistenceAdapter` |
| **다루는 내용** | 비즈니스 기능 (주문, 조회, 로그인) | 기술적 기능 (DB 저장, 외부 API 호출) |
| **파일 위치** | `application/port/in/` | `application/port/out/` |

---

## 6. 실제 코드로 보는 흐름

### Step 1: Port In 정의 (메뉴판 만들기)

```java
// 📁 application/port/in/CreateOrderUseCase.java
// "주문 생성"이라는 기능이 있다고 선언만 합니다
public interface CreateOrderUseCase {
    OrderResponse createOrder(CreateOrderCommand command, String userId);
}
```

### Step 2: Port Out 정의 (재료 목록 만들기)

```java
// 📁 application/port/out/OrderRepositoryPort.java
// "주문을 저장하고 조회하는 기능이 필요하다"고 선언만 합니다
public interface OrderRepositoryPort {
    Order save(Order order);
    Optional<Order> findById(Long id);
}
```

### Step 3: Service 구현 (바리스타가 일하기)

```java
// 📁 application/service/CreateOrderService.java
@Service
@RequiredArgsConstructor
public class CreateOrderService implements CreateOrderUseCase {  // ← Port In 구현!
    
    private final OrderRepositoryPort orderRepository;  // ← Port Out 사용!
    private final MenuRepositoryPort menuRepository;    // ← 다른 Port Out도 사용!

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderCommand command, String userId) {
        // 1. 메뉴 조회 (Port Out을 통해)
        Menu menu = menuRepository.findById(command.getMenuId())
                .orElseThrow(() -> new RuntimeException("메뉴 없음"));
        
        // 2. 주문 생성 (순수 도메인 로직)
        Order order = Order.builder()
                .userId(userId)
                .menuId(menu.getId())
                .totalPrice(menu.getPrice())
                .build();
        
        // 3. 주문 저장 (Port Out을 통해)
        Order savedOrder = orderRepository.save(order);
        
        return new OrderResponse(savedOrder);
    }
}
```

### Step 4: Controller에서 호출 (손님이 주문)

```java
// 📁 adapter/in/web/OrderController.java
@RestController
@RequiredArgsConstructor
public class OrderController {
    
    private final CreateOrderUseCase createOrderUseCase;  // ← Port In만 알면 됨!
    // CreateOrderService를 직접 주입하지 않음!

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> createOrder(@RequestBody CreateOrderCommand command) {
        OrderResponse response = createOrderUseCase.createOrder(command, userId);
        return ResponseEntity.ok(response);
    }
}
```

### Step 5: Adapter에서 구현 (창고가 일하기)

```java
// 📁 adapter/out/persistence/OrderPersistenceAdapter.java
@Component
@RequiredArgsConstructor
public class OrderPersistenceAdapter implements OrderRepositoryPort {  // ← Port Out 구현!
    
    private final OrderJpaRepository jpaRepository;  // Spring Data JPA

    @Override
    public Order save(Order order) {
        OrderJpaEntity entity = toEntity(order);        // Domain → JPA 변환
        OrderJpaEntity saved = jpaRepository.save(entity);
        return toDomain(saved);                          // JPA → Domain 변환
    }
}
```

---

## 7. 왜 이렇게 나누는가?

### ❌ Port 없이 직접 의존하면?

```
Controller → Service(구현체) → JpaRepository(구현체)

😱 문제:
- Service를 바꾸면 Controller도 수정
- DB를 바꾸면 Service도 수정  
- 테스트할 때 진짜 DB가 필요
- 변경이 연쇄적으로 퍼짐
```

### ✅ Port를 통해 간접 의존하면?

```
Controller → Port In(인터페이스) ← Service(구현) → Port Out(인터페이스) ← Adapter(구현)

🎉 장점:
- Service를 바꿔도 Controller는 Port In만 보므로 무관
- DB를 바꿔도 Service는 Port Out만 보므로 무관
- 테스트할 때 Port를 가짜(Mock)로 대체 가능
- 변경이 한 곳에서 끝남
```

### 실용적 이점 정리

| 상황 | Port 없이 | Port 있으면 |
|------|----------|------------|
| DB를 PostgreSQL → MongoDB로 교체 | Service 코드 전부 수정 😱 | Adapter만 새로 만듦 ✅ |
| 테스트 작성 | 진짜 DB 필요 😱 | Port를 Mock으로 대체 ✅ |
| 외부 API 추가 (결제, 알림) | Service에 직접 HTTP 코드 작성 😱 | Port Out 정의 + Adapter 구현 ✅ |
| 기능 확장 (새 UseCase 추가) | 기존 Service 수정 😱 | 새 Port In + Service 추가 ✅ |

---

## 📝 최종 정리

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   Port In = 메뉴판 🛎️                                           │
│   "외부야, 나한테 이렇게 요청해"                                    │
│   Controller가 호출 → Service가 구현                               │
│                                                                  │
│   Port Out = 재료 주문서 📦                                       │
│   "외부야, 나는 이게 필요해"                                       │
│   Service가 호출 → DB Adapter가 구현                               │
│                                                                  │
│   둘 다 Application 계층에 있는 인터페이스(계약서)이고,               │
│   비즈니스 로직(Service)을 외부 기술로부터 보호하는 방패 🛡️ 역할!     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```
