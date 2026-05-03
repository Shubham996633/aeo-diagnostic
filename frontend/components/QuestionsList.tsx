"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { QuestionResult } from "@/lib/api";
import clsx from "clsx";

const ENGINE_LABEL: Record<string, string> = {
  openai: "GPT-4o-mini",
  gemini: "Gemini 2.0",
};

export default function QuestionsList({
  results,
  losingQuestions,
  targetBrand,
}: {
  results: QuestionResult[];
  losingQuestions: string[];
  targetBrand: string;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const losingSet = new Set(losingQuestions);

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-semibold tracking-tight">Per-question results</h3>
        <span className="text-xs text-ink-400">
          {losingQuestions.length} where {targetBrand} didn't appear
        </span>
      </div>
      <div className="divide-y divide-ink-100">
        {results.map((r, i) => {
          const isLosing = losingSet.has(r.question);
          const targetMentioned = Object.values(r.mentions_by_engine).some((ml) =>
            ml.some((m) => m.is_target),
          );
          return (
            <div key={i}>
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center gap-3 py-3 text-left hover:bg-ink-50/50 -mx-2 px-2 rounded-lg transition"
              >
                <span
                  className={clsx(
                    "shrink-0 grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold",
                    targetMentioned ? "bg-win/15 text-win" : "bg-lose/15 text-lose",
                  )}
                >
                  {targetMentioned ? "✓" : "✕"}
                </span>
                <span className="flex-1 text-sm text-ink-800">{r.question}</span>
                {isLosing && (
                  <span className="rounded-full bg-lose/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-lose">
                    losing
                  </span>
                )}
                <ChevronDown
                  className={clsx(
                    "h-4 w-4 text-ink-400 transition",
                    expanded === i && "rotate-180",
                  )}
                />
              </button>
              {expanded === i && (
                <div className="pb-4 space-y-3">
                  {r.engine_answers.map((a) => {
                    const mentions = r.mentions_by_engine[a.engine] ?? [];
                    return (
                      <div key={a.engine} className="rounded-lg bg-ink-50/70 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-ink-600">
                            {ENGINE_LABEL[a.engine] ?? a.engine}
                          </span>
                          <span className="font-mono text-[10px] text-ink-400">
                            {a.latency_ms}ms
                          </span>
                        </div>
                        <div className="prose-answer text-sm text-ink-800">
                          {a.error ? (
                            <span className="text-lose">Error: {a.error}</span>
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.answer}</ReactMarkdown>
                          )}
                        </div>
                        {mentions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {mentions.map((m, mi) => (
                              <span
                                key={mi}
                                className={clsx(
                                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                                  m.is_target
                                    ? "bg-accent text-white"
                                    : "bg-white border border-ink-200 text-ink-600",
                                )}
                              >
                                {m.brand} {m.position && `#${m.position}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
