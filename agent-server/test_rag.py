import asyncio
from app.services.vector import get_vector_service

async def test():
    service = get_vector_service()
    res = service.search_similar("아메리카노 주문하고싶어", limit=3)
    for r in res:
        print(f"File: {r['filename']}")
        print(f"Content:\n{r['content']}")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(test())
