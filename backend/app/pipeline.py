"""End-to-end pipeline. Two flavors:

  run_diagnostic(req) -> DiagnoseReport
      Synchronous-style call; runs the whole flow and returns the final report.

  stream_diagnostic(req) -> async generator of dicts
      Yields events as the agent works so the UI can render a live activity feed:
        questions_generating → questions_generated → engine_started →
        engine_done → extracting → extracted → (repeat) →
        scoring → scored → recommending → done
"""
import asyncio
import uuid
from datetime import datetime, timezone
from typing import AsyncIterator

from app.agent import generate_buyer_questions, extract_brand_mentions, write_recommendations
from app.engines import query_openai, query_gemini
from app.models import DiagnoseRequest, DiagnoseReport, QuestionResult, EngineAnswer, BrandMention
from app.scoring import (
    compute_engine_scores,
    compute_share_of_voice,
    compute_aeo_score,
    find_losing_questions,
)
from app.storage import save_report


async def _query_one(engine_name: str, question: str) -> EngineAnswer:
    return await (query_openai(question) if engine_name == "openai" else query_gemini(question))


async def _process_question(
    qi: int, question: str, brand: str, competitors: list[str], emit
) -> QuestionResult:
    answers: dict[str, EngineAnswer] = {}
    mentions: dict[str, list[BrandMention]] = {}

    async def run_engine(name: str):
        await emit({"phase": "engine_started", "qi": qi, "engine": name})
        ans = await _query_one(name, question)
        answers[name] = ans
        await emit(
            {
                "phase": "engine_done",
                "qi": qi,
                "engine": name,
                "answer": ans.answer,
                "latency_ms": ans.latency_ms,
                "error": ans.error,
            }
        )
        await emit({"phase": "extracting", "qi": qi, "engine": name})
        ml = (
            await extract_brand_mentions(ans.answer, brand, competitors)
            if not ans.error
            else []
        )
        mentions[name] = ml
        await emit(
            {
                "phase": "extracted",
                "qi": qi,
                "engine": name,
                "mentions": [m.model_dump() for m in ml],
            }
        )

    await asyncio.gather(run_engine("openai"), run_engine("gemini"))

    return QuestionResult(
        question=question,
        engine_answers=[answers["openai"], answers["gemini"]],
        mentions_by_engine=mentions,
    )


async def stream_diagnostic(req: DiagnoseRequest) -> AsyncIterator[dict]:
    queue: asyncio.Queue = asyncio.Queue()
    SENTINEL = object()

    async def emit(event: dict):
        await queue.put(event)

    async def producer():
        try:
            await emit({"phase": "questions_generating"})
            questions = await generate_buyer_questions(
                req.brand, req.category, req.question_count
            )
            await emit({"phase": "questions_generated", "questions": questions})

            results = await asyncio.gather(
                *(
                    _process_question(i, q, req.brand, req.competitors, emit)
                    for i, q in enumerate(questions)
                )
            )

            await emit({"phase": "scoring"})
            engine_scores = compute_engine_scores(list(results))
            share_of_voice = compute_share_of_voice(list(results), req.brand)
            aeo_score = compute_aeo_score(engine_scores)
            losing = find_losing_questions(list(results))
            await emit(
                {
                    "phase": "scored",
                    "aeo_score": aeo_score,
                    "engine_scores": [s.model_dump() for s in engine_scores],
                }
            )

            await emit({"phase": "recommending"})
            top_competitors = [s.name for s in share_of_voice if s.name != req.brand][:3]
            recommendations = await write_recommendations(
                brand=req.brand,
                category=req.category,
                aeo_score=aeo_score,
                engine_scores=[s.model_dump() for s in engine_scores],
                losing_questions=losing,
                top_competitors=top_competitors,
            )

            report = DiagnoseReport(
                id=uuid.uuid4().hex[:12],
                brand=req.brand,
                category=req.category,
                competitors=req.competitors,
                questions=questions,
                results=list(results),
                aeo_score=aeo_score,
                engine_scores=engine_scores,
                share_of_voice=share_of_voice,
                losing_questions=losing,
                recommendations=recommendations,
                created_at=datetime.now(timezone.utc).isoformat(),
            )
            await save_report(report, req.user_email)

            await emit({"phase": "done", "report_id": report.id})
        except Exception as exc:  # surface to client
            await emit({"phase": "error", "message": str(exc)[:300]})
        finally:
            await queue.put(SENTINEL)

    asyncio.create_task(producer())

    while True:
        ev = await queue.get()
        if ev is SENTINEL:
            return
        yield ev


async def run_diagnostic(req: DiagnoseRequest) -> DiagnoseReport:
    """Non-streaming flavor — drains the stream and returns the final report."""
    last_id: str | None = None
    err: str | None = None
    async for ev in stream_diagnostic(req):
        if ev["phase"] == "done":
            last_id = ev["report_id"]
        elif ev["phase"] == "error":
            err = ev["message"]
    if err:
        raise RuntimeError(err)
    if not last_id:
        raise RuntimeError("Diagnostic finished without a report id")
    from app.storage import load_report
    report = await load_report(last_id)
    if not report:
        raise RuntimeError("Report missing after save")
    return report
