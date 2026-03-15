# 🤖 NCAFE AI 에이전트 고도화 청사진

> **작성일**: 2026-03-15  
> **현재 에이전트 스택**: FastAPI + Gemini API (Function Calling) + pgvector (RAG) + SSE 스트리밍  
> **현재 기능**: 페이지 이동(`navigate_to_page`), 메뉴 상세 이동(`navigate_to_menu_detail`), 장바구니 담기(`add_to_cart`), RAG 기반 지식 검색

---

## 📋 Phase 개요

| Phase | 기능 | 난이도 | 영역 | 신규 Tool |
|-------|------|--------|------|-----------|
| 1 | 추천 메뉴 바로보기 버튼 | ⭐⭐ | FE + Agent | ✅ `show_menu_cards` |
| 2 | 내 개인정보 조회 (포인트·등급) | ⭐⭐⭐ | Agent + FE | ✅ `get_my_info` |
| 3 | 주문 대기 예상 시간 안내 | ⭐⭐⭐ | Agent + FE | ✅ `get_queue_status` |
| 4 | 음료 페어링 추천 (RAG 확장) | ⭐⭐⭐⭐ | Agent + RAG + FE | ✅ `recommend_pairing` |
| 5 | 옵션 커스텀 상담 & 필터링 검색 | ⭐⭐⭐⭐ | Agent + FE | ✅ `search_menus_by_filter` |
| 6-1 | 리오더(재주문) | ⭐⭐ | Agent + FE | ✅ `reorder_last` |
| 6-2 | 인기 메뉴 실시간 랭킹 | ⭐⭐ | Agent | ✅ `get_popular_menus` |
| 6-3 | 주문 상태 실시간 조회 | ⭐⭐ | Agent + FE | ✅ `check_order_status` |
| 6-4 | 가격 계산기 | ⭐⭐ | Agent | ✅ `calculate_price` |

---

## 🔧 공통 인프라 변경

### Agent Server (FastAPI)

```
agent-server/
├── app/
│   ├── services/
│   │   ├── tools.py          ← Tool 정의 확장 (Phase 1~5 전부)
│   │   ├── gemini.py         ← 기존 유지 (Function Calling 루프)
│   │   ├── vector.py         ← RAG 확장 (Phase 4 페어링 문서)
│   │   └── database.py       ← DB 쿼리 유틸 (Phase 2,3,5에서 직접 쿼리)
│   └── routers/
│       └── chat.py           ← system_instruction 확장
```

### System Instruction 업그레이드

현재 `system_instruction`에 새 도구 사용 규칙을 추가해야 함:

```python
# chat.py 의 system_instruction에 아래 내용 추가
"""
- '내 포인트', '내 등급', '내 정보' 등 개인정보 요청 → get_my_info 사용
- '대기 시간', '얼마나 걸려', '내 순번' 등 → get_queue_status 사용
- '이거랑 어울리는', '같이 먹을', '페어링' 등 → recommend_pairing 사용
- '두유로 바꿀 수 있는', '샷추가 가능한', '카페인 없는' 등 필터링 → search_menus_by_filter 사용
"""
```

---

## Phase 1: 추천 메뉴 바로보기 버튼

> 에이전트가 메뉴를 추천할 때 단순 텍스트가 아닌, **클릭하면 해당 메뉴 상세로 이동하는 버튼**이 함께 표시됨

### 현재 문제
- 에이전트가 "아메리카노를 추천합니다"라고 텍스트만 보여줌
- 사용자가 직접 메뉴 페이지로 가서 찾아야 하는 번거로움

### 구현 방식

에이전트 응답에 **구조화된 메뉴 카드 데이터**를 포함시키는 방식 (기존 RAG + Function Calling 활용)

#### Agent Server 변경

- [ ] **새로운 Tool 정의** — `show_menu_cards`
  ```python
  # tools.py
  FunctionDeclaration(
      name="show_menu_cards",
      description="추천 메뉴를 카드 형태로 보여줍니다. 메뉴 추천, 인기 메뉴 등을 시각적으로 표시할 때 사용합니다.",
      parameters=Schema(
          type=Type.OBJECT,
          properties={
              "slugs": Schema(
                  type=Type.ARRAY,
                  items=Schema(type=Type.STRING),
                  description="추천할 메뉴들의 영문 슬러그 배열 (예: ['americano', 'cafe-latte'])",
              ),
          },
          required=["slugs"],
      ),
  )
  ```
- [ ] **execute_function 확장** — `show_menu_cards` 실행 시 `action = {"action": "show_menu_cards", "slugs": [...]}`을 반환
- [ ] **DB에서 메뉴 정보 직접 조회** (선택) — 이름·가격·이미지 URL을 리턴

#### Frontend 변경

- [ ] **ChatWidget.tsx** — `show_menu_cards` 액션 수신 시 메뉴 카드 UI 렌더링
  - 메뉴 이미지 + 이름 + 가격 표시
  - "바로보기" 버튼 → `/menus/{slug}` 이동
  - "담기" 버튼 → `add_to_cart` 로직 재사용
- [ ] **useChatStore.ts** — 새로운 `pendingAction` 타입 추가: `show_menu_cards`
- [ ] **ChatWidget.module.css** — 메뉴 카드 리스트 스타일링 (가로 스크롤 또는 2열)

