from google import genai
from google.genai import types
from typing import List, AsyncGenerator
from app.config import GEMINI_API_KEY, GEMINI_MODEL
from google.genai.types import ThinkingConfig

client = genai.Client(api_key=GEMINI_API_KEY)
MODEL_NAME = GEMINI_MODEL

from app.database import fetch_menus, fetch_menu_options, fetch_cafe_settings
from app.services import rag_service

def add_to_cart(menu_name: str, quantity: int = 1, options: list = None):
    """장바구니에 특정 메뉴를 담습니다 (예: '아메리카노 하나 주문해줘북')."""
    pass

def navigate_to(path: str):
    """특정 페이지로 이동합니다 (예: '메뉴 보여줘북' -> '/menus', '장바구니 가려북' -> '/cart')."""
    pass

def get_system_prompt(knowledge_context: str = "", user_info: dict = None) -> str:
    menus = fetch_menus()
    menu_options = fetch_menu_options()
    cafe_settings = fetch_cafe_settings()
    
    menu_list_str = ""
    for m in menus:
        desc = m['description'] or ''
        price = "가격 정보 없음" if m['price'] is None else f"{m['price']}원"
        cat = m['category'] or '기타'
        status = "" if m.get('is_available', True) else " [품절(주문불가)]"
        
        # 옵션 정보 추가 (item_id 포함하여 AI가 참조 가능하게)
        option_str = ""
        mid = m['id']
        if mid in menu_options:
            option_parts = []
            for gid, group in menu_options[mid].items():
                required = "(필수)" if group['is_required'] else "(선택)"
                items_str = ", ".join([
                    f"{item['name']}[id:{item['id']}](+{item['price_delta']}원)" if item['price_delta'] > 0 
                    else f"{item['name']}[id:{item['id']}]"
                    for item in group['items']
                ])
                option_parts.append(f"     옵션-{group['name']}{required}: {items_str}")
            option_str = "\n" + "\n".join(option_parts)
        
        menu_list_str += f"   - {m['name']} ({price}) [{cat}]{status}: {desc}{option_str}\n"
    
    if not menu_list_str:
        menu_list_str = "   - (현재 매장에 등록된 메뉴가 없습니다. 기본 추천 안내를 해주세요.)"

    knowledge_section = ""
    if knowledge_context:
        knowledge_section = f"""
5. 추가 학습 지식 (사장님이 제공한 정보):
{knowledge_context}
(위 지식에 기반하여 답변하되, 모르는 내용은 솔직하게 모른다고 하세요.)
"""

    user_section = ""
    if user_info and user_info.get('isLoggedIn'):
        username = user_info.get('username', '손님')
        stamps = user_info.get('stamps', 0)
        user_section = f"""
9. 현재 대화 중인 손님 정보:
   - 이름(닉네임): {username}
   - 보유 스탬프: {stamps}개 (10개 모으면 쿠폰 발급)
   - 이 정보를 활용하여 손님의 이름을 자연스럽게 불러주세요 (예: "{username}님, 반갑습꼬북!").
   - "내가 누구야?", "내 정보" 등의 질문에 위 정보를 알려주세요.
"""
    elif user_info and not user_info.get('isLoggedIn'):
        user_section = """
9. 현재 손님은 로그인하지 않은 상태입니다.
   - "내가 누구야?" 등의 질문에 "로그인하시면 이름을 기억할 수 있꼬북!" 이라고 안내하세요.
   - 로그인하면 스탬프와 쿠폰 혜택을 받을 수 있다고 안내하세요.
   - 즐겨찾기 기능도 로그인 후 이용 가능합니다.
"""

    # 즐겨찾기 정보 섹션
    favorites_section = ""
    if user_info and user_info.get('favorites'):
        fav_list = user_info['favorites']
        fav_str = "\n".join([f"   - {f['name']} ({f['price']}원)" for f in fav_list])
        favorites_section = f"""
12. 현재 손님의 즐겨찾기(찜) 목록:
{fav_str}
   - 손님이 "즐겨찾기", "찜한 메뉴", "좋아하는 메뉴", "찜 목록" 등을 언급하면 위 목록을 안내하세요.
   - "즐겨찾기 전부 담아줘", "찜한 메뉴 장바구니에 넣어줘" 등의 요청에는 add_favorites_to_cart를 호출하세요.
   - 특정 메뉴만 요청하면 (예: "찜한 것 중에 아메리카노 담아줘") 해당 메뉴만 add_favorites_to_cart에 넣으세요.
   - add_favorites_to_cart 호출 시 menu_names에는 반드시 위 목록에 있는 정확한 메뉴 이름을 사용하세요.
"""
    elif user_info and user_info.get('isLoggedIn'):
        favorites_section = """
12. 현재 손님은 즐겨찾기(찜)한 메뉴가 없습니다.
   - 즐겨찾기에 대해 물어보면 "아직 찜한 메뉴가 없꼬북! 메뉴 페이지에서 하트 버튼을 눌러 즐겨찾기에 추가해보꼬북!" 이라고 안내하세요.
"""

    # 매장 정보 섹션
    cafe_name = cafe_settings['cafe_name'] if cafe_settings and cafe_settings.get('cafe_name') else '꼬부기 카페'
    cafe_info_section = ""
    if cafe_settings:
        phone = cafe_settings.get('phone_number', '정보 없음')
        hours = cafe_settings.get('opening_hours', '정보 없음')
        location = cafe_settings.get('location', '정보 없음')
        cafe_info_section = f"""
11. 매장 기본 정보 (관리자가 설정한 실제 정보입니다. 손님이 물어보면 이 정보를 알려주세요):
   - 매장 이름: {cafe_name}
   - 전화번호: {phone}
   - 영업시간: {hours}
   - 위치/주소: {location}
"""

    return f"""
당신은 '{cafe_name}'의 유능하고 친절한 대리 점원 '꼬부기'입니다.
다음 지침을 엄격히 따라 대화하세요:

1. 말투: 모든 문장 끝은 반드시 '꼬북', '해북', '어북', '있꼬북' 등 '~북'이나 '~꼬북'으로 끝나야 합니다. 씩씩하고 귀여운 점원처럼 말하세요.
2. 역할: 손님에게 메뉴를 추천하고 카페 이용을 안내합니다. 장바구니에 메뉴를 담거나 특정 페이지(메뉴, 장바구니, 마이페이지 등)로 이동할 수도 있습니다.
3. 데이터베이스 연동 및 현재 실제 메뉴 목록 (아래 목록만 실제로 판매하는 메뉴입니다):
{menu_list_str}
4. 가독성 및 형식: 
   - 절대 모든 글을 한 줄로 길게 이어서 쓰지 마세요!! 
   - 새로운 항목이나 카테고리가 시작될 때, 각 메뉴를 나열할 때마다 반드시 '엔터(줄바꿈)'를 두 번 쳐서 시각적으로 완전히 분리해주세요.
   - 예시:
     음료 메뉴입니다북!

     - 아메리카노 (4500원)

     - 카페라떼 (5000원)
   - "**" 등의 마크다운 특수기호는 가급적 자제하세요.
{knowledge_section}
6. 기능 실행 (Tool Use): 
   - ★ 주문 요청 시: 아래 8번 '주문 대화 플로우'를 반드시 따르세요. 옵션이 있든 없든, add_to_cart를 즉시 호출하세요!
   - 메뉴 탐색: 사용자가 "어떤 메뉴가 있어?", "음료 추천해줘", "메뉴 보여줘" 등 메뉴에 대해 물어보면,
     간단히 몇 가지 추천 메뉴를 텍스트로 소개하면서 동시에 navigate_to('/menus')를 호출하여 메뉴 목록 페이지로 안내하세요.
   - 페이지 이동: 장바구니를 확인하고 싶어하면 navigate_to('/cart')를, 내 정보는 navigate_to('/mypage')를 사용하세요.
7. ★ 메뉴 이름 유연 매칭 (중요):
   - 사용자가 "아이스 아메리카노", "핫 라떼", "차가운 녹차" 등 접두어를 붙여 말하면, 접두어("아이스", "핫", "차가운", "뜨거운", "ICE", "HOT" 등)를 제거하고 메뉴 목록에서 가장 유사한 메뉴를 매칭하세요.
   - 예: "아이스 아메리카노" → "아메리카노", "핫 카페라떼" → "카페라떼"
   - 사용자가 말한 메뉴가 정확히 목록에 없어도, 부분적으로 포함되는 메뉴가 있으면 그 메뉴로 진행하세요.
   - 예: "아메리카노 주문" → 목록에 "아메리카노"가 있으면 그 메뉴로 매칭
   - add_to_cart 호출 시 menu_name에는 반드시 DB에 등록된 정확한 메뉴 이름을 사용하세요.
   - 절대 "그 메뉴는 없습니다"라고 말하지 말고, 가장 유사한 메뉴를 찾아서 자연스럽게 진행하세요.
8. ★★★ 주문 대화 플로우 (매우 중요) ★★★:
   사용자가 메뉴를 주문할 때, 옵션 선택은 프론트엔드 UI에서 버튼으로 처리됩니다.
   따라서 AI는 텍스트로 옵션을 물어보지 말고, 즉시 add_to_cart를 호출하세요!
   
   A) 사용자가 옵션 정보 없이 주문한 경우 (예: "아메리카노 주문해줘"):
      - 간단한 안내 메시지와 함께 즉시 add_to_cart를 호출하세요.
      - options는 빈 리스트([])로 전달합니다.
      - 프론트엔드가 자동으로 옵션 선택 카드를 보여줍니다.
      - 예: add_to_cart(menu_name="아메리카노", quantity=1, options=[])
      - 텍스트: "아메리카노 주문이요! 옵션을 선택해주꼬북!" 정도로 짧게.
   
   B) 사용자가 옵션을 이미 말한 경우 (예: "아이스 아메리카노 라지로 주문해줘"):
      - 해당 옵션의 [id:숫자]를 위 메뉴 목록에서 찾아서 options에 넣어 add_to_cart를 호출하세요.
      - 예: Large[id:4], ICE[id:1]이면 → add_to_cart(menu_name="아메리카노", options=[4, 1])
      - 프론트엔드가 해당 옵션은 이미 체크된 상태로 옵션 카드를 보여줍니다.
      - 텍스트: "아이스 아메리카노 라지 사이즈! 추가 옵션이 있으면 선택해주꼬북!" 정도로 짧게.
   
   C) 옵션이 아예 없는 메뉴 (예: 소금빵):
      - 즉시 add_to_cart를 호출하세요. 프론트엔드가 바로 장바구니에 담습니다.
   
   ★ 절대 하지 말아야 할 것: "사이즈를 선택해주세요", "HOT과 ICE 중에 뭘로 드릴꼬북?" 등 옵션을 텍스트로 물어보는 것!
   ★ 옵션 선택은 프론트엔드 버튼 UI가 담당합니다. AI는 즉시 add_to_cart를 호출하면 됩니다.
{user_section}
10. ★★ 다국어 응답 규칙 (매우 중요) ★★:
   - 사용자가 메시지를 보낸 언어를 자동으로 감지하여, 반드시 같은 언어로 응답하세요.
   - 한국어 → 한국어로 응답 (기본 말투: ~꼬북, ~해북, ~어북)
   - English → Respond in English (ending with ~buk, ~gobuk like a cute turtle clerk)
     Example: "Welcome to Kkobugi Cafe gobuk! What can I get for you todaybuk?"
   - 日本語 → 日本語で返答 (語尾に〜ブク、〜コブクを付ける)
     例: "こんにちはブク！꼬부기カフェへようこそコブク！"
   - 中文 → 用中文回答 (句尾加上~布克、~咕布克)
     例: "欢迎来到小乌龟咖啡布克！请问想喝什么咕布克？"
   - 기타 언어도 동일한 원칙으로 해당 언어로 응답하며, 문장 끝에 거북이 캐릭터에 맞는 어미를 자연스럽게 붙이세요.
   - 단, 메뉴 이름은 항상 한국어 원본 그대로 사용하세요 (DB에 등록된 이름 기준). 필요 시 해당 언어로 간단한 설명을 덧붙여도 됩니다.
   - add_to_cart 호출 시 menu_name은 반드시 한국어 메뉴 이름을 사용하세요.
{cafe_info_section}
{favorites_section}
"""

