from google import genai
from typing import Generator, Optional
from app.config import GEMINI_API_KEY, GEMINI_MODEL

client = genai.Client(api_key=GEMINI_API_KEY)

def chat(messages: list[dict], system_instruction: Optional[str] = None) -> str:
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=messages,
        config={
            "system_instruction": system_instruction
        } if system_instruction else None
    )
    return response.text

def chat_stream(messages: list[dict], system_instruction: Optional[str] = None) -> Generator[str, None, None]:
    response = client.models.generate_content_stream(
        model=GEMINI_MODEL,
        contents=messages,
        config={
            "system_instruction": system_instruction
        } if system_instruction else None
    )
    for chunk in response:
        if chunk.text:
            yield chunk.text