### 테스트 TODO

- [ ] "추천 메뉴 보여줘" → 카드 형태로 2~3개 메뉴 노출
- [ ] 카드 내 "바로보기" 클릭 → 메뉴 상세 페이지 이동
- [ ] 카드 내 "담기" 클릭 → 장바구니에 추가

---

## Phase 2: 내 개인정보 조회 (포인트·등급)

> 로그인 사용자가 "내 포인트 얼마야?", "내 등급 뭐야?" 라고 물으면  
> 에이전트가 **실시간 DB 데이터를 조회**하여 정확하게 답변

### 현재 문제
- 에이전트는 현재 사용자 인증 정보에 접근 불가
- 개인 정보 관련 질문에 "마이페이지에서 확인해주세요"로만 응답

### 구현 방식

프론트엔드에서 세션 정보(userId)를 채팅 요청에 포함시키고, 에이전트가 DB를 직접 조회

#### Frontend 변경

- [ ] **useChatStore.ts / ChatWidget.tsx** — 채팅 요청 시 `userId`를 함께 전송
  ```typescript
  // sendMessage() 내부
  body: JSON.stringify({
      message: content,
      sessionId,
      stream: true,
      userId: session?.user?.id || null,  // 세션에서 userId 추출
  })
  ```
- [ ] **ChatRequest 모델 수정** — `userId` 필드 추가

#### Agent Server 변경

- [ ] **schemas.py** — `ChatRequest`에 `userId: Optional[str]` 필드 추가
- [ ] **새로운 Tool 정의** — `get_my_info`
  ```python
  FunctionDeclaration(
      name="get_my_info",
      description="로그인한 사용자의 개인정보를 조회합니다. 포인트 잔액, 등급, 닉네임, 주문 횟수 등을 확인할 때 사용합니다.",
      parameters=Schema(
          type=Type.OBJECT,
          properties={
              "info_type": Schema(
                  type=Type.STRING,
                  enum=["all", "points", "grade", "orders"],
                  description="조회할 정보 유형 (all: 전체, points: 포인트, grade: 등급, orders: 주문 통계)",
              ),
          },
          required=["info_type"],
      ),
  )
  ```
- [ ] **execute_function 확장** — DB에서 사용자 정보 직접 조회
  ```python
  def execute_get_my_info(user_id, info_type):
      """
      users 테이블에서 직접 조회:
      - point_balance, grade, total_order_count, total_order_amount, nickname
      grade_settings 테이블에서 등급 이름·혜택 조회
      """
  ```
- [ ] **chat.py** — `userId`를 `execute_function`에 전달하는 로직 추가
- [ ] **system_instruction에 규칙 추가** — 비로그인 사용자가 개인정보 요청 시 "로그인이 필요합니다" 안내

### 응답 예시

```
사용자: "내 포인트 얼마야?"
에이전트: "현재 보유 포인트는 1,200P 입니다! 😊
          등급: 골드빈 (적립률 5%)
          총 주문 횟수: 23회
          마이페이지에서 자세한 내역을 확인하실 수 있어요."
          [마이페이지 바로가기] 버튼
```

### 테스트 TODO

- [ ] 로그인 상태 — "내 포인트" → 실제 잔액 응답
- [ ] 로그인 상태 — "내 등급" → 등급명 + 혜택 안내
- [ ] 비로그인 상태 — "내 포인트" → 로그인 필요 안내 + 로그인 페이지 이동 버튼
- [ ] 포인트 0인 사용자 → "아직 적립된 포인트가 없어요" 등 자연스러운 응답

---

## Phase 3: 주문 대기 예상 시간 안내

> "지금 기다리는 사람 몇 명이야?", "내 순번 언제쯤이야?" 질문에  
> **현재 준비 중(PREPARING) 주문 수**를 기반으로 예상 대기 시간을 계산하여 답변

### 구현 방식

#### Agent Server 변경

- [ ] **새로운 Tool 정의** — `get_queue_status`
  ```python
  FunctionDeclaration(
      name="get_queue_status",
      description="현재 주문 대기 상황을 조회합니다. 대기 주문 수, 예상 대기 시간을 확인할 때 사용합니다.",
      parameters=Schema(
          type=Type.OBJECT,
          properties={},  # 파라미터 없음
      ),
  )
  ```
- [ ] **execute_function** — DB에서 현재 PREPARING 상태 주문 수 조회
  ```python
  def execute_get_queue_status():
      query = """
          SELECT COUNT(*) as waiting_count
          FROM orders
          WHERE status = 'PREPARING'
          AND order_date = CURRENT_DATE
      """
      # 예상 시간 계산: 주문 1건당 약 3~5분 (설정 가능)
      estimated_minutes = waiting_count * 4  # 기본 4분/건
      return {
          "waiting_count": waiting_count,
          "estimated_minutes": estimated_minutes,
      }
  ```
- [ ] **개인 순번 기능** (로그인 사용자 전용)
  ```python
  # userId가 있으면 해당 사용자의 가장 최근 PREPARING 주문도 조회
  query = """
      SELECT order_number,
             (SELECT COUNT(*) FROM orders
              WHERE status = 'PREPARING' AND order_date = CURRENT_DATE
              AND id < my_order.id) as ahead_count
      FROM orders my_order
      WHERE user_id = %s AND status = 'PREPARING'
      AND order_date = CURRENT_DATE
      ORDER BY created_at DESC LIMIT 1
  """
  ```