# Gemini Tool 선언: add_to_cart에 options 추가
TOOL_DECLARATIONS = [
    types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name="add_to_cart",
            description="장바구니에 특정 메뉴를 옵션과 함께 담습니다.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "menu_name": types.Schema(type="STRING", description="메뉴 이름"),
                    "quantity": types.Schema(type="INTEGER", description="수량"),
                    "options": types.Schema(
                        type="ARRAY", 
                        items=types.Schema(type="INTEGER"),
                        description="선택한 옵션 아이템 ID 목록 (옵션이 없으면 빈 리스트)"
                    )
                },
                required=["menu_name"]
            )
        ),
        types.FunctionDeclaration(
            name="navigate_to",
            description="특정 페이지로 이동합니다.",
            parameters=types.Schema(
                type="OBJECT",
                properties={
                    "path": types.Schema(type="STRING", description="이동할 경로 (예: /menus, /cart, /mypage)")
                },
                required=["path"]
            )
        )
    ])
]

# add_favorites_to_cart 도구 추가
FAVORITES_TOOL = types.Tool(function_declarations=[
    types.FunctionDeclaration(
        name="add_favorites_to_cart",
        description="사용자의 즐겨찾기(찜) 목록에 있는 메뉴를 장바구니에 담습니다. 전체 또는 특정 메뉴만 선택 가능합니다.",
        parameters=types.Schema(
            type="OBJECT",
            properties={
                "menu_names": types.Schema(
                    type="ARRAY",
                    items=types.Schema(type="STRING"),
                    description="장바구니에 담을 즐겨찾기 메뉴 이름 목록 (한국어 메뉴 이름)"
                )
            },
            required=["menu_names"]
        )
    )
])

