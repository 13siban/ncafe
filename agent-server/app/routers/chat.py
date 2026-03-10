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
        "You are an friendly AI assistant for 'ncafe'. "
        "Use the following provided context to answer the user's questions accurately. "
        "If the information is not in the context, be helpful but don't invent cafe-specific facts."
    )
    if context:
        system_instruction += f"\n\n[Context from Cafe Knowledge Base]\n{context}"

    # 3. Convert messages for Gemini
    gemini_messages = to_gemini_messages(request.messages)
    
    if not request.stream:
        # Note: We'll modify gemini.py next to accept system_instruction
        response_text = chat(gemini_messages, system_instruction=system_instruction)
        return {"content": response_text}
        
    async def stream_generator():
        # Note: We'll modify gemini.py next to accept system_instruction
        for token in chat_stream(gemini_messages, system_instruction=system_instruction):
            yield {"data": json.dumps({"content": token}, ensure_ascii=False)}
        yield {"data": "[DONE]"}
        
    return EventSourceResponse(stream_generator())