#### Frontend 변경

- [ ] **FAQ_QUESTIONS에 추가** — `'주문 대기 현황'` 을 빠른 질문 목록에 추가

### 응답 예시

```
사용자: "지금 얼마나 기다려야해?"
에이전트: "현재 대기 중인 주문이 3건 있어요! ⏱️
          예상 대기 시간은 약 12분입니다.

          (고객님의 주문 #7번은 앞에 2건이 남았어요. 약 8분 후 완성 예정!)"
```

### 설정 가능 항목

- [ ] **주문당 예상 제조 시간** — 어드민 매장 설정(`store_settings`)에 `avg_prep_minutes` 컬럼 추가 (기본 4분)
- [ ] 또는 간단히 상수로 처리 (`ESTIMATED_PREP_MINUTES = 4`)

### 테스트 TODO

- [ ] PREPARING 주문이 없을 때 → "현재 대기 중인 주문이 없어요!"
- [ ] PREPARING 주문 5건 → "약 20분 예상"
- [ ] 로그인 사용자 + 본인 주문 PREPARING 시 → 본인 순번 안내
- [ ] 비로그인 사용자 → 전체 대기 현황만 안내

---

## Phase 4: 음료 페어링 추천 (RAG 확장)

> 장바구니에 커피를 담았으면 케이크 같은 디저트를 추천하고,  
> 디저트를 담았으면 음료를 추천하는 **크로스 카테고리 추천 시스템**

### 구현 방식: RAG 문서 + 전용 Tool

#### RAG 문서 구성 (어드민에서 업로드)

- [ ] **페어링 추천 문서 작성 및 업로드** — `/admin/rag`에서 등록
  ```markdown
  # 음료-디저트 페어링 가이드

  ## 커피 계열 + 디저트
  - 아메리카노 → 치즈케이크, 크루아상 (쌉싸름한 커피와 달콤한 디저트의 조합)
  - 카페라떼 → 마카롱, 초코 브라우니 (부드러운 우유와 달콤한 디저트)
  - 에스프레소 → 티라미수, 까눌레 (진한 커피 풍미와 어울리는 클래식 디저트)

  ## 논커피 + 디저트
  - 녹차라떼 → 팥 디저트, 말차 케이크 (차 계열의 깔끔함)
  - 스무디/에이드 → 과일 타르트, 가벼운 쿠키 (상큼한 조합)

  ## 디저트 → 음료 추천
  - 케이크류 → 아메리카노, 아이스티 (달콤함을 잡아주는 깔끔한 음료)
  - 쿠키/비스킷류 → 카페라떼, 바닐라 라떼 (부드럽게 즐기는 조합)
  ```

#### Agent Server 변경

- [ ] **새로운 Tool 정의** — `recommend_pairing`
  ```python
  FunctionDeclaration(
      name="recommend_pairing",
      description="현재 장바구니에 담긴 메뉴와 어울리는 메뉴를 추천합니다. 음료에는 디저트를, 디저트에는 음료를 추천합니다.",
      parameters=Schema(
          type=Type.OBJECT,
          properties={
              "current_menu": Schema(
                  type=Type.STRING,
                  description="현재 담긴 또는 관심 있는 메뉴 이름 (한글 또는 영문)",
              ),
              "category": Schema(
                  type=Type.STRING,
                  enum=["coffee", "non_coffee", "dessert", "etc"],
                  description="현재 메뉴의 카테고리",
              ),
          },
          required=["current_menu"],
      ),
  )
  ```
- [ ] **execute_function** — RAG 벡터 검색 + DB 메뉴 조회를 결합
  ```python
  def execute_recommend_pairing(current_menu, category):
      # 1. RAG에서 페어링 가이드 검색
      results = vector_service.search_similar(
          f"{current_menu} 페어링 추천 어울리는 메뉴", limit=3
      )
      
      # 2. DB에서 반대 카테고리 인기 메뉴 조회
      if category in ["coffee", "non_coffee"]:
          # 디저트 추천
          query = "SELECT kor_name, eng_name, price FROM menus WHERE category_id = (디저트) AND is_available = true LIMIT 3"
      else:
          # 음료 추천
          query = "SELECT kor_name, eng_name, price FROM menus WHERE category_id IN (커피, 논커피) AND is_available = true LIMIT 3"
      
      return {"rag_recommendations": results, "popular_pairings": db_results}
  ```

#### Frontend 변경

- [ ] **장바구니 컨텍스트 전달** — 채팅 요청 시 현재 장바구니 요약 정보를 함께 전송
  ```typescript
  body: JSON.stringify({
      message: content,
      sessionId,
      stream: true,
      userId: session?.user?.id || null,
      cartSummary: items.map(i => i.menuName).join(', '),  // 장바구니 요약
  })
  ```
- [ ] **system_instruction 확장** — 장바구니 정보를 컨텍스트에 포함
  ```python
  if cart_summary:
      system_instruction += f"\n[현재 장바구니]: {cart_summary}"
  ```

### 응답 예시

