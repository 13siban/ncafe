# 🛒 장바구니 & 주문 시스템 구현 계획서

## 개요

NCafe 프로젝트에 **장바구니 → 주문 → 관리자 주문 관리 → 대시보드 매출 연동**까지의 전체 흐름을 구현합니다.
실제 결제(PG 연동)는 추후에 추가할 예정이며, 우선은 **주문 접수 → 제조 → 완료/반려** 프로세스를 완성합니다.

### 핵심 정책
- **매장 영업시간 관리**: 관리자가 대시보드에서 **영업 개시/종료**를 제어합니다. 영업 중일 때만 고객이 주문할 수 있습니다.
- **주문 즉시 제조 돌입**: 고객이 주문하면 관리자가 별도로 "확인" 버튼을 누르지 않아도 자동으로 제조 대기열에 올라갑니다.
- **반려만 수동 처리**: 관리자가 명시적으로 "반려" 버튼을 눌러야만 주문이 취소됩니다.
- **주문번호 즉시 부여**: 주문 완료 시 고객에게 주문번호가 즉시 발급되어 본인의 주문을 추적할 수 있습니다.
- **회원/비회원 구분 표시**: 관리자 주문 목록에서 회원이면 **회원 이름**, 비회원이면 **"비회원"**으로 표시됩니다.
- **영업 종료 시 주문번호 초기화**: 매장 영업을 종료하면 주문 순번이 리셋됩니다. (자정이 아닌 영업 종료 시점 기준)

---

## 주문 상태 흐름 (Order Status Flow)

```
고객: 장바구니 담기 → 주문하기 → 주문번호 발급 (ORD-YYYYMMDD-NNN)
         │
         ▼
   ┌─────────────┐
   │  PREPARING  │ ← 주문 접수 즉시 제조 대기 (관리자 컨펌 불필요)
   └──────┬──────┘
          │
          ├── 관리자가 [반려] 버튼 클릭 시 ──▶ ┌─────────────┐
          │                                   │  REJECTED   │ ← 주문 반려 (재료 부족 등)
          │                                   └─────────────┘
          │ 제조 완료
          ▼
   ┌─────────────┐
   │  COMPLETED  │ ← 완료 (매출에 반영)
   └──────┬──────┘
          │ 고객 수령
          ▼
   ┌─────────────┐
   │  PICKED_UP  │ ← 수령 완료 (선택사항)
   └─────────────┘
```

> **COMPLETED** 상태가 된 주문만 **오늘 매출**에 집계됩니다.
> 관리자 "확인(CONFIRMED)" 단계가 없으므로, 주문이 들어오면 곧바로 제조 대기열에 표시됩니다.
> 관리자는 문제가 있는 주문에 대해서만 **반려(REJECTED)** 버튼을 눌러 처리합니다.

---

## 1. 데이터베이스 설계

### 1-1. `orders` (주문 테이블)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGSERIAL (PK) | 주문 ID |
| `order_date` | DATE | 주문 날짜 (예: `2026-03-09`) |
| `order_number` | INT | 해당 영업의 주문 순번 (영업 개시 시 1부터 시작, 영업 종료 시 초기화) |
| `user_id` | VARCHAR (FK, nullable) | 회원 주문 시 사용자 ID (비회원은 NULL) |
| `customer_name` | VARCHAR(50) | 회원이면 회원 이름, 비회원이면 "비회원" 자동 저장 |
| `status` | VARCHAR(20) | 주문 상태 (`PREPARING`, `COMPLETED`, `REJECTED`, `PICKED_UP`) |
| `total_price` | INT | 총 주문 금액 (옵션 포함) |
| `reject_reason` | VARCHAR(255) | 반려 사유 (반려 시에만) |
| `memo` | TEXT | 요청 사항 (예: "시럽 적게 넣어주세요") |
| `created_at` | TIMESTAMP | 주문 접수 시각 (시:분:초 포함) |
| `updated_at` | TIMESTAMP | 상태 변경 시각 |

> **주문번호 = `order_date` + `order_number` 조합**
> 예: 2026-03-09일자 3번째 주문 → `order_date: 2026-03-09`, `order_number: 3`
> 고객에게 표시: **#3** (당일 순번만 보여주면 직관적)
> 영수증/관리자 화면: **2026-03-09 #3** (날짜 + 순번)

> **UNIQUE 제약**: `(order_date, order_number)` 복합 유니크 — 같은 날에 같은 번호가 중복되지 않도록

---

### 1-2. `order_items` (주문 항목 테이블)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGSERIAL (PK) | 주문 항목 ID |
| `order_id` | BIGINT (FK) | 소속 주문 ID |
| `menu_id` | BIGINT (FK) | 메뉴 ID |
| `menu_name` | VARCHAR(100) | 주문 당시의 메뉴 이름 (스냅샷) |
| `quantity` | INT | 수량 |
| `unit_price` | INT | 메뉴 기본 가격 (스냅샷) |
| `option_price` | INT | 옵션 추가 금액 합계 |
| `subtotal` | INT | 소계 = (기본가격 + 옵션추가금액) × 수량 |

> **스냅샷을 저장하는 이유**: 주문 이후 메뉴 이름이나 가격이 바뀌어도 원래 주문 내역은 그대로 유지되어야 합니다.

---

