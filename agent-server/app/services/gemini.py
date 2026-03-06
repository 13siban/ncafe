from google import genai
from typing import Generator
from app.config import GEMINI_API_KEY, GEMINI_MODEL

client = genai.Client(api_key=GEMINI_API_KEY)

def chat(messages: list[dict]) -> str:
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=messages
    )
    return response.text

def chat_stream(messages: list[dict]) -> Generator[str, None, None]:
    response = client.models.generate_content_stream(
        model=GEMINI_MODEL,
        contents=messages
    )
    for chunk in response:
        yield chunk.text