```
사용자: (장바구니에 아메리카노가 담겨 있는 상태)
사용자: "이거랑 어울리는 거 뭐 있어?"
에이전트: "아메리카노와 잘 어울리는 메뉴를 추천해드릴게요! 🎂

          ☕ + 🍰 베스트 페어링:
          1. 치즈케이크 — 쌉싸름한 아메리카노와 달콤한 치즈의 환상 조합!
          2. 크루아상 — 바삭한 식감이 커피와 찰떡궁합이에요
          3. 아몬드 쿠키 — 고소한 맛이 커피의 깊은 향과 어울려요"

          [치즈케이크 담기] [크루아상 담기] [아몬드쿠키 담기]
```

### 테스트 TODO

- [ ] 커피 담은 상태 → "어울리는 거" → 디저트 추천
- [ ] 디저트 담은 상태 → "같이 마실 거" → 음료 추천
- [ ] 빈 장바구니 → 인기 메뉴 기반 자유 추천
- [ ] RAG 문서에 없는 메뉴 → DB 카테고리 기반 fallback 추천

---

## Phase 5: 옵션 커스텀 상담 & 필터링 검색

> "우유 대신 두유로 바꿀 수 있는 메뉴가 뭐야?"  
> "커피가 아닌 음료 보여줘"  
> "샷 추가 가능한 메뉴"  
> 이런 **자연어 필터링 검색**을 에이전트가 DB 쿼리로 변환하여 처리

### 구현 방식

#### Agent Server 변경

- [ ] **새로운 Tool 정의** — `search_menus_by_filter`
  ```python
  FunctionDeclaration(
      name="search_menus_by_filter",
      description="메뉴를 다양한 조건으로 검색합니다. 옵션 필터링, 카테고리 필터링, 가격 범위 검색 등에 사용합니다.",
      parameters=Schema(
          type=Type.OBJECT,
          properties={
              "category_filter": Schema(
                  type=Type.STRING,
                  description="카테고리 필터 (예: 'coffee', 'non_coffee', 'dessert', 'tea' 등). 'not_coffee'로 커피 제외 가능",
              ),
              "option_filter": Schema(
                  type=Type.STRING,
                  description="특정 옵션이 있는 메뉴 검색 (예: '두유', '샷추가', '디카페인', '오트밀크')",
              ),
              "price_max": Schema(
                  type=Type.INTEGER,
                  description="최대 가격 필터 (원 단위)",
              ),
              "keyword": Schema(
                  type=Type.STRING,
                  description="메뉴명 키워드 검색 (예: '라떼', '스무디')",
              ),
          },
      ),
  )
  ```
- [ ] **execute_function** — 동적 SQL 쿼리 빌드
  ```python
  def execute_search_menus_by_filter(category_filter, option_filter, price_max, keyword):
      """
      복합 조건 쿼리:
      
      1) category_filter:
         - 'coffee' → category.name ILIKE '%커피%'
         - 'not_coffee' → category.name NOT ILIKE '%커피%'
         - 'dessert' → category.name ILIKE '%디저트%' OR '%베이커리%'
      
      2) option_filter: 
         - option_groups → option_items 에서 특정 옵션 항목 존재 여부 검색
         - 메뉴 ↔ option_group 매핑 테이블(또는 JSON 필드)에서 조인
         예: "두유" → option_items.name ILIKE '%두유%' 가 있는 option_group을 가진 메뉴
      
      3) price_max: menus.price <= price_max
      
      4) keyword: menus.kor_name ILIKE '%keyword%'
      """
  ```
- [ ] **옵션 그룹 연관 쿼리** — 메뉴 ↔ 옵션 그룹 관계에서 특정 옵션 아이템이 포함된 메뉴 검색
  ```sql
  SELECT DISTINCT m.kor_name, m.eng_name, m.price
  FROM menus m
  JOIN menu_option_group_mappings mogm ON m.id = mogm.menu_id
  JOIN option_groups og ON mogm.option_group_id = og.id
  JOIN option_items oi ON og.id = oi.option_group_id
  WHERE oi.name ILIKE '%두유%'
    AND m.is_available = true
    AND m.is_sold_out = false
  ```

#### Frontend 변경

- [ ] **검색 결과를 메뉴 카드로 표시** — Phase 1의 `show_menu_cards` 재사용
- [ ] **빠른 필터 버튼** — FAQ 영역에 인기 필터 추가
  ```typescript
  const FAQ_QUESTIONS = [
      '영업시간',
      '오늘의 추천 메뉴',
      '커피가 아닌 음료',      // 추가
      '디카페인 가능한 메뉴',   // 추가
  ];
  ```

### 응답 예시

```
사용자: "우유 대신 두유로 바꿀 수 있는 메뉴가 뭐야?"
에이전트: "두유 변경이 가능한 메뉴를 찾아봤어요! 🥛➡️🫘

          ✅ 두유 옵션 가능:
          1. 카페라떼 (4,500원)
          2. 바닐라 라떼 (5,000원)
          3. 녹차라떼 (5,500원)
          4. 고구마 라떼 (5,500원)

          주문 시 옵션에서 '두유 변경'을 선택하시면 돼요!
          추가 비용은 500원입니다."

          [카페라떼 보기] [바닐라 라떼 보기] [녹차라떼 보기]
```

### 테스트 TODO

