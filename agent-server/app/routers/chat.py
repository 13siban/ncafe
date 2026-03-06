import json
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
from app.models.schemas import ChatRequest, Message
from app.services.gemini import chat, chat_stream

router = APIRouter()

def to_gemini_messages(messages: list[Message]) -> list[dict]:
    return [{"role": m.role, "parts": [{"text": m.content}]} for m in messages]

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    messages = to_gemini_messages(request.messages)
    
    if not request.stream:
        response_text = chat(messages)
        return {"content": response_text}
        
    async def stream_generator():
        for token in chat_stream(messages):
            yield {"data": json.dumps({"content": token}, ensure_ascii=False)}
        yield {"data": "[DONE]"}
        
    return EventSourceResponse(stream_generator())
