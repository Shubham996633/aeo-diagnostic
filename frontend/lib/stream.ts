import type { DiagnoseRequest } from "./api";

export type StreamEvent =
  | { phase: "questions_generating" }
  | { phase: "questions_generated"; questions: string[] }
  | { phase: "engine_started"; qi: number; engine: "openai" | "gemini" }
  | {
      phase: "engine_done";
      qi: number;
      engine: "openai" | "gemini";
      answer: string;
      latency_ms: number;
      error: string | null;
    }
  | { phase: "extracting"; qi: number; engine: "openai" | "gemini" }
  | {
      phase: "extracted";
      qi: number;
      engine: "openai" | "gemini";
      mentions: { brand: string; is_target: boolean; position: number | null; sentiment: string | null }[];
    }
  | { phase: "scoring" }
  | { phase: "scored"; aeo_score: number; engine_scores: unknown[] }
  | { phase: "recommending" }
  | { phase: "done"; report_id: string }
  | { phase: "error"; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Streams agent activity events from the backend's SSE endpoint.
 * Uses fetch + ReadableStream so we can POST a JSON body (EventSource is GET-only).
 */
export async function streamDiagnose(
  req: DiagnoseRequest,
  onEvent: (ev: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_URL}/diagnose/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status} ${await res.text()}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const events = buf.split("\n\n");
    buf = events.pop() ?? "";
    for (const block of events) {
      const line = block.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      try {
        onEvent(JSON.parse(line.slice(6)) as StreamEvent);
      } catch {
        // ignore malformed event
      }
    }
  }
}
