import asyncio
from app.services.vector import get_vector_service
from app.models.schemas import Message

async def test():
    user_msg = "아메리카노 주문하고싶어"
    service = get_vector_service()
    search_results = service.search_similar(user_msg, limit=3, threshold=0.1)
    context = ""
    if search_results:
        context_texts = [f"Source: {res['filename']}\nContent: {res['content']}" for res in search_results]
        context = "\n\n".join(context_texts)
    
    print("CONTEXT:")
    print(context)

if __name__ == "__main__":
    asyncio.run(test())