### 1-3. `order_option_selections` (주문 시 선택한 옵션)

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGSERIAL (PK) | ID |
| `order_item_id` | BIGINT (FK) | 주문 항목 ID |
| `option_group_name` | VARCHAR(100) | 옵션 그룹명 (스냅샷: "온도 선택") |
| `option_item_name` | VARCHAR(100) | 선택한 항목명 (스냅샷: "ICE") |
| `price_delta` | INT | 추가 금액 (스냅샷) |

---

### 1-4. `daily_menu_sales` (메뉴별 일일 판매 집계 테이블) ⭐ 신규

> 주문 완료(COMPLETED) 시 자동으로 이 테이블에 **메뉴별 판매량/매출을 집계**합니다.
> 대시보드의 일간/주간/월간 통계 및 상품별 판매량 조회의 핵심 데이터 소스입니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | BIGSERIAL (PK) | ID |
| `sale_date` | DATE | 판매 일자 |
| `menu_id` | BIGINT (FK) | 메뉴 ID |
| `menu_name` | VARCHAR(100) | 메뉴 이름 (스냅샷, 당시 이름 보존) |
| `category_name` | VARCHAR(100) | 카테고리명 (스냅샷) |
| `quantity_sold` | INT | 해당 날짜에 판매된 수량 |
| `total_sales` | INT | 해당 날짜의 해당 메뉴 매출 합계 |
| `created_at` | TIMESTAMP | 레코드 생성일시 |
| `updated_at` | TIMESTAMP | 레코드 수정일시 |

> **UNIQUE 제약**: `(sale_date, menu_id)` — 하루에 메뉴 하나당 레코드 1개
> **집계 방식**: 주문이 COMPLETED 될 때 `UPSERT` (있으면 quantity_sold/total_sales 누적, 없으면 INSERT)

---

### 1-5. `store_settings` (매장 설정 테이블) ⭐ 신규

> 매장 영업 상태를 관리합니다. 레코드는 **1개만** 존재하며 관리자가 토글합니다.

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | INT (PK) | 항상 1 (싱글턴 레코드) |
| `is_open` | BOOLEAN | 현재 영업 중 여부 (`true` = 영업중, `false` = 영업종료) |
| `opened_at` | TIMESTAMP | 금일 영업 개시 시각 |
| `closed_at` | TIMESTAMP | 마지막 영업 종료 시각 |
| `updated_at` | TIMESTAMP | 설정 변경 시각 |

