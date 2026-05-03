"""Pure-Python scoring. No LLM calls — deterministic aggregation over QuestionResults."""
from collections import Counter

from app.models import QuestionResult, EngineScore, CompetitorShare


def compute_engine_scores(results: list[QuestionResult]) -> list[EngineScore]:
    by_engine: dict[str, dict] = {}
    for r in results:
        for engine, mentions in r.mentions_by_engine.items():
            agg = by_engine.setdefault(
                engine,
                {"questions": 0, "appeared": 0, "positions": [], "sentiments": Counter()},
            )
            agg["questions"] += 1
            target_mentions = [m for m in mentions if m.is_target]
            if target_mentions:
                agg["appeared"] += 1
                # use earliest position if multiple mentions of target
                positions = [m.position for m in target_mentions if m.position is not None]
                if positions:
                    agg["positions"].append(min(positions))
                # sentiment: take the first target mention's sentiment
                first = target_mentions[0]
                if first.sentiment:
                    agg["sentiments"][first.sentiment] += 1

    scores: list[EngineScore] = []
    for engine, agg in by_engine.items():
        visibility = (agg["appeared"] / agg["questions"] * 100) if agg["questions"] else 0.0
        avg_pos = (sum(agg["positions"]) / len(agg["positions"])) if agg["positions"] else None
        scores.append(
            EngineScore(
                engine=engine,
                visibility_pct=round(visibility, 1),
                avg_position=round(avg_pos, 2) if avg_pos is not None else None,
                sentiment_breakdown=dict(agg["sentiments"]),
            )
        )
    return scores


_BRAND_NOISE_TOKENS = {
    "the", "co", "inc", "company", "brand", "powder", "supplement", "supplements",
    "shake", "drink", "premium", "organic", "daily", "complete", "all-in-one",
    "superfood", "super", "food", "greens", "blend",
}


def _brand_signature(name: str) -> str:
    """Normalize a brand name for fuzzy dedup. Lowercases, strips noise tokens, keeps
    the first 1-2 distinctive tokens. 'Amazing Grass Green Superfood' and 'Amazing
    Grass' both collapse to 'amazing grass'."""
    tokens = [
        t for t in name.lower().replace("'", "").replace("-", " ").split()
        if t and t not in _BRAND_NOISE_TOKENS
    ]
    if not tokens:
        return name.lower().strip()
    return " ".join(tokens[:2])


def compute_share_of_voice(results: list[QuestionResult], target_brand: str) -> list[CompetitorShare]:
    raw: Counter[str] = Counter()
    for r in results:
        for mentions in r.mentions_by_engine.values():
            for m in mentions:
                key = target_brand if m.is_target else m.brand.strip()
                if key:
                    raw[key] += 1

    # Group raw names by signature; pick the most-frequent display label per group,
    # falling back to the shortest name on tie.
    groups: dict[str, dict] = {}
    target_sig = _brand_signature(target_brand)
    for name, count in raw.items():
        sig = target_sig if name == target_brand else _brand_signature(name)
        g = groups.setdefault(sig, {"count": 0, "labels": Counter()})
        g["count"] += count
        g["labels"][name] += count

    merged = []
    for sig, g in groups.items():
        if sig == target_sig:
            label = target_brand
        else:
            top_names = g["labels"].most_common()
            top_count = top_names[0][1]
            tied = [n for n, c in top_names if c == top_count]
            label = min(tied, key=len)
        merged.append((label, g["count"]))

    merged.sort(key=lambda x: x[1], reverse=True)
    total = sum(c for _, c in merged) or 1
    return [
        CompetitorShare(name=label, mention_count=count, share_pct=round(count / total * 100, 1))
        for label, count in merged
    ]


def compute_aeo_score(engine_scores: list[EngineScore]) -> int:
    """Composite 0-100. Visibility is the dominant factor; position bonus rewards being
    named first; sentiment bonus rewards positive framing."""
    if not engine_scores:
        return 0
    visibility = sum(s.visibility_pct for s in engine_scores) / len(engine_scores)

    positions = [s.avg_position for s in engine_scores if s.avg_position is not None]
    if positions:
        avg_pos = sum(positions) / len(positions)
        position_bonus = max(0, 10 - (avg_pos - 1) * 2)
    else:
        position_bonus = 0

    pos_count = sum(s.sentiment_breakdown.get("positive", 0) for s in engine_scores)
    neg_count = sum(s.sentiment_breakdown.get("negative", 0) for s in engine_scores)
    total_sent = pos_count + neg_count + sum(s.sentiment_breakdown.get("neutral", 0) for s in engine_scores)
    sentiment_bonus = ((pos_count - neg_count) / total_sent * 10) if total_sent else 0

    score = visibility * 0.8 + position_bonus + sentiment_bonus
    return max(0, min(100, round(score)))


def find_losing_questions(results: list[QuestionResult]) -> list[str]:
    """Questions where competitors were named but the target wasn't."""
    losing = []
    for r in results:
        all_mentions = [m for ml in r.mentions_by_engine.values() for m in ml]
        target_mentioned = any(m.is_target for m in all_mentions)
        competitor_mentioned = any(not m.is_target for m in all_mentions)
        if competitor_mentioned and not target_mentioned:
            losing.append(r.question)
    return losing
