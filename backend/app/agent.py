"""Gemini agent — drives the smart parts of the diagnostic:
1. Generate buyer-intent questions a real shopper would ask
2. Extract brand mentions (with fuzzy matching) from each engine's answer
3. Write strategic recommendations from the aggregated results

The agent uses structured-output JSON so we get deterministic, typed results
instead of fragile string parsing."""
import asyncio
import json
from google import genai
from google.genai import types

from app.config import GEMINI_API_KEY, GEMINI_AGENT_MODEL
from app.models import BrandMention, Recommendation

_client = genai.Client(api_key=GEMINI_API_KEY)


def _json_config(schema: dict, system_instruction: str, temperature: float = 0.3) -> types.GenerateContentConfig:
    return types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type="application/json",
        response_schema=schema,
        temperature=temperature,
    )


async def generate_buyer_questions(brand: str, category: str, count: int = 10) -> list[str]:
    """Brainstorm questions a real shopper would type into ChatGPT/Gemini when researching this category."""
    schema = {
        "type": "object",
        "properties": {
            "questions": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": count,
                "maxItems": count,
            }
        },
        "required": ["questions"],
    }
    prompt = (
        f"Generate exactly {count} distinct buyer-intent questions a real shopper would type into "
        f"ChatGPT or Gemini when researching '{category}'. Mix question types: best-of, comparison, "
        f"use-case-specific, budget-driven, and 'is X worth it'. Do NOT mention the brand '{brand}' "
        f"in any question — questions should be neutral so we can measure whether the brand "
        f"organically appears in answers. Avoid generic filler like 'what is X'."
    )
    resp = await asyncio.to_thread(
        _client.models.generate_content,
        model=GEMINI_AGENT_MODEL,
        contents=prompt,
        config=_json_config(
            schema,
            "You are a market researcher who knows how shoppers actually search for products.",
            temperature=0.7,
        ),
    )
    data = json.loads(resp.text)
    return data["questions"][:count]


async def extract_brand_mentions(
    answer_text: str, target_brand: str, competitors: list[str]
) -> list[BrandMention]:
    """Find target + competitor mentions in an LLM answer. Uses fuzzy matching so that
    'ZenMag' matches 'Zen Magnesium' and 'Athletic Greens' matches 'AG1'."""
    if not answer_text.strip():
        return []
    schema = {
        "type": "object",
        "properties": {
            "mentions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "brand": {"type": "string"},
                        "is_target": {"type": "boolean"},
                        "position": {"type": "integer"},
                        "sentiment": {"type": "string", "enum": ["positive", "neutral", "negative"]},
                    },
                    "required": ["brand", "is_target", "position", "sentiment"],
                },
            }
        },
        "required": ["mentions"],
    }
    competitor_list = ", ".join(competitors) if competitors else "(none provided — find any other brands mentioned)"
    prompt = (
        f"Target brand: {target_brand}\n"
        f"Known competitors: {competitor_list}\n\n"
        f"Answer text:\n---\n{answer_text}\n---\n\n"
        f"List every product brand mentioned. For each: set is_target=true ONLY for {target_brand} "
        f"(use fuzzy matching — 'AG1' = 'Athletic Greens', 'ZenMag' = 'Zen Magnesium'). "
        f"position is the 1-indexed order brand first appears. sentiment is the framing in this "
        f"specific answer (positive=recommended/praised, negative=warned-against, neutral=mentioned). "
        f"Skip generic terms like 'magnesium' that aren't brand names."
    )
    try:
        resp = await asyncio.to_thread(
            _client.models.generate_content,
            model=GEMINI_AGENT_MODEL,
            contents=prompt,
            config=_json_config(schema, "You extract brand mentions from product recommendation text."),
        )
        data = json.loads(resp.text)
        return [BrandMention(**m) for m in data.get("mentions", [])]
    except Exception:
        return []


async def write_recommendations(
    brand: str,
    category: str,
    aeo_score: int,
    engine_scores: list[dict],
    losing_questions: list[str],
    top_competitors: list[str],
) -> list[Recommendation]:
    """Write 3 actionable recommendations to improve AEO score."""
    schema = {
        "type": "object",
        "properties": {
            "recommendations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "detail": {"type": "string"},
                        "priority": {"type": "string", "enum": ["high", "medium", "low"]},
                    },
                    "required": ["title", "detail", "priority"],
                },
                "minItems": 3,
                "maxItems": 3,
            }
        },
        "required": ["recommendations"],
    }
    prompt = (
        f"Brand: {brand}\nCategory: {category}\nAEO score: {aeo_score}/100\n"
        f"Engine breakdown: {json.dumps(engine_scores)}\n"
        f"Top competitors winning visibility: {', '.join(top_competitors[:3]) or 'none'}\n"
        f"Sample losing questions:\n- " + "\n- ".join(losing_questions[:5]) + "\n\n"
        f"Write exactly 3 actionable recommendations to improve how this brand surfaces in "
        f"AI-generated shopper answers (AEO). Each title under 60 chars; each detail 2 sentences "
        f"with concrete tactics (content topics to publish, comparison pages to write, review "
        f"placements to pursue). Order priority high→low."
    )
    resp = await asyncio.to_thread(
        _client.models.generate_content,
        model=GEMINI_AGENT_MODEL,
        contents=prompt,
        config=_json_config(
            schema,
            "You are an Answer Engine Optimization (AEO) strategist advising consumer brands.",
            temperature=0.5,
        ),
    )
    data = json.loads(resp.text)
    return [Recommendation(**r) for r in data["recommendations"]]
