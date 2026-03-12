from google.genai import types

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
    ]
)


def execute_function(function_call) -> tuple[dict, dict | None]:
    """
    Gemini Function Call을 실행하고 (result, action) 튜플을 반환한다.
    - result: Gemini에게 전달할 함수 실행 결과 (텍스트 응답 생성에 사용)
    - action: 프론트엔드로 전달할 브라우저 액션 (없으면 None)
    """
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

    return {"error": f"알 수 없는 함수: {name}"}, None
