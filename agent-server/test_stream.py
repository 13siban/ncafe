import asyncio
from app.config import GEMINI_API_KEY
from google import genai

client = genai.Client(api_key=GEMINI_API_KEY)

async def test_aio_stream():
    print("Testing aio...", flush=True)
    res = await client.aio.models.generate_content_stream(model="gemini-2.5-flash", contents="hello")
    async for chunk in res:
        print(chunk.text, flush=True)

def test_sync_stream():
    print("Testing sync...", flush=True)
    res = client.models.generate_content_stream(model="gemini-2.5-flash", contents="hello")
    for chunk in res:
        print(chunk.text, flush=True)

if __name__ == "__main__":
    test_sync_stream()
    asyncio.run(test_aio_stream())
