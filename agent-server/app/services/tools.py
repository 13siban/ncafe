from google.genai import types
from app.services.database import execute_query
from datetime import date

# ========== 페이지 목록 ==========
PAGES = {
    "home": {"url": "/", "description": "홈페이지"},
    "menu_list": {"url": "/menus", "description": "메뉴 목록 페이지"},
    "cart": {"url": "/cart", "description": "장바구니 페이지"},
    "order_history": {"url": "/order/my", "description": "주문 내역 페이지"},
    "login": {"url": "/login", "description": "로그인 페이지"},
    "about": {"url": "/about", "description": "카페 소개 페이지"},
}

# ========== Gemini Tool 정의 ==========
AGENT_TOOLS = types.Tool(
    function_declarations=[
        # --- 기존 Tool ---
        types.FunctionDeclaration(
            name="navigate_to_page",
            description="고객의 브라우저를 특정 페이지로 이동시킵니다. '보여줘', '이동해줘', '가줘' 등 페이지 이동 요청에 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "page": types.Schema(
                        type=types.Type.STRING,
                        enum=list(PAGES.keys()),
                        description="이동할 페이지 (home, menu_list, cart, order_history, login, about)",
                    ),
                },
                required=["page"],
            ),
        ),
        types.FunctionDeclaration(
            name="navigate_to_menu_detail",
            description="특정 메뉴의 상세 페이지로 이동시킵니다. 메뉴의 영문 이름(engName)을 소문자 하이픈(-) 형식 슬러그로 변환하여 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "slug": types.Schema(
                        type=types.Type.STRING,
                        description="메뉴의 영문 이름 슬러그 (예: americano, cafe-latte, almond-cookie)",
                    ),
                },
                required=["slug"],
            ),
        ),
        types.FunctionDeclaration(
            name="add_to_cart",
            description="특정 메뉴를 장바구니에 추가합니다. '담아줘', '추가해줘' 등 장바구니 요청에 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "slug": types.Schema(
                        type=types.Type.STRING,
                        description="메뉴의 영문 이름 슬러그 (예: americano, cafe-latte, almond-cookie)",
                    ),
                    "quantity": types.Schema(
                        type=types.Type.INTEGER,
                        description="수량 (기본값 1)",
                    ),
                },
                required=["slug"],
            ),
        ),

        # --- Phase 1: 추천 메뉴 카드 ---
        types.FunctionDeclaration(
            name="show_menu_cards",
            description="추천 메뉴를 카드 형태로 보여줍니다. 메뉴 추천, 인기 메뉴 등을 시각적으로 표시할 때 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "slugs": types.Schema(
                        type=types.Type.ARRAY,
                        items=types.Schema(type=types.Type.STRING),
                        description="추천할 메뉴들의 영문 슬러그 배열 (예: ['americano', 'cafe-latte'])",
                    ),
                },
                required=["slugs"],
            ),
        ),

        # --- Phase 2: 개인정보 조회 ---
        types.FunctionDeclaration(
            name="get_my_info",
            description="로그인한 사용자의 개인정보를 조회합니다. 포인트 잔액, 등급, 닉네임, 주문 횟수 등을 확인할 때 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "info_type": types.Schema(
                        type=types.Type.STRING,
                        enum=["all", "points", "grade", "orders", "account"],
                        description="조회할 정보 유형 (all: 전체, points: 포인트, grade: 등급, orders: 주문 통계, account: 계정 정보(이메일/연락처))",
                    ),
                },
                required=["info_type"],
            ),
        ),

        # --- Phase 3: 주문 대기 시간 ---
        types.FunctionDeclaration(
            name="get_queue_status",
            description="현재 주문 대기 상황을 조회합니다. 대기 주문 수, 예상 대기 시간을 확인할 때 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
            ),
        ),

        # --- Phase 4: 음료 페어링 추천 ---
        types.FunctionDeclaration(
            name="recommend_pairing",
            description="현재 장바구니에 담긴 메뉴와 어울리는 메뉴를 추천합니다. 음료에는 디저트를, 디저트에는 음료를 추천합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "current_menu": types.Schema(
                        type=types.Type.STRING,
                        description="현재 담긴 또는 관심 있는 메뉴 이름 (한글 또는 영문)",
                    ),
                    "category": types.Schema(
                        type=types.Type.STRING,
                        enum=["coffee", "non_coffee", "dessert", "etc"],
                        description="현재 메뉴의 카테고리",
                    ),
                },
                required=["current_menu"],
            ),
        ),

        # --- Phase 5: 옵션 필터링 검색 ---
        types.FunctionDeclaration(
            name="search_menus_by_filter",
            description="메뉴를 다양한 조건으로 검색합니다. 옵션 필터링, 카테고리 필터링, 가격 범위 검색 등에 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "category_filter": types.Schema(
                        type=types.Type.STRING,
                        description="카테고리 필터 (예: 'coffee', 'non_coffee', 'dessert', 'tea'). 'not_coffee'로 커피 제외",
                    ),
                    "option_filter": types.Schema(
                        type=types.Type.STRING,
                        description="특정 옵션이 있는 메뉴 검색 (예: '두유', '샷추가', '디카페인', '오트밀크')",
                    ),
                    "price_max": types.Schema(
                        type=types.Type.INTEGER,
                        description="최대 가격 필터 (원 단위)",
                    ),
                    "keyword": types.Schema(
                        type=types.Type.STRING,
                        description="메뉴명 키워드 검색 (예: '라떼', '스무디')",
                    ),
                },
            ),
        ),

        # --- Phase 6-1: 리오더 ---
        types.FunctionDeclaration(
            name="reorder_last",
            description="로그인한 사용자의 최근 주문 내역을 조회하고, 동일 메뉴를 장바구니에 다시 담습니다. '다시 주문', '저번에 먹었던 거', '리오더' 등의 요청에 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "order_index": types.Schema(
                        type=types.Type.INTEGER,
                        description="몇 번째 최근 주문을 재주문할지 (0: 가장 최근, 1: 그 전, 기본 0)",
                    ),
                },
            ),
        ),

        # --- Phase 6-2: 인기 메뉴 ---
        types.FunctionDeclaration(
            name="get_popular_menus",
            description="오늘 가장 많이 주문된 인기 메뉴 랭킹을 조회합니다. '인기 메뉴', '뭐가 잘 나가', '베스트', '많이 주문하는' 등의 요청에 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "limit": types.Schema(
                        type=types.Type.INTEGER,
                        description="조회할 순위 수 (기본 5, 최대 10)",
                    ),
                },
            ),
        ),

        # --- Phase 6-3: 주문 상태 조회 ---
        types.FunctionDeclaration(
            name="check_order_status",
            description="주문 상태를 실시간으로 조회합니다. '내 주문 상태', '몇 번 주문 어떻게 됐어', '준비됐어?' 등의 요청에 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "order_number": types.Schema(
                        type=types.Type.INTEGER,
                        description="조회할 주문번호 (예: 7). 미지정 시 로그인 사용자의 가장 최근 주문 조회",
                    ),
                },
            ),
        ),

        # --- Phase 6-4: 가격 계산기 ---
        types.FunctionDeclaration(
            name="calculate_price",
            description="하나 이상의 메뉴 조합에 대한 총 가격을 계산합니다. '얼마야', '가격 알려줘', '합계', '예산 내' 등의 요청에 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "items": types.Schema(
                        type=types.Type.ARRAY,
                        items=types.Schema(
                            type=types.Type.OBJECT,
                            properties={
                                "menu_name": types.Schema(
                                    type=types.Type.STRING,
                                    description="메뉴 이름 (한글 또는 영문)",
                                ),
                                "quantity": types.Schema(
                                    type=types.Type.INTEGER,
                                    description="수량 (기본 1)",
                                ),
                            },
                            required=["menu_name"],
                        ),
                        description="가격을 계산할 메뉴 목록",
                    ),
                    "use_points": types.Schema(
                        type=types.Type.INTEGER,
                        description="사용할 포인트 (시뮬레이션용, 선택)",
                    ),
                },
                required=["items"],
            ),
        ),
        # --- 즐겨찾기 (Phase 7+) ---
        types.FunctionDeclaration(
            name="add_to_favorite",
            description="특정 메뉴를 로그인한 사용자의 즐겨찾기에 추가합니다. '즐겨찾기에 등록해줘', '찜해줘' 등의 요청에 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "slug": types.Schema(
                        type=types.Type.STRING,
                        description="즐겨찾기에 추가할 메뉴의 영문 슬러그 (예: americano, cafe-latte)",
                    ),
                    "alias": types.Schema(
                        type=types.Type.STRING,
                        description="해당 즐겨찾기 항목에 지정할 별칭(옵션) (예: '매일 아침 커피')",
                    ),
                },
                required=["slug"],
            ),
        ),
        types.FunctionDeclaration(
            name="add_favorites_to_cart",
            description="로그인한 사용자의 즐겨찾기 목록에 있는 모든 메뉴를 조회하여 장바구니에 일괄로 담습니다. '즐겨찾기에 있는 거 담아줘' 등의 요청에 사용합니다.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={},
            ),
        ),
    ]
)