> **영업 개시 시**: `is_open = true`, `opened_at = NOW()` 저장
> **영업 종료 시**: `is_open = false`, `closed_at = NOW()` 저장, **주문번호 순번 초기화** (다음 영업 시 #1부터 시작)

---

### ERD (관계도)

```
users ──< orders ──< order_items ──< order_option_selections
             │              │
             │              └── menus (참조, 스냅샷 저장)
             │
             └── daily_menu_sales (COMPLETED 시 집계)
                      │
                      └── menus (참조)
```

### SQL 스크립트

```sql
-- 주문 테이블
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    order_number INT NOT NULL,
    user_id VARCHAR REFERENCES users(id),
    customer_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PREPARING',
    total_price INT NOT NULL DEFAULT 0,
    reject_reason VARCHAR(255),
    memo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (order_date, order_number)
);

-- 주문 항목 테이블
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_id BIGINT NOT NULL REFERENCES menus(id),
    menu_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price INT NOT NULL,
    option_price INT NOT NULL DEFAULT 0,
    subtotal INT NOT NULL
);

-- 주문 시 선택된 옵션 저장
CREATE TABLE order_option_selections (
    id BIGSERIAL PRIMARY KEY,
    order_item_id BIGINT NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    option_group_name VARCHAR(100) NOT NULL,
    option_item_name VARCHAR(100) NOT NULL,
    price_delta INT NOT NULL DEFAULT 0
);

-- 메뉴별 일일 판매 집계
CREATE TABLE daily_menu_sales (
    id BIGSERIAL PRIMARY KEY,
    sale_date DATE NOT NULL,
    menu_id BIGINT NOT NULL REFERENCES menus(id),
    menu_name VARCHAR(100) NOT NULL,
    category_name VARCHAR(100),
    quantity_sold INT NOT NULL DEFAULT 0,
    total_sales INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (sale_date, menu_id)
);

-- 매장 설정 (싱글턴)
CREATE TABLE store_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    is_open BOOLEAN NOT NULL DEFAULT FALSE,
    opened_at TIMESTAMP,
    closed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 데이터 삽입
INSERT INTO store_settings (id, is_open) VALUES (1, FALSE);

-- 인덱스
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_daily_menu_sales_date ON daily_menu_sales(sale_date);
CREATE INDEX idx_daily_menu_sales_menu ON daily_menu_sales(menu_id);
```

---

## 2. 백엔드 API 설계

### 2-1. 고객용 API (Public)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/store/status` | 매장 영업 상태 조회 (영업중/종료) |
| `POST` | `/orders` | 주문 생성 (매장 영업 중일 때만 가능) |
| `GET` | `/orders/{date}/{number}` | 주문 상태 조회 (날짜+순번으로) |
| `GET` | `/orders/my` | 내 주문 내역 조회 (로그인 시) |

> **`POST /orders`는 매장이 영업 중(`is_open = true`)일 때만 동작**합니다.
> 영업 종료 상태에서 주문 시도 시 `403 Forbidden` + `"매장 영업시간이 아닙니다"` 응답.

#### `POST /orders` 요청 Body 예시

```json
{
  "customerName": "홍길동",
  "memo": "시럽 적게 넣어주세요",
  "items": [
    {
      "menuId": 1,
      "quantity": 2,
      "selectedOptions": [
        { "optionGroupId": 1, "optionItemId": 2 },
        { "optionGroupId": 2, "optionItemId": 5 }
      ]
    },
    {
      "menuId": 3,
      "quantity": 1,
      "selectedOptions": [
        { "optionGroupId": 6, "optionItemId": 11 }
      ]
    }
  ]
}
```

#### 응답 예시

```json
{
  "orderDate": "2026-03-09",
  "orderNumber": 3,
  "displayNumber": "#3",
  "status": "PREPARING",
  "customerName": "홍길동",
  "totalPrice": 12500,
  "createdAt": "2026-03-09T10:32:15",
  "items": [
    {
      "menuName": "아메리카노",
      "quantity": 2,
      "unitPrice": 4500,
      "optionPrice": 500,
      "subtotal": 10000,
      "options": [
        { "groupName": "온도 선택", "itemName": "ICE", "priceDelta": 0 },
        { "groupName": "사이즈", "itemName": "Large", "priceDelta": 500 }
      ]
    }
  ]
}
```

---

### 2-2. 관리자용 API (Admin)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/admin/store/status` | 매장 영업 상태 조회 |
| `PUT` | `/admin/store/open` | 매장 영업 개시 (주문 접수 시작) |
| `PUT` | `/admin/store/close` | 매장 영업 종료 (주문 차단 + 주문번호 초기화) |
| `GET` | `/admin/orders` | 전체 주문 목록 (필터: 상태, 날짜) |
| `GET` | `/admin/orders/{id}` | 주문 상세 조회 |
| `PUT` | `/admin/orders/{id}/status` | 주문 상태 변경 (PREPARING→COMPLETED, COMPLETED→PICKED_UP) |
| `PUT` | `/admin/orders/{id}/reject` | 주문 반려 (사유 포함) |

> **참고**: 별도의 "주문 확인(CONFIRM)" API는 없습니다. 주문은 생성과 동시에 PREPARING 상태이므로,
> 관리자는 **제조완료** 또는 **반려**만 처리합니다.

#### 매장 영업 개시 API

```
PUT /admin/store/open
응답: { "isOpen": true, "openedAt": "2026-03-09T09:00:00" }
```
> 이 시점부터 고객 주문(`POST /orders`)이 허용됩니다.

#### 매장 영업 종료 API

```
PUT /admin/store/close
응답: { "isOpen": false, "closedAt": "2026-03-09T22:00:00" }
```
> 이 시점부터 고객 주문이 차단되며, **주문번호 순번이 초기화**됩니다.

#### 주문 목록 응답 예시 (회원/비회원 구분)

```json
[
  {
    "id": 1,
    "orderDate": "2026-03-09",
    "orderNumber": 1,
    "displayNumber": "#1",
    "customerName": "홍길동",
    "isGuest": false,
    "status": "PREPARING",
    "totalPrice": 12500,
    "createdAt": "2026-03-09T10:32:15"
  },
  {
    "id": 2,
    "orderDate": "2026-03-09",
    "orderNumber": 2,
    "displayNumber": "#2",
    "customerName": "비회원",
    "isGuest": true,
    "status": "PREPARING",
    "totalPrice": 5500,
    "createdAt": "2026-03-09T10:35:22"
  }
]
```

#### 상태 변경 API (제조완료)

```
PUT /admin/orders/{id}/status
Body: { "status": "COMPLETED" }
```

> **COMPLETED 처리 시 서버 사이드에서 `daily_menu_sales` 테이블에 자동 집계** (UPSERT)

#### 주문 반려 API

```
PUT /admin/orders/{id}/reject
Body: { "reason": "재료 소진" }
```

---

### 2-3. 대시보드 & 매출 분석 API (Admin)

| Method | Endpoint | 설명 |
|--------|----------|------|
| `GET` | `/admin/dashboard/stats?period=daily` | 대시보드 요약 통계 (period: `daily`, `weekly`, `monthly`) |
| `GET` | `/admin/dashboard/recent-orders` | 최근 주문 5건 |
| `GET` | `/admin/sales/summary?period=daily&date=2026-03-09` | 기간별 매출 요약 |
| `GET` | `/admin/sales/orders?date=2026-03-09` | 해당 기간 주문 완료 내역 |
| `GET` | `/admin/sales/menu-ranking?period=daily&date=2026-03-09` | 상품별 판매량 랭킹 |
| `GET` | `/admin/sales/chart?period=weekly&date=2026-03-09` | 매출 차트 데이터 |

#### `/admin/dashboard/stats?period=daily` 응답 예시

```json
{
  "period": "daily",
  "date": "2026-03-09",
  "totalMenus": 24,
  "orderCount": 48,
  "orderCountChange": "+12%",
  "totalSales": 285000,
  "totalSalesChange": "+8%",
  "customerCount": 32,
  "customerCountChange": "-5%",
  "preparingOrders": 3,
  "completedOrders": 42,
  "rejectedOrders": 3
}
```

#### `/admin/sales/menu-ranking?period=daily&date=2026-03-09` 응답 예시

```json
[
  { "rank": 1, "menuName": "아메리카노", "categoryName": "Coffee", "quantitySold": 35, "totalSales": 157500 },
  { "rank": 2, "menuName": "카페라떼", "categoryName": "Coffee", "quantitySold": 22, "totalSales": 121000 },
  { "rank": 3, "menuName": "초코 크로와상", "categoryName": "Bakery", "quantitySold": 15, "totalSales": 60000 }
]
```

---

## 3. 프론트엔드 구현 계획

### 3-1. 장바구니 (Cart) — Zustand Store

> 위치: `frontend/store/useCartStore.ts`

장바구니는 **서버에 저장하지 않고** 클라이언트 측(Zustand + localStorage)에서 관리합니다.
페이지를 새로고침해도 장바구니가 유지되어야 하기 때문입니다.

```typescript
// 장바구니 아이템 구조
interface CartItem {
  cartId: string;            // 고유 ID (같은 메뉴라도 옵션이 다르면 별도 행)
  menuId: number;
  menuName: string;
  menuEngName: string;
  imageSrc: string;
  basePrice: number;         // 메뉴 기본 가격
  quantity: number;
  selectedOptions: {
    optionGroupId: number;
    optionGroupName: string;
    optionItemId: number;
    optionItemName: string;
    priceDelta: number;
  }[];
  optionTotalPrice: number;  // 옵션 추가금액 합계
  subtotal: number;          // (basePrice + optionTotalPrice) * quantity
}

// Store 액션
interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}
```

---

### 3-2. 프론트엔드 페이지 구조

#### 고객용 페이지

| 경로 | 설명 | 주요 기능 |
|------|------|-----------|
| `/menus/[id]` (기존) | 메뉴 상세 | 장바구니 담기 버튼 (현재 alert → 실제 cart store 연동) |
| `/cart` (신규) | 장바구니 페이지 | 담은 메뉴 목록, 수량 변경, 삭제, 총 금액, 주문하기 |
| `/order/confirm` (신규) | 주문 확인 페이지 | 최종 주문 내역 확인, 요청사항 입력, 주문 접수 |
| `/order/[orderNumber]` (신규) | 주문 상태 확인 | 실시간 주문 상태 표시 (대기중 → 제조중 → 완료) |

#### 관리자 페이지

| 경로 | 설명 | 주요 기능 |
|------|------|-----------|
| `/admin/orders` (신규) | 주문 관리 | 주문 리스트, 상태별 필터, 주문 확인/반려/완료 처리 |
| `/admin` (수정) | 대시보드 | 하드코딩 → 실제 API 데이터 연동 |

---

### 3-3. UI 컴포넌트 상세

#### 🛒 장바구니 아이콘 (Header에 추가)

- 위치: **공개 페이지 Nav 헤더** 우측 (로그인/회원가입 옆)
- 기능: 장바구니 아이콘 + 아이템 개수 뱃지 (숫자 표시)
- 클릭 시: `/cart` 페이지로 이동

#### 📋 장바구니 페이지 (`/cart`)

```
┌─────────────────────────────────────────┐
│ 🛒 장바구니 (3개 상품)                    │
├─────────────────────────────────────────┤
│ ┌─────┐ 아메리카노              ₩5,000  │
│ │ IMG │ ICE / Large (+500원)            │
│ └─────┘ [- 2 +]                 ₩10,000 │
├─────────────────────────────────────────┤
│ ┌─────┐ 카페라떼                ₩5,500  │
│ │ IMG │ HOT / Regular                   │
│ └─────┘ [- 1 +]                 ₩5,500  │
├─────────────────────────────────────────┤
│                                         │
│                        총 금액: ₩15,500 │
│                   [🗑 비우기] [주문하기]   │
└─────────────────────────────────────────┘
```

#### 📊 관리자 주문 관리 페이지 (`/admin/orders`)

> 고객이 **회원**이면 회원 이름을, **비회원**이면 `비회원`으로 표시합니다.
> 관리자 "확인" 버튼은 없으며, **반려** 버튼만 존재합니다.

```
┌──────────────────────────────────────────────────────┐
│ 주문 관리                                             │
│ [전체] [제조중(3)] [완료(5)] [수령완료] [반려]            │
├──────────────────────────────────────────────────────┤
│ #ORD-001 | 홍길동(회원) | 아메리카노 외 2건 | ₩15,500  │
│ 10:32 AM | 🔥 제조중                                   │
│           [✅ 제조완료]  [❌ 반려]                      │
├──────────────────────────────────────────────────────┤
│ #ORD-002 | 비회원      | 카페라떼 | ₩5,500            │
│ 10:28 AM | 🔥 제조중                                   │
│           [✅ 제조완료]  [❌ 반려]                      │
├──────────────────────────────────────────────────────┤
│ #ORD-003 | 이영희(회원) | 초코 크로와상 | ₩4,000       │
│ 10:15 AM | ✅ 완료                                     │
│           [📦 수령완료]                                 │
├──────────────────────────────────────────────────────┤
│ #ORD-004 | 비회원      | 베이글 크림치즈 | ₩3,500      │
│ 09:50 AM | ❌ 반려 (사유: 재료 소진)                     │
└──────────────────────────────────────────────────────┘
```

**관리자 화면 동작 규칙:**
- 주문이 들어오면 **자동으로 "제조중"** 탭에 표시 (별도 확인 불필요)
- 제조중인 주문에만 **[제조완료]** 와 **[반려]** 버튼이 표시됨
- **반려** 클릭 시 사유 입력 모달이 뜸
- 완료된 주문에는 **[수령완료]** 버튼만 표시

#### 🏠 대시보드 리메이크 (`/admin`)

현재 하드코딩된 대시보드를 **일간/주간/월간 전환**이 가능한 실시간 대시보드로 리메이크합니다.

```
┌──────────────────────────────────────────────────────────┐
│ 대시보드                      [일간 ▼] [주간] [월간]       │
│                                        2026-03-09 (일)  │
├──────────────────────────────────────────────────────────┤
│  🟢 영업 중 (09:00 개시)                    [영업 종료 🔴] │
│  ── 또는 ──                                              │
│  🔴 영업 종료                               [영업 개시 🟢] │
├──────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ 총 메뉴   │ │ 주문 건수 │ │ 매출     │ │ 방문고객  │     │
│ │   24     │ │    48    │ │₩285,000 │ │    32    │     │
│ │ +2 이달   │ │+12% 어제↕│ │+8% 어제↕ │ │-5% 어제↕ │     │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
├──────────────────────────────────────────────────────────┤
│ 🔥 제조 중 주문 3건 알림 배너                              │
├──────────────────────────────────────────────────────────┤
│ 최근 주문 (5건)              [전체보기 →]                  │
│ #5 | 홍길동(회원) | 아메리카노 외 1건 | 10:32 | 제조중      │
│ #4 | 비회원      | 카페라떼          | 10:28 | 완료       │
│ ...                                                     │
├──────────────────────────────────────────────────────────┤
│ 인기 메뉴 TOP 5              [상세보기 →]                  │
│ 1. 아메리카노  35잔  ₩157,500                             │
│ 2. 카페라떼    22잔  ₩121,000                             │
│ ...                                                     │
├──────────────────────────────────────────────────────────┤
│ 빠른 작업                                                │
│ [메뉴등록] [메뉴관리] [주문관리] [매출상세]                   │
└──────────────────────────────────────────────────────────┘
```

**영업 토글 동작:**
- **[영업 개시 🟢]** 클릭 → `PUT /admin/store/open` 호출 → 주문 접수 시작
- **[영업 종료 🔴]** 클릭 → 확인 모달("영업을 종료하시겠습니까? 주문번호가 초기화됩니다.") → `PUT /admin/store/close` 호출
- 고객 메뉴 페이지에서도 영업 종료 시 "현재 주문이 불가합니다" 안내 표시

**일간↔주간↔월간 전환 시:**
- **일간**: 오늘 날짜 기준 통계, 어제 대비 변화율
- **주간**: 이번 주(월~일) 합산 통계, 지난주 대비 변화율
- **월간**: 이번 달 합산 통계, 지난달 대비 변화율

---

#### 📈 매출 상세 페이지 (`/admin/sales`) ⭐ 신규

대시보드에서 **[매출상세]** 또는 통계 카드를 클릭하면 이동하는 상세 분석 페이지입니다.

```
┌──────────────────────────────────────────────────────────┐
│ 매출 분석                     [일간 ▼] [주간] [월간]       │
│                      ◀ 2026-03-08   2026-03-09  ▶       │
├──────────────────────────────────────────────────────────┤
│                                                         │
│  [📊 매출 요약]  [📋 주문 완료 내역]  [🏆 상품별 판매량]     │
│                                                         │
├── 탭1: 매출 요약 ────────────────────────────────────────┤
│ 총 매출: ₩285,000                                       │
│ 총 주문: 48건 (완료 42건 / 반려 3건 / 제조중 3건)           │
│ 평균 주문 금액: ₩6,786                                   │
│ 회원 주문: 30건 / 비회원 주문: 18건                        │
│                                                         │
│ [매출 추이 차트 — 시간대별 or 일별 그래프]                   │
│                                                         │
├── 탭2: 주문 완료 내역 ───────────────────────────────────┤
│ #42 | 홍길동(회원) | 아메리카노 x2, 카페라떼 x1 | ₩15,500 │
│ #41 | 비회원      | 초코 크로와상 x3          | ₩12,000  │
│ ...                                                     │
│                                 [전체 42건] [CSV 내보내기] │
│                                                         │
├── 탭3: 상품별 판매량 ────────────────────────────────────┤
│  순위 | 메뉴             | 카테고리 | 판매 수량 | 매출      │
│   1  | 아메리카노        | Coffee  |   35잔  | ₩157,500 │
│   2  | 카페라떼          | Coffee  |   22잔  | ₩121,000 │
│   3  | 초코 크로와상      | Bakery  |   15잔  | ₩60,000  │
│   4  | 딸기 케이크       | Dessert |    8개  | ₩40,000  │
│  ... | ...              | ...     |   ...   | ...      │
│                                                         │
│  카테고리별 매출 비율 [파이차트]                             │
└──────────────────────────────────────────────────────────┘
```

추가 위젯 (대시보드):
- **최근 주문 목록** (5건) — 실시간 업데이트
- **제조 중 주문 알림 배너** — PREPARING 주문이 1건 이상일 때 상단에 표시
- **인기 메뉴 TOP 5** — `daily_menu_sales`에서 조회

---

## 4. 백엔드 구조 (Hexagonal Architecture)

기존 프로젝트의 아키텍처(menu, menuoption 모듈)와 동일한 구조로 구성합니다.

```
backend/src/main/java/com/new_cafe/app/backend/order/
├── adapter/
│   ├── in/
│   │   └── web/
│   │       ├── OrderController.java          (고객용)
│   │       └── AdminOrderController.java     (관리자용)
│   └── out/
│       └── persistence/
│           ├── OrderJpaEntity.java
│           ├── OrderItemJpaEntity.java
│           ├── OrderOptionSelectionJpaEntity.java
│           ├── OrderJpaRepository.java
│           ├── OrderItemJpaRepository.java
│           └── OrderPersistenceAdapter.java
├── application/
│   ├── port/
│   │   ├── in/
│   │   │   ├── CreateOrderUseCase.java
│   │   │   ├── ManageOrderStatusUseCase.java
│   │   │   └── GetOrderUseCase.java
│   │   └── out/
│   │       └── OrderRepositoryPort.java
│   └── service/
│       ├── CreateOrderService.java
│       ├── ManageOrderStatusService.java
│       └── GetOrderService.java
└── domain/
    └── model/
        ├── Order.java
        ├── OrderItem.java
        └── OrderStatus.java (enum)
```

---

## 5. 구현 Phase별 체크리스트

### 🔵 Phase 1: 데이터베이스 & 백엔드 기반 구축

- [ ] **1-1.** `orders`, `order_items`, `order_option_selections` JPA Entity 생성
- [ ] **1-2.** `daily_menu_sales` JPA Entity 생성
- [ ] **1-3.** `store_settings` JPA Entity 생성 (싱글턴 레코드, 영업 상태 관리)
- [ ] **1-4.** JPA Repository 인터페이스 생성
- [ ] **1-5.** `OrderStatus` enum 생성
- [ ] **1-6.** Domain Model 생성 (`Order`, `OrderItem`, `StoreSettings`)
- [ ] **1-7.** 빌드 확인 (`./gradlew build -x test`)

---

### 🟢 Phase 2: 백엔드 주문 API 구현

- [ ] **2-1.** `GET /store/status` — 매장 영업 상태 조회 API
- [ ] **2-2.** `PUT /admin/store/open` — 매장 영업 개시 API
    - `is_open = true`, `opened_at = NOW()`
- [ ] **2-3.** `PUT /admin/store/close` — 매장 영업 종료 API
    - `is_open = false`, `closed_at = NOW()`
    - **주문번호 순번 초기화** (다음 영업 시 #1부터 시작)
- [ ] **2-4.** `POST /orders` — 주문 생성 API
    - **매장 영업 중(`is_open = true`)일 때만 허용** (아니면 403 반환)
    - `order_date = 오늘 날짜`, `order_number = 오늘의 MAX+1`
    - 고객에게 `orderDate + orderNumber` 즉시 반환 (예: `#3`)
    - 메뉴명, 가격 등 스냅샷 저장 / 총 금액 자동 계산
    - **생성 즉시 `status = PREPARING`** (관리자 확인 단계 없음)
    - 회원이면 `customer_name = 회원이름`, 비회원이면 `customer_name = "비회원"`
- [ ] **2-5.** `GET /orders/{date}/{number}` — 주문 조회 API
- [ ] **2-6.** `GET /orders/my` — 내 주문 내역 API (세션 기반, 회원만)
- [ ] **2-7.** `GET /admin/orders` — 관리자 주문 목록 API (필터: status, date)
    - 응답에 `isGuest` 필드 포함 (`user_id == null`이면 true)
- [ ] **2-8.** `GET /admin/orders/{id}` — 관리자 주문 상세 API
- [ ] **2-9.** `PUT /admin/orders/{id}/status` — 상태 변경 API
    - **COMPLETED 처리 시 `daily_menu_sales` 자동 집계** (UPSERT)
- [ ] **2-10.** `PUT /admin/orders/{id}/reject` — 주문 반려 API (사유 필수)
- [ ] **2-11.** 빌드 및 API 테스트

---

### 🟡 Phase 3: 프론트엔드 — 장바구니

- [ ] **3-1.** Zustand Cart Store 생성 (`useCartStore.ts`)
    - localStorage persist 미들웨어 적용
    - addItem, removeItem, updateQuantity, clearCart 구현
- [ ] **3-2.** 메뉴 상세 페이지 `/menus/[id]` — "장바구니 담기" 버튼 연동
    - 선택한 옵션 정보와 함께 cart store에 추가
    - 담기 성공 시 토스트 메시지 또는 카트 아이콘 애니메이션
    - **매장 영업 종료 시 "현재 주문이 불가합니다" 안내 표시 + 장바구니/주문 버튼 비활성화**
- [ ] **3-3.** Nav 헤더에 장바구니 아이콘 + 수량 뱃지 추가
- [ ] **3-4.** 장바구니 페이지 (`/cart`) 구현
    - 아이템 리스트 (이미지, 이름, 선택 옵션, 수량, 가격)
    - 수량 변경 (+/-), 개별 삭제
    - 전체 비우기
    - 총 금액 표시
    - "주문하기" 버튼

---

### 🟠 Phase 4: 프론트엔드 — 주문 프로세스

- [ ] **4-1.** 주문 확인 페이지 (`/order/confirm`)
    - 장바구니 내용 최종 확인
    - 고객명 입력 (비회원) 또는 자동 채우기 (회원)
    - 요청사항(memo) 입력
    - "주문 접수" 버튼 → `POST /orders` API 호출
    - 성공 시 장바구니 비우기 + 주문 상태 페이지로 이동
- [ ] **4-2.** 주문 상태 페이지 (`/order/[orderNumber]`)
    - 주문 번호, 주문내역, 현재 상태 표시
    - 상태별 아이콘/색상 시각 표시
    - 자동 새로고침 (polling, 30초 간격) 또는 수동 새로고침 버튼

---

### 🔴 Phase 5: 프론트엔드 — 관리자 주문 관리

- [ ] **5-1.** 관리자 사이드바 "주문 관리" 링크 활성화 (이미 `/admin/orders` 링크가 존재)
- [ ] **5-2.** 주문 관리 페이지 (`/admin/orders`) 구현
    - 상태별 탭 필터 (전체/제조중/완료/수령완료/반려) — ~~대기중/확인 탭 없음~~
    - 주문 카드 리스트 표시 내용:
      - **주문번호** (`#3`) — 당일 순번 숫자만 표시
      - **주문일시** — `10:32 AM` 시간 표시
      - **고객명**: 회원이면 `홍길동(회원)`, 비회원이면 `비회원`
      - 메뉴 요약, 금액, 상태
    - 각 주문에 상태 변경 액션 버튼 (관리자 컨펌 버튼 없음)
      - 제조중 → **[제조완료]** **[반려]**
      - 완료 → **[수령완료]**
      - 반려/수령완료 → 버튼 없음 (최종 상태)
    - **반려 시 사유 입력 모달** (사유 필수)
- [ ] **5-3.** 주문 상세 모달 (또는 페이지)
    - 주문한 메뉴 상세 (옵션 포함)
    - 요청사항 표시
    - 회원/비회원 여부 표시
- [ ] **5-4.** 자동 새로고침 (polling, 10~15초 간격) — 새 주문 알림

---

### ⚪ Phase 6: 대시보드 & 매출 분석 리메이크

#### 6-A. 백엔드 API
- [ ] **6-1.** `GET /admin/dashboard/stats?period=daily|weekly|monthly` — 기간별 통계 API
    - 주문 수, 매출 합계, 고객 수 (COMPLETED 기준)
    - 이전 기간 대비 변화율 자동 계산
    - 현재 제조 중 주문 수
- [ ] **6-2.** `GET /admin/dashboard/recent-orders` — 최근 5건 주문
- [ ] **6-3.** `GET /admin/sales/summary?period=daily&date=YYYY-MM-DD` — 매출 요약
    - 총 매출, 총 주문, 평균 주문금액, 회원/비회원 비율
- [ ] **6-4.** `GET /admin/sales/orders?date=YYYY-MM-DD` — 완료 주문 내역 리스트
- [ ] **6-5.** `GET /admin/sales/menu-ranking?period=daily&date=YYYY-MM-DD` — 상품별 판매량 랭킹
    - `daily_menu_sales` 테이블에서 조회
    - 정렬: 판매량 순 (내림차순)
- [ ] **6-6.** `GET /admin/sales/chart?period=weekly&date=YYYY-MM-DD` — 매출 차트 데이터
    - 기간별 시계열 데이터 (일간=시간대별, 주간=일별, 월간=일별)

#### 6-B. 프론트엔드 — 대시보드 페이지 리메이크 (`/admin`)
- [ ] **6-7.** 일간/주간/월간 기간 전환 탭 구현
- [ ] **6-8.** 통계 카드 4개 API 연동 (하드코딩 제거)
    - 로딩 스켈레톤 추가
- [ ] **6-9.** **영업 상태 토글 UI (대시보드 상단)**
    - 영업 중: 🟢 표시 + [영업 종료] 버튼
    - 영업 종료: 🔴 표시 + [영업 개시] 버튼
    - 영업 종료 클릭 시 확인 모달 ("영업을 종료하시겠습니까? 주문번호가 초기화됩니다.")
- [ ] **6-10.** 제조 중 주문 알림 배너
- [ ] **6-11.** 최근 주문 위젯 (5건)
    - 주문번호 `#N` 형식 + 시간 표시
    - "전체 보기" 링크 → `/admin/orders` 이동
- [ ] **6-12.** 인기 메뉴 TOP 5 위젯
    - `daily_menu_sales` 기반
    - "상세보기" 링크 → `/admin/sales` 이동

#### 6-C. 프론트엔드 — 매출 상세 페이지 (`/admin/sales`) ⭐ 신규
- [ ] **6-13.** 매출 상세 페이지 레이아웃
    - 일간/주간/월간 기간 전환 + 날짜 이동 (`◀ ▶`)
- [ ] **6-14.** **탭 1: 매출 요약**
    - 총 매출, 총 주문, 평균 주문금액, 회원/비회원 비율
    - 매출 추이 차트 (Recharts 사용)
- [ ] **6-15.** **탭 2: 주문 완료 내역**
    - 해당 기간 COMPLETED 주문 리스트 (주문번호, 고객명, 메뉴, 금액)
    - 페이지네이션
- [ ] **6-16.** **탭 3: 상품별 판매량**
    - 메뉴별 판매 수량 + 매출 테이블 (랭킹 정렬)
    - 카테고리별 매출 비율 파이 차트
- [ ] **6-17.** 관리자 사이드바에 **"매출 분석"** 메뉴 추가

---

### 🟣 Phase 7: 마무리 및 추가 기능 (선택)

- [ ] **7-1.** 주문 접수 알림음 (관리자 페이지에서 새 주문 시 소리)
- [ ] **7-2.** 주문 내역 프린트 기능 (영수증 레이아웃 — 주문번호 `#N` 표시)
- [ ] **7-3.** WebSocket을 이용한 실시간 주문 알림 (polling → WebSocket 업그레이드)
- [ ] **7-4.** PG 결제 연동 준비 (토스페이먼츠, 카카오페이 등)
- [ ] **7-5.** CSV/Excel 매출 내보내기 기능

---

## 6. 기술 스택 및 의존성

### 백엔드 (추가 필요한 것)
- 기존 Spring Boot + JPA 그대로 활용
- 추가 의존성 없음 (기본 제공 기능으로 충분)

### 프론트엔드 (추가 필요한 것)

| 패키지 | 용도 | 비고 |
|--------|------|------|
| `zustand` | 장바구니 전역 상태 관리 | 이미 설치됨 (useAuthStore에서 사용 중) |
| `zustand/middleware` | localStorage persist | zustand 내장 |
| `recharts` | 매출 차트 (막대/선/파이) | Phase 6 매출 상세 페이지에서 필수 사용 |
| (선택) `react-hot-toast` | 토스트 알림 UI | "장바구니에 담았습니다" 등 |

---

## 7. 추가 고려사항

### 동시성 이슈
- 관리자 2명이 동시에 같은 주문을 처리하면? → **낙관적 락(Optimistic Lock)** 적용 고려
- `@Version` 컬럼 추가 또는 상태 변경 시 현재 상태 검증

### 재고 관리
- 주문 확인 시 해당 메뉴가 품절되면? → 자동으로 `isSoldOut = true` 전환 로직 (추후)

### 비회원 주문
- `user_id`가 nullable이므로 비회원도 주문 가능
- 비회원은 주문번호로만 조회 가능
- 비회원 주문 시 `customer_name`은 자동으로 `"비회원"` 설정
- 관리자 화면에서는 `user_id`가 NULL인 경우 `isGuest: true`로 응답하여 "비회원" 뱃지 표시
- 회원 주문 시에는 세션에서 사용자 이름을 자동으로 `customer_name`에 저장

### 주문번호 생성 규칙
- **`order_date`** (DATE): 주문 날짜 — `2026-03-09`
- **`order_number`** (INT): 해당 날짜의 순번 — `1`, `2`, `3`, ...
- **영업 종료 시 순번 초기화** (자정이 아닌 **관리자가 영업 종료 버튼을 누른 시점** 기준)
- 다음 영업 개시 후 첫 주문이 다시 `#1`부터 시작
- 생성 로직: `SELECT COALESCE(MAX(order_number), 0) + 1 FROM orders WHERE order_date = CURRENT_DATE`
- 고객 표시: `#3` (당일 순번만)
- 관리자/영수증 표시: `2026-03-09 #3` (날짜 + 순번)
- **복합 UNIQUE 제약** `(order_date, order_number)` 으로 동시 주문 시 중복 방지

### 매장 영업시간 관리
- `store_settings` 테이블(싱글턴)로 영업 상태 관리
- **영업 개시**: 관리자가 대시보드에서 [영업 개시] 클릭 → `is_open = true` → 주문 접수 시작
- **영업 종료**: 관리자가 대시보드에서 [영업 종료] 클릭 → `is_open = false` → 주문 차단 + 주문번호 초기화
- 고객 화면: 영업 종료 시 장바구니/주문 버튼 비활성화 + "현재 주문이 불가합니다" 안내
- 주문 API에서 `is_open` 검증: 영업 종료 상태에서 `POST /orders` 호출 시 403 반환

### 결제 연동 준비
- `orders` 테이블에 추후 추가될 컬럼 예상:
  - `payment_method` (CASH, CARD, KAKAO, TOSS 등)
  - `payment_status` (UNPAID, PAID, REFUNDED)
  - `payment_key` (PG사 결제 키)
  - `paid_at` (결제 완료 시각)

---

## 📋 구현 순서 요약

```
Phase 1 (DB Entity + daily_menu_sales)
    ↓
Phase 2 (주문 API + 판매 집계 로직)  ← 여기까지 하면 백엔드 완성
    ↓
Phase 3 (장바구니)                   ← 여기까지 하면 고객이 장바구니 사용 가능
    ↓
Phase 4 (주문 프로세스)               ← 여기까지 하면 고객이 주문 가능
    ↓
Phase 5 (관리자 주문관리)             ← 여기까지 하면 관리자가 주문 처리 가능
    ↓
Phase 6 (대시보드 + 매출 상세)        ← 여기까지 하면 매출 분석 가능
      ├─ 6-A. 백엔드 매출 분석 API
      ├─ 6-B. 대시보드 리메이크 (일간/주간/월간)
      └─ 6-C. 매출 상세 페이지 (/admin/sales)
    ↓
Phase 7 (추가 기능)                  ← 알림, 결제, CSV 내보내기 등
```

> **권장**: Phase 1~2(백엔드)를 먼저 완성한 뒤, Phase 3~4(고객 UI)와 Phase 5(관리자 UI)를 병행 진행합니다.
> Phase 6(대시보드 + 매출)는 주문 데이터가 쌓인 후 진행하면 테스트하기 용이합니다.
> 매출 분석의 핵심은 `daily_menu_sales` 테이블이며, COMPLETED 처리 시 자동 집계되므로 별도 배치가 필요 없습니다.