- [ ] "두유 가능한 메뉴" → 두유 옵션이 있는 메뉴 목록
- [ ] "커피가 아닌 음료" → 논커피 카테고리 메뉴
- [ ] "5000원 이하 디저트" → 가격 + 카테고리 복합 필터
- [ ] "샷 추가 가능한 메뉴" → 샷추가 옵션이 있는 메뉴 목록
- [ ] 결과 없을 때 → "조건에 맞는 메뉴가 없어요" + 대안 제시

---

## Phase 6-1: 🔄 리오더(재주문) 기능

> "지난번에 주문한 거 다시 시켜줘", "저번에 먹었던 거 또 줘"  
> 로그인 사용자의 최근 주문 내역을 조회하여 동일 메뉴를 장바구니에 자동 추가

### 구현 방식

#### Agent Server 변경

- [ ] **새로운 Tool 정의** — `reorder_last`
  ```python
  FunctionDeclaration(
      name="reorder_last",
      description="로그인한 사용자의 최근 주문 내역을 조회하고, 동일 메뉴를 장바구니에 다시 담습니다. '다시 주문', '저번에 먹었던 거', '리오더' 등의 요청에 사용합니다.",
      parameters=Schema(
          type=Type.OBJECT,
          properties={
              "order_index": Schema(
                  type=Type.INTEGER,
                  description="몇 번째 최근 주문을 재주문할지 (0: 가장 최근, 1: 그 전, 기본 0)",
              ),
          },
      ),
  )
  ```
- [ ] **execute_function** — DB에서 최근 주문 + 주문 아이템 조회
  ```python
  def execute_reorder_last(user_id, order_index=0):
      if not user_id:
          return {"error": "로그인이 필요합니다."}, None
      
      query = """
          SELECT o.id, o.order_number, o.order_date, o.total_price,
                 oi.menu_id, oi.menu_name, oi.quantity, oi.unit_price
          FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          WHERE o.user_id = %s
          AND o.order_date = (
              SELECT DISTINCT order_date FROM orders
              WHERE user_id = %s
              ORDER BY order_date DESC
              OFFSET %s LIMIT 1
          )
          ORDER BY oi.id
      """
      # 결과를 장바구니 담기용 액션 리스트로 변환
      items = [{"menuId": row["menu_id"], "menuName": row["menu_name"],
                "quantity": row["quantity"]} for row in results]
      
      action = {"action": "reorder", "items": items}
      return {"success": True, "order_summary": summary}, action
  ```

#### Frontend 변경

- [ ] **useChatStore.ts** — 새로운 `pendingAction` 타입 추가: `reorder`
  ```typescript
  | { type: 'reorder'; items: { menuId: number; menuName: string; quantity: number }[] }
  ```
- [ ] **ChatWidget.tsx** — `reorder` 액션 수신 시 각 아이템을 장바구니에 순차 추가
  ```typescript
  } else if (pendingAction.type === 'reorder') {
      for (const item of pendingAction.items) {
          const res = await fetch(`/api/menus/${item.menuId}`);
          if (res.ok) {
              const menu = await res.json();
              addItem({ /* 기존 add_to_cart 로직 재사용 */ });
          }
      }
      clearPendingAction();
  }
  ```

### 응답 예시

```
사용자: "저번에 시킨 거 다시 주문해줘"
에이전트: "가장 최근 주문 내역을 찾았어요! 📋

          📅 2026-03-14 주문 #5
          • 아메리카노 × 2
          • 치즈케이크 × 1
          총 13,500원

          장바구니에 동일하게 담아드렸어요! 🛒"
```

### 테스트 TODO

- [ ] 로그인 사용자 — "다시 주문" → 최근 주문 내역 장바구니에 자동 추가
- [ ] 주문 내역 없는 사용자 → "아직 주문 내역이 없어요" 안내
- [ ] 비로그인 사용자 → "로그인이 필요합니다" + 로그인 페이지 이동
- [ ] "저저번에 시킨 거" → `order_index=1`로 그 전 주문 재주문
- [ ] 품절 메뉴가 포함된 경우 → 해당 메뉴만 제외하고 나머지 담기 + 안내

---

## Phase 6-2: 📊 인기 메뉴 실시간 랭킹

> "지금 뭐가 제일 잘 나가?", "오늘 인기 메뉴 뭐야?", "베스트 메뉴 알려줘"  
> 오늘 주문 데이터 기반 실시간 인기 메뉴 Top N 집계

### 구현 방식

#### Agent Server 변경

- [ ] **새로운 Tool 정의** — `get_popular_menus`
  ```python
  FunctionDeclaration(
      name="get_popular_menus",
      description="오늘 가장 많이 주문된 인기 메뉴 랭킹을 조회합니다. '인기 메뉴', '뭐가 잘 나가', '베스트', '많이 주문하는' 등의 요청에 사용합니다.",
      parameters=Schema(
          type=Type.OBJECT,
          properties={
              "limit": Schema(
                  type=Type.INTEGER,
                  description="조회할 순위 수 (기본 5, 최대 10)",
              ),
              "category": Schema(
                  type=Type.STRING,
                  description="특정 카테고리 내 인기 메뉴 (예: 'coffee', 'dessert'). 미지정 시 전체",
              ),
          },
      ),
  )
  ```