# ========== Tool 실행 컨텍스트 (userId 등) ==========
_current_context = {"user_id": None}

def set_context(user_id=None):
    _current_context["user_id"] = user_id

def get_user_id():
    return _current_context.get("user_id")


def execute_function(function_call) -> tuple[dict, dict | None]:
    """
    Gemini Function Call을 실행하고 (result, action) 튜플을 반환한다.
    """
    try:
        return _execute_function_inner(function_call)
    except Exception as e:
        print(f"[Tool Error] {function_call.name}: {e}")
        import traceback
        traceback.print_exc()
        return {"error": f"도구 실행 중 오류가 발생했습니다: {str(e)}"}, None

def _execute_function_inner(function_call) -> tuple[dict, dict | None]:
    name = function_call.name
    args = function_call.args or {}

    if name == "navigate_to_page":
        page_key = args.get("page", "")
        page_info = PAGES.get(page_key)
        if not page_info:
            return {"error": f"알 수 없는 페이지: {page_key}"}, None
        action = {"action": "navigate", "url": page_info["url"]}
        return {"success": True, "page": page_info["description"]}, action

    elif name == "navigate_to_menu_detail":
        slug = args.get("slug", "").lower().replace(" ", "-")
        if not slug:
            return {"error": "슬러그가 지정되지 않았습니다."}, None
        action = {"action": "navigate", "url": f"/menus/{slug}"}
        return {"success": True, "page": f"{slug} 메뉴 상세 페이지"}, action

    elif name == "add_to_cart":
        slug = args.get("slug", "").lower().replace(" ", "-")
        quantity = args.get("quantity", 1)
        if not slug:
            return {"error": "슬러그가 지정되지 않았습니다."}, None
        action = {"action": "add_to_cart", "slug": slug, "quantity": quantity}
        return {"success": True, "item": slug, "quantity": quantity}, action

    elif name == "show_menu_cards":
        slugs = args.get("slugs", [])
        if not slugs:
            return {"error": "메뉴 슬러그가 필요합니다."}, None
        menu_infos = []
        for s in slugs[:5]:
            slug = s.lower().replace(" ", "-")
            rows = execute_query(
                "SELECT id, kor_name, eng_name, price FROM menus WHERE LOWER(REPLACE(eng_name, ' ', '-')) = %s AND is_available = true LIMIT 1",
                (slug,), fetch=True
            )
            if rows:
                r = rows[0]
                menu_infos.append({"slug": slug, "name": r["kor_name"], "price": r["price"]})
        action = {"action": "show_menu_cards", "menus": menu_infos}
        return {"success": True, "menus": menu_infos}, action

    elif name == "get_my_info":
        user_id = get_user_id()
        if not user_id:
            return {"error": "로그인이 필요합니다. 로그인 후 다시 시도해주세요."}, None
        info_type = args.get("info_type", "all")
        rows = execute_query(
            "SELECT nickname, username, email, phone_number, grade, point_balance FROM users WHERE id = %s",
            (user_id,), fetch=True
        )
        if not rows:
            return {"error": "사용자 정보를 찾을 수 없습니다."}, None
        u = rows[0]
        pb = u["point_balance"] or 0

        # ★ 실시간 주문 집계 (users 테이블 캐시 대신 orders 테이블에서 직접 카운트)
        order_stats = execute_query(
            "SELECT COUNT(*) as order_count, COALESCE(SUM(total_price), 0) as order_amount "
            "FROM orders WHERE user_id = %s AND status NOT IN ('CANCELLED')",
            (user_id,), fetch=True
        )
        toc = int(order_stats[0]["order_count"]) if order_stats else 0
        toa = int(order_stats[0]["order_amount"]) if order_stats else 0

        # ★ 등급: DB 값이 없으면 실적 기반으로 현재 적용 등급 계산
        grade_name = u["grade"] or None
        if not grade_name:
            # 모든 등급 조건을 가져와서 현재 실적에 맞는 최고 등급 산정
            all_grades = execute_query(
                "SELECT grade, display_name, sort_order, earn_rate, upgrade_order_count, upgrade_order_amount "
                "FROM grade_settings ORDER BY sort_order ASC",
                fetch=True
            )
            grade_name = all_grades[0]["grade"] if all_grades else "GREEN_BEAN"
            for g in all_grades:
                req_cnt = g["upgrade_order_count"] or 0
                req_amt = g["upgrade_order_amount"] or 0
                if req_cnt == 0 and req_amt == 0:
                    # 최저 등급(조건 없음)은 기본 할당
                    grade_name = g["grade"]
                    continue
                if toc >= req_cnt or toa >= req_amt:
                    grade_name = g["grade"]

        grade_rows = execute_query(
            "SELECT display_name, earn_rate, sort_order FROM grade_settings WHERE grade = %s",
            (grade_name,), fetch=True
        )
        display_name = grade_rows[0]["display_name"] if grade_rows else grade_name
        earn_rate = grade_rows[0]["earn_rate"] if grade_rows else 0
        current_sort = grade_rows[0]["sort_order"] if grade_rows else 1

        # 다음 등급 승급 조건 조회
        next_grade_rows = execute_query(
            "SELECT display_name, upgrade_order_count, upgrade_order_amount FROM grade_settings WHERE sort_order = %s",
            (current_sort + 1,), fetch=True
        )
        next_grade_info = None
        if next_grade_rows:
            ng = next_grade_rows[0]
            req_cnt = ng["upgrade_order_count"] or 0
            req_amt = ng["upgrade_order_amount"] or 0
            next_grade_info = {
                "nextGradeName": ng["display_name"],
                "requiredOrderCount": req_cnt,
                "requiredOrderAmount": req_amt,
                "currentOrderCount": toc,
                "currentOrderAmount": toa,
                "remainingOrderCount": max(0, req_cnt - toc),
                "remainingOrderAmount": max(0, req_amt - toa),
            }

        result = {
            "nickname": u["nickname"] or u["username"],
            "username": u["username"],
            "email": u["email"],
            "phoneNumber": u["phone_number"],
            "gradeName": display_name,
            "earnRate": earn_rate,
            "pointBalance": pb,
            "totalOrderCount": toc,
            "totalOrderAmount": toa,
        }
        if next_grade_info:
            result["nextGrade"] = next_grade_info
        else:
            result["isMaxGrade"] = True

        if info_type == "points":
            result = {"pointBalance": pb, "gradeName": display_name, "earnRate": earn_rate}
        elif info_type == "grade":
            result = {"gradeName": display_name, "earnRate": earn_rate, "pointBalance": pb}
            if next_grade_info:
                result["nextGrade"] = next_grade_info
            else:
                result["isMaxGrade"] = True
        elif info_type == "orders":
            result = {"totalOrderCount": toc, "totalOrderAmount": toa}
        elif info_type == "account":
            result = {
                "nickname": u["nickname"] or u["username"],
                "username": u["username"],
                "email": u["email"],
                "phoneNumber": u["phone_number"]
            }
        return result, None

    elif name == "get_queue_status":
        user_id = get_user_id()
        rows = execute_query(
            "SELECT COUNT(*) as cnt FROM orders WHERE status = 'PREPARING' AND order_date = CURRENT_DATE",
            fetch=True
        )
        waiting = rows[0]["cnt"] if rows else 0
        est_minutes = waiting * 4
        result = {"waitingCount": waiting, "estimatedMinutes": est_minutes}
        if user_id:
            my = execute_query(
                """SELECT order_number,
                   (SELECT COUNT(*) FROM orders WHERE status = 'PREPARING' AND order_date = CURRENT_DATE AND id < my.id) as ahead
                   FROM orders my WHERE user_id = %s AND status = 'PREPARING' AND order_date = CURRENT_DATE
                   ORDER BY created_at DESC LIMIT 1""",
                (user_id,), fetch=True
            )
            if my:
                result["myOrderNumber"] = my[0]["order_number"]
                result["aheadCount"] = my[0]["ahead"]
                result["myEstimatedMinutes"] = (my[0]["ahead"] + 1) * 4
        return result, None

    elif name == "recommend_pairing":
        current_menu = args.get("current_menu", "")
        category = args.get("category", "")
        if category in ("coffee", "non_coffee"):
            rows = execute_query(
                """SELECT m.kor_name, LOWER(REPLACE(m.eng_name, ' ', '-')) as slug, m.price
                   FROM menus m JOIN categories c ON m.category_id = c.id
                   WHERE c.name NOT ILIKE '%%커피%%' AND c.name NOT ILIKE '%%에스프레소%%'
                   AND m.is_available = true AND m.is_sold_out = false
                   ORDER BY m.sort_order LIMIT 5""",
                fetch=True
            )
        else:
            rows = execute_query(
                """SELECT m.kor_name, LOWER(REPLACE(m.eng_name, ' ', '-')) as slug, m.price
                   FROM menus m JOIN categories c ON m.category_id = c.id
                   WHERE (c.name ILIKE '%%커피%%' OR c.name ILIKE '%%에스프레소%%' OR c.name ILIKE '%%음료%%')
                   AND m.is_available = true AND m.is_sold_out = false
                   ORDER BY m.sort_order LIMIT 5""",
                fetch=True
            )
        pairings = [{"name": r["kor_name"], "slug": r["slug"], "price": r["price"]} for r in (rows or [])]
        slugs = [p["slug"] for p in pairings[:3]]
        action = {"action": "show_menu_cards", "menus": pairings[:3]} if pairings else None
        return {"currentMenu": current_menu, "pairings": pairings}, action

    elif name == "search_menus_by_filter":
        cat = args.get("category_filter", "")
        opt = args.get("option_filter", "")
        price_max = args.get("price_max")
        keyword = args.get("keyword", "")

        conditions = ["m.is_available = true", "m.is_sold_out = false"]
        params = []

        if cat:
            if cat == "not_coffee":
                conditions.append("c.name NOT ILIKE '%%커피%%' AND c.name NOT ILIKE '%%에스프레소%%'")
            elif cat == "coffee":
                conditions.append("(c.name ILIKE '%%커피%%' OR c.name ILIKE '%%에스프레소%%')")
            elif cat == "dessert":
                conditions.append("(c.name ILIKE '%%디저트%%' OR c.name ILIKE '%%베이커리%%' OR c.name ILIKE '%%케이크%%')")
            else:
                conditions.append("c.name ILIKE %s")
                params.append(f"%{cat}%")

        if price_max:
            conditions.append("m.price <= %s")
            params.append(price_max)
        if keyword:
            conditions.append("m.kor_name ILIKE %s")
            params.append(f"%{keyword}%")

        where = " AND ".join(conditions)

        if opt:
            query = f"""
                SELECT DISTINCT m.kor_name, LOWER(REPLACE(m.eng_name, ' ', '-')) as slug, m.price
                FROM menus m
                JOIN categories c ON m.category_id = c.id
                JOIN category_option_group_map cogm ON c.id = cogm.category_id
                JOIN option_groups og ON cogm.option_group_id = og.id
                JOIN option_items oi ON og.id = oi.option_group_id
                WHERE {where} AND oi.name ILIKE %s
                AND m.id NOT IN (
                    SELECT moe.menu_id FROM menu_option_exclusions moe
                    WHERE moe.option_group_id = og.id
                )
                ORDER BY m.price LIMIT 10
            """
            params.append(f"%{opt}%")
        else:
            query = f"""
                SELECT m.kor_name, LOWER(REPLACE(m.eng_name, ' ', '-')) as slug, m.price
                FROM menus m JOIN categories c ON m.category_id = c.id
                WHERE {where}
                ORDER BY m.price LIMIT 10
            """

        rows = execute_query(query, tuple(params) if params else None, fetch=True)
        menus = [{"name": r["kor_name"], "slug": r["slug"], "price": r["price"]} for r in (rows or [])]
        action = {"action": "show_menu_cards", "menus": menus[:5]} if menus else None
        return {"menus": menus, "count": len(menus)}, action

    elif name == "reorder_last":
        user_id = get_user_id()
        if not user_id:
            return {"error": "로그인이 필요합니다."}, {"action": "navigate", "url": "/login"}
        order_index = args.get("order_index", 0) or 0
        rows = execute_query(
            """SELECT o.order_number, o.order_date, o.total_price,
                      oi.menu_id, oi.menu_name, oi.quantity
               FROM orders o JOIN order_items oi ON o.id = oi.order_id
               WHERE o.id = (
                   SELECT id FROM orders WHERE user_id = %s
                   AND status NOT IN ('CANCELLED')
                   ORDER BY id DESC OFFSET %s LIMIT 1
               )
               ORDER BY oi.id""",
            (user_id, order_index), fetch=True
        )
        if not rows:
            return {"error": "주문 내역을 찾을 수 없습니다."}, None
        # 같은 메뉴는 수량으로 합산
        merged: dict = {}
        for r in rows:
            mid = r["menu_id"]
            if mid in merged:
                merged[mid]["quantity"] += r["quantity"]
            else:
                merged[mid] = {"menuId": mid, "menuName": r["menu_name"], "quantity": r["quantity"]}
        items = list(merged.values())
        summary = f"{rows[0]['order_date']} 주문 #{rows[0]['order_number']} ({len(items)}개 메뉴, {rows[0]['total_price']}원)"
        action = {"action": "reorder", "items": items}
        return {"success": True, "orderSummary": summary, "items": items}, action

    elif name == "get_popular_menus":
        limit = min(args.get("limit", 5) or 5, 10)
        rows = execute_query(
            """SELECT oi.menu_name, LOWER(REPLACE(COALESCE(m.eng_name, ''), ' ', '-')) as slug,
                      COALESCE(m.price, 0) as price, SUM(oi.quantity) as total_qty
               FROM order_items oi
               JOIN orders o ON oi.order_id = o.id
               LEFT JOIN menus m ON oi.menu_id = m.id
               WHERE o.order_date = CURRENT_DATE
               GROUP BY oi.menu_name, m.eng_name, m.price
               ORDER BY total_qty DESC LIMIT %s""",
            (limit,), fetch=True
        )
        if not rows:
            rows = execute_query(
                """SELECT oi.menu_name, LOWER(REPLACE(COALESCE(m.eng_name, ''), ' ', '-')) as slug,
                          COALESCE(m.price, 0) as price, SUM(oi.quantity) as total_qty
                   FROM order_items oi
                   JOIN orders o ON oi.order_id = o.id
                   LEFT JOIN menus m ON oi.menu_id = m.id
                   WHERE o.order_date >= CURRENT_DATE - INTERVAL '7 days'
                   GROUP BY oi.menu_name, m.eng_name, m.price
                   ORDER BY total_qty DESC LIMIT %s""",
                (limit,), fetch=True
            )
        rankings = [
            {"rank": i+1, "menuName": r["menu_name"], "slug": r["slug"], "price": r["price"], "orderCount": int(r["total_qty"])}
            for i, r in enumerate(rows or [])
        ]
        return {"rankings": rankings, "date": str(date.today())}, None

    elif name == "check_order_status":
        user_id = get_user_id()
        order_number = args.get("order_number")
        status_labels = {
            "PREPARING": "☕ 준비 중",
            "COMPLETED": "✅ 제조 완료 (픽업 대기)",
            "PICKED_UP": "🎉 수령 완료",
            "REJECTED": "❌ 주문 거절",
        }
        if order_number:
            rows = execute_query(
                """SELECT o.order_number, o.order_date, o.status, o.customer_name, o.total_price,
                          o.order_type, o.created_at,
                          string_agg(oi.menu_name || ' × ' || oi.quantity, ', ') as items_summary
                   FROM orders o JOIN order_items oi ON o.id = oi.order_id
                   WHERE o.order_number = %s AND o.order_date = CURRENT_DATE
                   GROUP BY o.id""",
                (order_number,), fetch=True
            )
        elif user_id:
            rows = execute_query(
                """SELECT o.order_number, o.order_date, o.status, o.customer_name, o.total_price,
                          o.order_type, o.created_at,
                          string_agg(oi.menu_name || ' × ' || oi.quantity, ', ') as items_summary
                   FROM orders o JOIN order_items oi ON o.id = oi.order_id
                   WHERE o.user_id = %s AND o.order_date = CURRENT_DATE
                   GROUP BY o.id ORDER BY o.created_at DESC LIMIT 1""",
                (user_id,), fetch=True
            )
        else:
            return {"error": "주문번호를 알려주시거나 로그인해주세요."}, None
        if not rows:
            return {"error": "오늘 해당 주문을 찾을 수 없습니다."}, None
        r = rows[0]
        order_type_label = "포장 (일회용기)" if r.get("order_type") == "PICKUP" else "매장 (다회용기)"
        result = {
            "orderNumber": r["order_number"],
            "status": status_labels.get(r["status"], r["status"]),
            "rawStatus": r["status"],
            "items": r["items_summary"],
            "orderType": order_type_label,
            "totalPrice": r["total_price"],
        }
        action = {"action": "navigate", "url": f"/order/{r['order_date']}/{r['order_number']}"}
        return result, action

    elif name == "calculate_price":
        items_input = args.get("items", [])
        use_points = args.get("use_points", 0) or 0
        user_id = get_user_id()
        total = 0
        item_details = []
        for item in items_input:
            menu_name = item.get("menu_name", "")
            qty = item.get("quantity", 1) or 1
            rows = execute_query(
                """SELECT id, kor_name, eng_name, price, is_sold_out
                   FROM menus WHERE (kor_name ILIKE %s OR eng_name ILIKE %s) AND is_available = true LIMIT 1""",
                (f"%{menu_name}%", f"%{menu_name}%"), fetch=True
            )
            if rows:
                r = rows[0]
                if r.get("is_sold_out"):
                    item_details.append({"name": r["kor_name"], "note": "현재 품절"})
                else:
                    subtotal = r["price"] * qty
                    total += subtotal
                    item_details.append({"name": r["kor_name"], "unitPrice": r["price"], "quantity": qty, "subtotal": subtotal})
            else:
                item_details.append({"name": menu_name, "error": "메뉴를 찾을 수 없습니다"})
        result = {"items": item_details, "totalPrice": total}
        if use_points and use_points > 0:
            result["pointsUsed"] = min(use_points, total)
            result["finalPrice"] = max(0, total - use_points)
        if user_id:
            ub = execute_query("SELECT point_balance FROM users WHERE id = %s", (user_id,), fetch=True)
            if ub and ub[0].get("point_balance"):
                result["availablePoints"] = ub[0]["point_balance"]
        return result, None

    elif name == "add_to_favorite":
        user_id = get_user_id()
        if not user_id:
            return {"error": "로그인이 필요합니다. 로그인 후 다시 시도해주세요."}, None
        slug = args.get("slug", "").lower().replace(" ", "-")
        alias = args.get("alias", "")
        if not slug:
            return {"error": "슬러그가 지정되지 않았습니다."}, None
            
        rows = execute_query(
            "SELECT id, kor_name FROM menus WHERE LOWER(REPLACE(eng_name, ' ', '-')) = %s",
            (slug,), fetch=True
        )
        if not rows:
            return {"error": f"슬러그 {slug}에 해당하는 메뉴를 찾을 수 없습니다."}, None

        menu_name = rows[0]["kor_name"]
        
        # 프론트엔드로 즐겨찾기 옵션 선택 창을 띄우는 액션만 리턴함 (실제 DB 저장은 프론트엔드에서 API 호출로 진행)
        action = {"action": "open_favorite_panel", "slug": slug}
        return {"success": True, "message": f"'{menu_name}' 메뉴의 상세 옵션을 선택해주세요. (옵션을 고른 후 '즐겨찾기 추가' 버튼을 눌러야 최종 저장됩니다.)"}, action

    elif name == "add_favorites_to_cart":
        user_id = get_user_id()
        if not user_id:
            return {"error": "로그인이 필요합니다. 로그인 후 다시 시도해주세요."}, None
            
        rows = execute_query(
            """SELECT ufm.menu_id, m.kor_name 
               FROM user_favorite_menus ufm
               JOIN menus m ON ufm.menu_id = m.id
               WHERE ufm.user_id = %s
               ORDER BY ufm.created_at ASC""",
            (user_id,), fetch=True
        )
        
        if not rows:
            return {"error": "즐겨찾기에 등록된 메뉴가 없습니다. 먼저 즐겨찾기에 메뉴를 추가해주세요."}, None
            
        items = [{"menuId": r["menu_id"], "menuName": r["kor_name"], "quantity": 1} for r in rows]
        summary = f"즐겨찾기 항목 총 {len(items)}개의 메뉴를 장바구니 추가 목록으로 보냅니다."
        action = {"action": "reorder", "items": items}
        return {"success": True, "message": summary, "items": items}, action

    return {"error": f"알 수 없는 함수: {name}"}, None
