import json
from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse
from app.models.schemas import ChatRequest, Message
from app.services.gemini import chat, chat_stream
from app.services.vector import get_vector_service, VectorService
from app.services.tools import set_context

router = APIRouter()

def to_gemini_messages(messages: list[Message]) -> list[dict]:
    # Convert Message schema to Gemini content list
    return [{"role": "user" if m.role == "user" else "model", 
             "parts": [{"text": m.content}]} for m in messages]

@router.post("/chat")
async def chat_endpoint(request: ChatRequest, vector_service: VectorService = Depends(get_vector_service)):
    # 0. Set context for tool execution (userId)
    set_context(user_id=request.userId)

    # 1. RAG: Search context if the last message is from user
    context = ""
    latest_user_message = next((m.content for m in reversed(request.messages) if m.role == "user"), None)
    
    if latest_user_message:
        # Search for similar documents in vector DB
        search_results = vector_service.search_similar(latest_user_message, limit=3, threshold=0.1)
        if search_results:
            context_texts = [f"Source: {res['filename']}\nContent: {res['content']}" for res in search_results]
            context = "\n\n".join(context_texts)

    # 2. Build System Instruction
    system_instruction = (
        "당신은 'ncafe'의 친절한 AI 어시스턴트입니다. 항상 한국어로 대답하세요. "
        "제공된 문맥(context)을 사용하여 사용자의 질문에 정확하게 답변하세요. "
        "문맥에 없는 정보라면 친절하게 응대하되, 카페에 관한 사실을 꾸며내지 마세요.\n"
        "중요: 도구가 반환한 데이터에 포함되지 않은 수치나 정보를 절대 지어내거나 추측하지 마세요. "
        "도구 결과에 있는 데이터만 사용하여 답변하세요.\n\n"
        "도구 사용 규칙:\n"
        "- '보여줘', '이동해줘', '가줘' 등 페이지를 보고 싶다는 요청 → navigate_to_page 사용\n"
        "  - home: 홈페이지, menu_list: 메뉴 목록, cart: 장바구니, order_history: 주문 내역, login: 로그인, about: 소개\n"
        "- 특정 메뉴 상세 페이지로 이동 요청 → navigate_to_menu_detail 사용 (문맥의 '카페 메뉴 및 영문 슬러그 안내'에서 영문 슬러그를 찾으세요)\n"
        "- '담아줘', '추가해줘', '주문할게', '주문하고싶어', '시켜줘', '마시고싶어', '먹고싶어', '줘' 등 특정 메뉴를 원할 때 → 즉시 add_to_cart 사용. 단, 문맥(Context)에 포함된 '카페 메뉴 및 영문 슬러그 안내'에서 사용자가 요청한 메뉴의 영문 슬러그를 찾아 반드시 `slug` 파라미터로 전달하세요.\n"
        "- 메뉴 추천 시 → show_menu_cards 사용하여 카드 형태로 추천 메뉴를 보여주세요\n"
        "- '내 포인트', '내 등급', '내 정보' 등 개인정보 요청 → get_my_info 사용\n"
        "- '대기 시간', '얼마나 걸려', '내 순번' 등 → get_queue_status 사용\n"
        "- '이거랑 어울리는', '같이 먹을', '페어링' 등 → recommend_pairing 사용\n"
        "- '두유로 바꿀 수 있는', '샷추가 가능한', '카페인 없는', '커피가 아닌' 등 필터링 → search_menus_by_filter 사용\n"
        "- '다시 주문', '저번에 먹었던 거', '리오더' 등 → reorder_last 사용\n"
        "- '인기 메뉴', '뭐가 잘 나가', '베스트' 등 → get_popular_menus 사용\n"
        "- '내 주문 상태', '준비됐어?', '몇 번 주문' 등 → check_order_status 사용\n"
        "- '얼마야', '가격 알려줘', '합계' 등 → calculate_price 사용\n"
        "- '추천해줘', '뭐가 있어?' 등 정보를 대화로 원할 때 → 도구 사용 없이 텍스트로 답변\n"
        "도구를 사용할 때는 반드시 메뉴의 영문 이름(engName)을 소문자 하이픈 형식 슬러그로 변환하세요."
    )

    # 로그인 상태 표시
    if request.userId:
        system_instruction += f"\n\n[로그인 상태]: 사용자가 로그인되어 있습니다. (userId: {request.userId})"
    else:
        system_instruction += "\n\n[로그인 상태]: 비로그인 사용자입니다. 개인정보 조회, 재주문 등 기능은 로그인이 필요합니다."

    # 장바구니 컨텍스트
    if request.cartSummary:
        system_instruction += f"\n[현재 장바구니]: {request.cartSummary}"

    if context:
        system_instruction += f"\n\n[Context from Cafe Knowledge Base]\n{context}"

    # 3. Convert messages for Gemini
    gemini_messages = to_gemini_messages(request.messages)
    
    if not request.stream:
        response_text = chat(gemini_messages, system_instruction=system_instruction)
        return {"content": response_text}
        
    async def stream_generator():
        action = None
        async for chunk in chat_stream(gemini_messages, system_instruction=system_instruction):
            if isinstance(chunk, dict):
                # dict → 프론트엔드 액션 (나중에 전송)
                action = chunk
            elif chunk:
                # str → 텍스트 청크 (즉시 SSE 전송)
                yield {"data": json.dumps({"content": chunk}, ensure_ascii=False)}

        # 텍스트 이후에 액션 전송
        if action:
            yield {"data": json.dumps(action, ensure_ascii=False)}
        yield {"data": "[DONE]"}
        
    return EventSourceResponse(stream_generator())
