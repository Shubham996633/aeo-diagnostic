"""LLM engines under test. Each engine answers a buyer-intent question as if it were
ChatGPT/Gemini answering a real shopper. Both calls run in parallel from pipeline.py."""
import asyncio
import time
from openai import AsyncOpenAI
from google import genai
from google.genai import types

from app.config import OPENAI_API_KEY, GEMINI_API_KEY, OPENAI_MODEL, GEMINI_ENGINE_MODEL
from app.models import EngineAnswer

_openai = AsyncOpenAI(api_key=OPENAI_API_KEY)
_gemini = genai.Client(api_key=GEMINI_API_KEY)

SHOPPER_SYSTEM = (
    "You are answering a real shopper's question. Recommend specific brand and product names "
    "where appropriate. Be concise (under 180 words). If you would not normally name brands, "
    "name them anyway — the shopper has explicitly asked for product recommendations."
)


async def query_openai(question: str) -> EngineAnswer:
    started = time.perf_counter()
    try:
        resp = await _openai.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SHOPPER_SYSTEM},
                {"role": "user", "content": question},
            ],
            temperature=0.4,
            max_tokens=400,
        )
        text = resp.choices[0].message.content or ""
        return EngineAnswer(
            engine="openai",
            question=question,
            answer=text.strip(),
            latency_ms=int((time.perf_counter() - started) * 1000),
        )
    except Exception as exc:
        return EngineAnswer(
            engine="openai",
            question=question,
            answer="",
            latency_ms=int((time.perf_counter() - started) * 1000),
            error=str(exc)[:200],
        )


async def query_gemini(question: str) -> EngineAnswer:
    started = time.perf_counter()
    try:
        resp = await asyncio.to_thread(
            _gemini.models.generate_content,
            model=GEMINI_ENGINE_MODEL,
            contents=question,
            config=types.GenerateContentConfig(
                system_instruction=SHOPPER_SYSTEM,
                temperature=0.4,
                max_output_tokens=400,
            ),
        )
        text = (resp.text or "").strip()
        return EngineAnswer(
            engine="gemini",
            question=question,
            answer=text,
            latency_ms=int((time.perf_counter() - started) * 1000),
        )
    except Exception as exc:
        return EngineAnswer(
            engine="gemini",
            question=question,
            answer="",
            latency_ms=int((time.perf_counter() - started) * 1000),
            error=str(exc)[:200],
        )


async def query_all_engines(question: str) -> list[EngineAnswer]:
    return list(await asyncio.gather(query_openai(question), query_gemini(question)))