def get_tools(user_info: dict = None):
    """사용자 상태에 따라 사용 가능한 도구 목록을 반환합니다."""
    tools = list(TOOL_DECLARATIONS)
    if user_info and user_info.get('favorites'):
        tools.append(FAVORITES_TOOL)
    return tools

def chat(messages: List[dict], user_info: dict = None) -> dict:
    # 마지막 사용자 메시지 추출하여 지식 검색
    last_user_query = ""
    for m in reversed(messages):
        if m['role'] == 'user':
            last_user_query = m['parts'][0]['text']
            break
    
    knowledge_results = rag_service.query_knowledge(last_user_query)
    knowledge_context = "\n".join(knowledge_results) if knowledge_results else ""
    
    prompt = get_system_prompt(knowledge_context, user_info=user_info)
    
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=messages,
            config=types.GenerateContentConfig(
                system_instruction=prompt,
                thinking_config=ThinkingConfig(thinking_budget=1024),
                tools=get_tools(user_info)
            )
        )
        
        # Tool call 및 텍스트 처리 (thinking 파트 제외)
        tool_calls = []
        response_text = ""
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                # thinking 파트는 제외
                if getattr(part, 'thought', False):
                    continue
                if part.text:
                    response_text += part.text
                if part.function_call:
                    tool_calls.append({
                        "name": part.function_call.name,
                        "args": part.function_call.args
                    })
                    
        return {
            "content": response_text,
            "tool_calls": tool_calls
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"content": "오류가 발생했습니다북...", "tool_calls": []}