- [ ] **execute_function** — 오늘 주문 데이터 집계
  ```python
  def execute_get_popular_menus(limit=5, category=None):
      query = """
          SELECT oi.menu_name, m.eng_name, m.price,
                 COUNT(*) as order_count,
                 SUM(oi.quantity) as total_quantity
          FROM order_items oi
          JOIN orders o ON oi.order_id = o.id
          LEFT JOIN menus m ON oi.menu_id = m.id
          WHERE o.order_date = CURRENT_DATE
      """
      if category:
          query += " AND c.name ILIKE %s"
      query += """
          GROUP BY oi.menu_name, m.eng_name, m.price
          ORDER BY total_quantity DESC
          LIMIT %s
      """
      # 결과를 랭킹 형태로 포맷팅
      return {
          "rankings": [
              {"rank": i+1, "menuName": r["menu_name"], "slug": r["eng_name"],
               "price": r["price"], "orderCount": r["total_quantity"]}
              for i, r in enumerate(results)
          ],
          "date": today_str
      }, None  # 텍스트 응답만, 별도 액션 없음
  ```
- [ ] **주문 없는 날 fallback** — 오늘 주문이 없으면 최근 7일 집계로 대체

#### Frontend 변경

- [ ] **FAQ_QUESTIONS 확장** — `'오늘 인기 메뉴'`를 빠른 질문 목록에 추가
- [ ] (선택) 인기 메뉴 응답 시 `show_menu_cards` 액션과 결합하여 카드 UI로 표시

### 응답 예시

```
사용자: "오늘 뭐가 제일 잘 나가?"
에이전트: "오늘 실시간 인기 메뉴 TOP 5입니다! 🔥

          🥇 아메리카노 — 12잔 주문
          🥈 카페라떼 — 8잔 주문
          🥉 바닐라 라떼 — 6잔 주문
          4️⃣ 치즈케이크 — 5개 주문
          5️⃣ 녹차라떼 — 4잔 주문

          역시 아메리카노가 부동의 1위네요! ☕"
```

### 테스트 TODO

- [ ] 오늘 주문이 있을 때 → 실시간 랭킹 정상 응답
- [ ] 오늘 주문이 없을 때 → 최근 7일 인기 메뉴로 fallback
- [ ] "디저트 중에 인기" → 카테고리 필터 적용
- [ ] 주문 1건뿐일 때 → 1개만 표시 + "아직 데이터가 적어요" 안내
- [ ] `show_menu_cards`와 결합 시 카드 UI 정상 렌더링

---

## Phase 6-3: 🧾 주문 상태 실시간 조회

> "내 주문 어디까지 됐어?", "7번 주문 상태 알려줘"  
> 주문번호 또는 로그인 사용자 ID로 현재 주문 상태를 실시간 조회

### 구현 방식

#### Agent Server 변경

- [ ] **새로운 Tool 정의** — `check_order_status`
  ```python
  FunctionDeclaration(
      name="check_order_status",
      description="주문 상태를 실시간으로 조회합니다. '내 주문 상태', '몇 번 주문 어떻게 됐어', '준비됐어?' 등의 요청에 사용합니다.",
      parameters=Schema(
          type=Type.OBJECT,
          properties={
              "order_number": Schema(
                  type=Type.INTEGER,
                  description="조회할 주문번호 (예: 7). 미지정 시 로그인 사용자의 가장 최근 주문 조회",
              ),
          },
      ),
  )
  ```
- [ ] **execute_function** — 주문번호 또는 userId로 조회
  ```python
  def execute_check_order_status(user_id=None, order_number=None):
      if order_number:
          query = """
              SELECT o.order_number, o.status, o.customer_name, o.total_price,
                     o.order_type, o.created_at,
                     string_agg(oi.menu_name || ' × ' || oi.quantity, ', ') as items_summary
              FROM orders o
              JOIN order_items oi ON o.id = oi.order_id
              WHERE o.order_number = %s AND o.order_date = CURRENT_DATE
              GROUP BY o.id
          """
      elif user_id:
          query = """
              SELECT o.order_number, o.status, o.customer_name, o.total_price,
                     o.order_type, o.created_at,
                     string_agg(oi.menu_name || ' × ' || oi.quantity, ', ') as items_summary
              FROM orders o
              JOIN order_items oi ON o.id = oi.order_id
              WHERE o.user_id = %s AND o.order_date = CURRENT_DATE
              GROUP BY o.id
              ORDER BY o.created_at DESC LIMIT 1
          """
      else:
          return {"error": "주문번호를 알려주시거나 로그인해주세요."}, None
      
      status_labels = {
          "PREPARING": "☕ 준비 중",
          "COMPLETED": "✅ 제조 완료 (픽업 대기)",
          "PICKED_UP": "🎉 수령 완료",
          "REJECTED": "❌ 주문 거절",
      }
      
      return {
          "orderNumber": result["order_number"],
          "status": status_labels.get(result["status"], result["status"]),
          "items": result["items_summary"],
          "orderType": "포장" if result["order_type"] == "PICKUP" else "매장",
          "totalPrice": result["total_price"],
      }, None
  ```

#### Frontend 변경

- [ ] **FAQ_QUESTIONS 확장** — `'내 주문 상태'`를 빠른 질문 목록에 추가
- [ ] (선택) 주문 상태 응답 후 **주문 상세 페이지 바로가기** 버튼 렌더링
  - `action = {"action": "navigate", "url": f"/order/{order_date}/{order_number}"}` 반환

