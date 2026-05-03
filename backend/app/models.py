from typing import Literal
from pydantic import BaseModel, Field


class DiagnoseRequest(BaseModel):
    brand: str = Field(..., min_length=1, max_length=120)
    category: str = Field(..., min_length=2, max_length=200)
    competitors: list[str] = Field(default_factory=list, max_length=8)
    question_count: int = Field(default=10, ge=4, le=15)
    user_email: str | None = Field(default=None, max_length=200)


class EngineAnswer(BaseModel):
    engine: Literal["openai", "gemini"]
    question: str
    answer: str
    latency_ms: int
    error: str | None = None


class BrandMention(BaseModel):
    brand: str
    is_target: bool
    position: int | None  # 1-indexed order within the answer; None if not mentioned
    sentiment: Literal["positive", "neutral", "negative"] | None = None


class QuestionResult(BaseModel):
    question: str
    engine_answers: list[EngineAnswer]
    mentions_by_engine: dict[str, list[BrandMention]]


class EngineScore(BaseModel):
    engine: str
    visibility_pct: float  # % of questions where target appeared
    avg_position: float | None  # avg position when mentioned (lower = better)
    sentiment_breakdown: dict[str, int]  # {positive: 4, neutral: 2, negative: 0}


class CompetitorShare(BaseModel):
    name: str
    mention_count: int
    share_pct: float


class Recommendation(BaseModel):
    title: str
    detail: str
    priority: Literal["high", "medium", "low"]


class DiagnoseReport(BaseModel):
    id: str
    brand: str
    category: str
    competitors: list[str]
    questions: list[str]
    results: list[QuestionResult]
    aeo_score: int  # 0-100
    engine_scores: list[EngineScore]
    share_of_voice: list[CompetitorShare]
    losing_questions: list[str]  # questions where target lost to competitors
    recommendations: list[Recommendation]
    created_at: str