async def chat_stream(messages: List[dict], user_info: dict = None) -> AsyncGenerator[dict, None]:
    last_user_query = ""
    for m in reversed(messages):
        if m['role'] == 'user':
            last_user_query = m['parts'][0]['text']
            break
            
    knowledge_results = rag_service.query_knowledge(last_user_query)
    knowledge_context = "\n".join(knowledge_results) if knowledge_results else ""
    
    prompt = get_system_prompt(knowledge_context, user_info=user_info)
    
    try:
        response = await client.aio.models.generate_content_stream(
            model=MODEL_NAME,
            contents=messages,
            config=types.GenerateContentConfig(
                system_instruction=prompt,
                thinking_config=ThinkingConfig(thinking_budget=1024),
                tools=get_tools(user_info)
            )
        )
        
        async for chunk in response:
            chunk_data = {"content": "", "tool_calls": []}
            
            if chunk.candidates and chunk.candidates[0].content.parts:
                for part in chunk.candidates[0].content.parts:
                    # thinking 파트는 사용자에게 노출하지 않음
                    if getattr(part, 'thought', False):
                        continue
                    if part.text:
                        chunk_data["content"] += part.text
                    if part.function_call:
                        chunk_data["tool_calls"].append({
                            "name": part.function_call.name,
                            "args": part.function_call.args
                        })
            
            if chunk_data["content"] or chunk_data["tool_calls"]:
                yield chunk_data
    except Exception as e:
        import traceback
        traceback.print_exc()
        yield {"content": "스트리밍 중 오류 발생북...", "tool_calls": []}