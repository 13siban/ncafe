from google import genai
from google.genai import types
from typing import AsyncGenerator, Optional, Union
from app.config import GEMINI_API_KEY, GEMINI_MODEL
from app.services.tools import AGENT_TOOLS, execute_function


client = genai.Client(api_key=GEMINI_API_KEY)


def chat(messages: list[dict], system_instruction: Optional[str] = None) -> str:
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        tools=[AGENT_TOOLS],
    ) if system_instruction else types.GenerateContentConfig(
        tools=[AGENT_TOOLS],
    )

    # 대화 히스토리를 Gemini Content 형태로 변환
    contents = []
    for msg in messages:
        role = msg.get("role", "user")
        parts = msg.get("parts", [])
        if not parts and "text" in msg:
            parts = [{"text": msg["text"]}]
        contents.append(types.Content(
            role=role,
            parts=[types.Part.from_text(text=p["text"]) for p in parts if "text" in p]
        ))

    max_fc_loops = 5
    for _ in range(max_fc_loops):
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=config,
        )

        # Function Call 감지
        function_calls = []
        if response.candidates:
            for candidate in response.candidates:
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if part.function_call:
                            function_calls.append(part.function_call)

        if not function_calls:
            return response.text or ""

        # Function Call 실행 및 결과를 히스토리에 추가
        fc_parts = [types.Part(function_call=fc) for fc in function_calls]
        contents.append(types.Content(role="model", parts=fc_parts))

        fr_parts = []
        for fc in function_calls:
            result, _ = execute_function(fc)
            fr_parts.append(types.Part.from_function_response(
                name=fc.name,
                response=result,
            ))
        contents.append(types.Content(role="user", parts=fr_parts))

    return ""


async def chat_stream(
    messages: list[dict],
    system_instruction: Optional[str] = None
) -> AsyncGenerator[Union[str, dict], None]:
    """
    Gemini 스트리밍 + Function Calling 루프.
    - 텍스트 청크: str로 yield
    - 프론트엔드 액션: dict로 yield (스트림 마지막에)
    """
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        tools=[AGENT_TOOLS],
    ) if system_instruction else types.GenerateContentConfig(
        tools=[AGENT_TOOLS],
    )

    # 대화 히스토리를 Gemini Content 형태로 변환
    contents = []
    for msg in messages:
        role = msg.get("role", "user")
        parts = msg.get("parts", [])
        if not parts and "text" in msg:
            parts = [{"text": msg["text"]}]
        contents.append(types.Content(
            role=role,
            parts=[types.Part.from_text(text=p["text"]) for p in parts if "text" in p]
        ))

    action = None  # 프론트엔드에 전달할 액션 (있다면)
    max_fc_loops = 5  # Function Calling 무한 루프 방지
    accumulated_text = []  # FC 턴에서도 텍스트를 보존
    max_retries = 2  # Gemini 빈 응답 시 재시도 횟수

    try:
        for retry in range(max_retries + 1):
            action = None
            accumulated_text = []
            empty_response = False
            
            for _ in range(max_fc_loops):
                function_calls_in_turn = []
                text_buffer = []

                response = await client.aio.models.generate_content_stream(
                    model=GEMINI_MODEL,
                    contents=contents,
                    config=config,
                )

                async for chunk in response:
                    if chunk.text:
                        text_buffer.append(chunk.text)

                    if chunk.candidates:
                        for candidate in chunk.candidates:
                            if candidate.content and candidate.content.parts:
                                for part in candidate.content.parts:
                                    if part.function_call:
                                        function_calls_in_turn.append(part.function_call)

                if not function_calls_in_turn:
                    if not text_buffer and not accumulated_text:
                        # 텍스트도 FC도 없는 빈 응답 → 재시도
                        empty_response = True
                        break
                    # FC 없는 최종 턴 → 축적된 텍스트 + 이번 턴 텍스트를 한꺼번에 yield
                    for t in accumulated_text:
                        yield t
                    for t in text_buffer:
                        yield t
                    break

                # FC가 있는 턴 → 텍스트를 축적 (버리지 않음)
                accumulated_text.extend(text_buffer)
                
                fc_parts = [types.Part(function_call=fc) for fc in function_calls_in_turn]
                contents.append(types.Content(role="model", parts=fc_parts))

                fr_parts = []
                for fc in function_calls_in_turn:
                    result, fn_action = execute_function(fc)
                    if fn_action:
                        action = fn_action
                    fr_parts.append(types.Part.from_function_response(
                        name=fc.name,
                        response=result,
                    ))
                contents.append(types.Content(role="user", parts=fr_parts))

            if not empty_response:
                break
            # 빈 응답이면 재시도 (contents를 원래대로 유지하므로 그대로 다시 시도)

        if action:
            yield action

    except Exception as e:
        import traceback
        yield f"\n[서버 에러]: {str(e)}\n{traceback.format_exc()}"