### 응답 예시

```
사용자: "내 주문 어디까지 됐어?"
에이전트: "가장 최근 주문 상태를 확인했어요! 📋

          📦 주문 #7
          상태: ☕ 준비 중
          내용: 아메리카노 × 2, 치즈케이크 × 1
          방식: 매장 (다회용기)
          금액: 13,500원

          조금만 기다려주세요! 곧 완성됩니다 😊"

          [주문 상세보기]
```

```
사용자: "7번 주문 됐어?"
에이전트: "7번 주문 확인 완료! ✅

          📦 주문 #7
          상태: ✅ 제조 완료 (픽업 대기)

          카운터에서 수령해주세요! 🎉"
```

### 테스트 TODO

- [ ] 로그인 사용자 — "내 주문 상태" → 가장 최근 주문 상태 응답
- [ ] 특정 번호 지정 — "7번 주문" → 해당 주문 상태 응답
- [ ] 비로그인 + 번호 미지정 → "주문번호를 알려주세요" 안내
- [ ] 해당 번호 주문이 없을 때 → "오늘 해당 번호의 주문을 찾을 수 없어요" 안내
- [ ] PREPARING → "준비 중" / COMPLETED → "제조 완료" / PICKED_UP → "수령 완료" 표시 정확성
- [ ] 주문 상세 바로가기 버튼 정상 동작

---

## Phase 6-4: 💰 가격 계산기

> "아메리카노 2잔이랑 치즈케이크 1개 얼마야?"  
> "5,000원 이하로 뭘 먹을 수 있어?"  
> 자연어로 메뉴 조합의 총 가격을 미리 계산해주는 기능

### 구현 방식

#### Agent Server 변경

- [ ] **새로운 Tool 정의** — `calculate_price`
  ```python
  FunctionDeclaration(
      name="calculate_price",
      description="하나 이상의 메뉴 조합에 대한 총 가격을 계산합니다. '얼마야', '가격 알려줘', '합계', '예산 내' 등의 요청에 사용합니다.",
      parameters=Schema(
          type=Type.OBJECT,
          properties={
              "items": Schema(
                  type=Type.ARRAY,
                  items=Schema(
                      type=Type.OBJECT,
                      properties={
                          "menu_name": Schema(
                              type=Type.STRING,
                              description="메뉴 이름 (한글 또는 영문)",
                          ),
                          "quantity": Schema(
                              type=Type.INTEGER,
                              description="수량 (기본 1)",
                          ),
                      },
                      required=["menu_name"],
                  ),
                  description="가격을 계산할 메뉴 목록",
              ),
              "use_points": Schema(
                  type=Type.INTEGER,
                  description="사용할 포인트 (시뮬레이션용, 선택)",
              ),
          },
          required=["items"],
      ),
  )
  ```
- [ ] **execute_function** — DB에서 메뉴 가격 조회 후 합산
  ```python
  def execute_calculate_price(items, use_points=0, user_id=None):
      total = 0
      item_details = []
      
      for item in items:
          query = """
              SELECT id, kor_name, eng_name, price
              FROM menus
              WHERE (kor_name ILIKE %s OR eng_name ILIKE %s)
              AND is_available = true
              LIMIT 1
          """
          menu = execute_query(query, (f"%{item['menu_name']}%", f"%{item['menu_name']}%"), fetch=True)
          if menu:
              qty = item.get("quantity", 1)
              subtotal = menu[0]["price"] * qty
              total += subtotal
              item_details.append({
                  "name": menu[0]["kor_name"],
                  "unitPrice": menu[0]["price"],
                  "quantity": qty,
                  "subtotal": subtotal,
              })
          else:
              item_details.append({
                  "name": item["menu_name"],
                  "error": "메뉴를 찾을 수 없습니다",
              })
      
      result = {
          "items": item_details,
          "totalPrice": total,
      }
      
      # 포인트 시뮬레이션
      if use_points and use_points > 0:
          final_price = max(0, total - use_points)
          result["pointsUsed"] = min(use_points, total)
          result["finalPrice"] = final_price
      
      # 로그인 유저의 실제 포인트 잔액도 안내
      if user_id:
          balance_query = "SELECT point_balance FROM users WHERE id = %s"
          user = execute_query(balance_query, (user_id,), fetch=True)
          if user and user[0]["point_balance"]:
              result["availablePoints"] = user[0]["point_balance"]
      
      return result, None
  ```

#### Frontend 변경

- [ ] **FAQ_QUESTIONS 확장** (선택) — `'가격 계산'`을 빠른 질문 목록에 추가
- [ ] 별도 UI 불필요 — 텍스트 응답만으로 충분 (Gemini가 결과를 자연어로 포맷)

### 응답 예시

```
사용자: "아메리카노 2잔이랑 치즈케이크 1개 얼마야?"
에이전트: "가격을 계산해봤어요! 🧮

          • 아메리카노 × 2 — 9,000원 (4,500원/잔)
          • 치즈케이크 × 1 — 6,000원
          ─────────────────
          💰 총 합계: 15,000원

          보유 포인트 1,200P를 사용하면 13,800원이에요!
          바로 장바구니에 담아드릴까요?"
```

