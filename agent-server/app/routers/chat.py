import json
from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse
from app.models.schemas import ChatRequest, Message
from app.services.gemini import chat, chat_stream
from app.services.vector import get_vector_service, VectorService

router = APIRouter()

def to_gemini_messages(messages: list[Message]) -> list[dict]:
    # Convert Message schema to Gemini content list
    return [{"role": "user" if m.role == "user" else "model", 
             "parts": [{"text": m.content}]} for m in messages]

@router.post("/chat")
async def chat_endpoint(request: ChatRequest, vector_service: VectorService = Depends(get_vector_service)):
    # 1. RAG: Search context if the last message is from user
    context = ""
    latest_user_message = next((m.content for m in reversed(request.messages) if m.role == "user"), None)
    
    if latest_user_message:
        # Search for similar documents in vector DB
        search_results = vector_service.search_similar(latest_user_message, limit=3, threshold=0.1)
        if search_results:
            context_texts = [f"Source: {res['filename']}\nContent: {res['content']}" for res in search_results]
            context = "\n\n".join(context_texts)

    # 2. Add System Instruction with context
    system_instruction = (
        "당신은 'ncafe'의 친절한 AI 어시스턴트입니다. 항상 한국어로 대답하세요. "
        "제공된 문맥(context)을 사용하여 사용자의 질문에 정확하게 답변하세요. "
        "문맥에 없는 정보라면 친절하게 응대하되, 카페에 관한 사실을 꾸며내지 마세요.\n\n"
        "도구 사용 규칙:\n"
        "- '보여줘', '이동해줘', '가줘' 등 페이지를 보고 싶다는 요청 → navigate_to_page 사용\n"
        "  - home: 홈페이지, menu_list: 메뉴 목록, cart: 장바구니, order_history: 주문 내역, login: 로그인, about: 소개\n"
        "- 특정 메뉴 상세 페이지로 이동 요청 → navigate_to_menu_detail 사용 (영문 이름 슬러그)\n"
        "- '담아줘', '추가해줘' 등 장바구니에 담으라는 요청 → add_to_cart 사용 (영문 이름 슬러그)\n"
        "- '추천해줘', '뭐가 있어?' 등 정보를 대화로 원할 때 → 도구 사용 없이 텍스트로 답변\n"
        "도구를 사용할 때는 반드시 메뉴의 영문 이름(engName)을 소문자 하이픈 형식 슬러그로 변환하세요."
    )
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
