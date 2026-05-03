export type DiagnoseRequest = {
  brand: string;
  category: string;
  competitors: string[];
  question_count: number;
  user_email?: string;
};

export type ReportSummary = {
  id: string;
  brand: string;
  category: string;
  aeo_score: number;
  created_at: string;
};

export type EngineAnswer = {
  engine: "openai" | "gemini";
  question: string;
  answer: string;
  latency_ms: number;
  error: string | null;
};

export type BrandMention = {
  brand: string;
  is_target: boolean;
  position: number | null;
  sentiment: "positive" | "neutral" | "negative" | null;
};

export type QuestionResult = {
  question: string;
  engine_answers: EngineAnswer[];
  mentions_by_engine: Record<string, BrandMention[]>;
};

export type EngineScore = {
  engine: string;
  visibility_pct: number;
  avg_position: number | null;
  sentiment_breakdown: Record<string, number>;
};

export type CompetitorShare = {
  name: string;
  mention_count: number;
  share_pct: number;
};

export type Recommendation = {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
};

export type DiagnoseReport = {
  id: string;
  brand: string;
  category: string;
  competitors: string[];
  questions: string[];
  results: QuestionResult[];
  aeo_score: number;
  engine_scores: EngineScore[];
  share_of_voice: CompetitorShare[];
  losing_questions: string[];
  recommendations: Recommendation[];
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function postDiagnose(req: DiagnoseRequest): Promise<DiagnoseReport> {
  const res = await fetch(`${API_URL}/diagnose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Diagnose failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function getReport(id: string): Promise<DiagnoseReport> {
  const res = await fetch(`${API_URL}/reports/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Report not found: ${res.status}`);
  return res.json();
}

export async function listReports(userEmail?: string): Promise<ReportSummary[]> {
  const url = userEmail
    ? `${API_URL}/reports?user_email=${encodeURIComponent(userEmail)}`
    : `${API_URL}/reports`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function deleteReport(id: string, userEmail?: string): Promise<void> {
  const url = userEmail
    ? `${API_URL}/reports/${id}?user_email=${encodeURIComponent(userEmail)}`
    : `${API_URL}/reports/${id}`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { detail?: string }).detail || `Delete failed: ${res.status}`);
  }
}