```
사용자: "1000포인트 쓰면 얼마야?"
에이전트: "포인트 사용 시뮬레이션 결과예요! 🎯

          원래 금액: 15,000원
          포인트 사용: -1,000P
          ─────────────────
          💰 최종 결제 금액: 14,000원"
```

### 테스트 TODO

- [ ] 단일 메뉴 가격 조회 → 정확한 가격 응답
- [ ] 복수 메뉴 + 수량 조합 → 합계 정확성
- [ ] 존재하지 않는 메뉴 포함 → "해당 메뉴를 찾을 수 없어요" + 나머지 합계
- [ ] 포인트 시뮬레이션 → 차감 후 금액 정확성
- [ ] 로그인 사용자 → 보유 포인트 잔액 함께 안내
- [ ] 비로그인 사용자 → 포인트 안내 없이 합계만 표시
- [ ] 품절 메뉴 조회 → "현재 품절" 안내

---

## 🗺️ 추천 실행 순서

```
[Phase 2: 개인정보 조회] ← userId 전달 인프라가 이후 Phase 3, 6-1, 6-3, 6-4에도 필요
         ↓
[Phase 3: 대기시간 안내] ← 간단한 DB 쿼리, Phase 2의 인프라 재사용
         ↓
[Phase 1: 추천 메뉴 카드] ← UI 컴포넌트가 Phase 4, 5, 6-2에서도 재사용됨
         ↓
[Phase 5: 옵션 필터 검색] ← DB 쿼리 스킬이 Phase 4보다 범용적
         ↓
[Phase 4: 음료 페어링]   ← RAG 문서 준비 + Phase 1,5 컴포넌트 재사용
         ↓
[Phase 6-1: 리오더]      ← Phase 2 userId 인프라 + add_to_cart 로직 재사용
         ↓
[Phase 6-2: 인기 랭킹]   ← 단순 집계 쿼리 + Phase 1 메뉴 카드 재사용
         ↓
[Phase 6-3: 주문 조회]   ← Phase 2 userId 인프라 + Phase 3 DB 쿼리 패턴 재사용
         ↓
[Phase 6-4: 가격 계산]   ← 메뉴 DB 조회 + Phase 2 포인트 조회 재사용
```

> **핵심 원칙**: Phase 2에서 만드는 `userId 전달 인프라`와 Phase 1에서 만드는 `메뉴 카드 UI 컴포넌트`가  
> 이후 모든 Phase의 기반이 되므로 반드시 먼저 구현

---

## 📎 기존 코드 참고

### Agent Server
| 파일 | 역할 | 수정 필요 |
|------|------|-----------|
| `app/services/tools.py` | Tool 정의 + 실행 | ✅ 모든 Phase (총 9개 Tool 추가) |
| `app/services/gemini.py` | Gemini 스트리밍 + FC 루프 | ❌ (거의 변경 없음) |
| `app/services/vector.py` | RAG 벡터 검색 | ✅ Phase 4 |
| `app/services/database.py` | DB 연결 + 쿼리 | ✅ Phase 2,3,5,6-1~6-4 |
| `app/routers/chat.py` | 채팅 엔드포인트 + 시스템 프롬프트 | ✅ 모든 Phase (userId, cartSummary 추가) |
| `app/models/schemas.py` | 요청/응답 모델 | ✅ Phase 2 (userId, cartSummary 필드) |

### Frontend
| 파일 | 역할 | 수정 필요 |
|------|------|-----------|
| `components/chat/ChatWidget.tsx` | 채팅 UI + 액션 처리 | ✅ Phase 1,2,4,5,6-1,6-3 |
| `components/chat/ChatWidget.module.css` | 채팅 스타일 | ✅ Phase 1 (메뉴 카드 UI) |
| `store/useChatStore.ts` | 채팅 상태 관리 + SSE 파싱 | ✅ Phase 1,2,6-1 (pendingAction 타입 확장) |

### Backend (Spring Boot)
| 파일 | 역할 | 수정 필요 |
|------|------|-----------|
| DB 테이블 (`orders`, `order_items`, `menus`, `users`) | 데이터 소스 | ❌ (Agent가 DB 직접 쿼리) |
| DB 테이블 (`option_groups`, `option_items`, `menu_option_group_mappings`) | 옵션 필터링 | ❌ (Phase 5에서 직접 쿼리) |
| 신규 API 추가 없음 | Agent Server가 psycopg2로 DB 직접 조회 | ❌ |

### 신규 Tool 전체 목록
| Tool 이름 | Phase | 설명 |
|-----------|-------|------|
| `show_menu_cards` | 1 | 추천 메뉴 카드 UI 표시 |
| `get_my_info` | 2 | 포인트·등급·주문통계 조회 |
| `get_queue_status` | 3 | 대기 주문 수 + 예상 시간 |
| `recommend_pairing` | 4 | RAG 기반 음료·디저트 페어링 |
| `search_menus_by_filter` | 5 | 옵션·카테고리·가격 필터 검색 |
| `reorder_last` | 6-1 | 최근 주문 재주문 |
| `get_popular_menus` | 6-2 | 실시간 인기 랭킹 |
| `check_order_status` | 6-3 | 주문 상태 실시간 조회 |
| `calculate_price` | 6-4 | 메뉴 조합 가격 계산 |
