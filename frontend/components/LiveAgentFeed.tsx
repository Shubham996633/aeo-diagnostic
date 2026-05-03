"use client";

import { useMemo } from "react";
import clsx from "clsx";
import {
  Bot,
  Loader2,
  CheckCircle2,
  Layers,
  Tag,
  Trophy,
  Sparkles,
  Lightbulb,
  Circle,
} from "lucide-react";
import type { StreamEvent } from "@/lib/stream";

type PhaseStatus = "pending" | "active" | "done";

type PhaseModel = {
  id: string;
  title: string;
  subtitle?: string;
  status: PhaseStatus;
  icon: React.ReactNode;
  detail?: React.ReactNode;
  meta?: string;
};

const ENGINE_LABEL: Record<string, string> = {
  openai: "GPT-4o-mini",
  gemini: "Gemini 2.0",
};
const ENGINE_DOT: Record<string, string> = {
  openai: "bg-emerald-500",
  gemini: "bg-blue-500",
};

function statusIcon(status: PhaseStatus) {
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-win" />;
  if (status === "active") return <Loader2 className="h-4 w-4 animate-spin text-accent" />;
  return <Circle className="h-4 w-4 text-ink-300" />;
}

export default function LiveAgentFeed({ events }: { events: StreamEvent[] }) {
  const phases = useMemo(() => derivePhases(events), [events]);

  return (
    <div className="space-y-3">
      {phases.map((p, i) => (
        <PhaseBlock key={p.id} phase={p} index={i + 1} />
      ))}
    </div>
  );
}

function PhaseBlock({ phase, index }: { phase: PhaseModel; index: number }) {
  const ringByStatus =
    phase.status === "done"
      ? "border-l-win"
      : phase.status === "active"
      ? "border-l-accent"
      : "border-l-ink-200";
  const numberStyle =
    phase.status === "done"
      ? "bg-win text-white"
      : phase.status === "active"
      ? "bg-accent text-white"
      : "bg-ink-100 text-ink-400";

  return (
    <div
      className={clsx(
        "card border-l-4 transition",
        ringByStatus,
        phase.status === "active" && "ring-1 ring-accent-soft",
      )}
    >
      <div className="flex items-center gap-4 p-4">
        <div
          className={clsx(
            "grid h-9 w-9 place-items-center rounded-full font-mono text-sm font-semibold shrink-0",
            numberStyle,
          )}
        >
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <span className="opacity-70">{phase.icon}</span>
            <span>{phase.title}</span>
          </div>
          {phase.subtitle && (
            <div className="mt-0.5 text-xs text-ink-400">{phase.subtitle}</div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {phase.meta && (
            <span className="font-mono text-xs text-ink-400">{phase.meta}</span>
          )}
          {statusIcon(phase.status)}
        </div>
      </div>
      {phase.detail && phase.status !== "pending" && (
        <div className="px-4 pb-4 pl-[60px]">{phase.detail}</div>
      )}
    </div>
  );
}

function derivePhases(events: StreamEvent[]): PhaseModel[] {
  const has = (phase: StreamEvent["phase"]) => events.some((e) => e.phase === phase);
  const questions =
    (events.find((e) => e.phase === "questions_generated") as
      | Extract<StreamEvent, { phase: "questions_generated" }>
      | undefined)?.questions ?? [];
  const totalQ = questions.length;

  // Engine call tallies
  const engineDone = (engine: string) =>
    events.filter(
      (e) => e.phase === "engine_done" && (e as { engine: string }).engine === engine,
    ).length;
  const openaiDone = engineDone("openai");
  const geminiDone = engineDone("gemini");
  const allEngineDone = totalQ > 0 && openaiDone === totalQ && geminiDone === totalQ;

  // Mention extraction tallies
  const extractedEvents = events.filter(
    (e) => e.phase === "extracted",
  ) as Extract<StreamEvent, { phase: "extracted" }>[];
  const extractedCount = extractedEvents.length;
  const extractionTotal = totalQ * 2;
  const allExtracted = extractionTotal > 0 && extractedCount === extractionTotal;

  const aeoScore =
    (events.find((e) => e.phase === "scored") as
      | Extract<StreamEvent, { phase: "scored" }>
      | undefined)?.aeo_score;

  // Phase 1: questions
  const p1Status: PhaseStatus = totalQ > 0 ? "done" : has("questions_generating") ? "active" : "pending";

  // Phase 2: engines
  const p2Status: PhaseStatus =
    p1Status !== "done" ? "pending" : allEngineDone ? "done" : "active";

  // Phase 3: extraction
  const p3Status: PhaseStatus =
    p2Status !== "done" && !allExtracted
      ? extractedCount > 0 && totalQ > 0
        ? "active"
        : "pending"
      : allExtracted
      ? "done"
      : extractedCount > 0
      ? "active"
      : "pending";

  // Phase 4: score
  const p4Status: PhaseStatus = aeoScore !== undefined ? "done" : has("scoring") ? "active" : "pending";

  // Phase 5: recommendations
  const recommending = has("recommending");
  const done = has("done");
  const p5Status: PhaseStatus = done ? "done" : recommending ? "active" : "pending";

  // Aggregate brand pills (target last so it ranks first)
  const brandCount = new Map<string, { count: number; isTarget: boolean }>();
  for (const e of extractedEvents) {
    for (const m of e.mentions) {
      const cur = brandCount.get(m.brand) ?? { count: 0, isTarget: m.is_target };
      cur.count += 1;
      if (m.is_target) cur.isTarget = true;
      brandCount.set(m.brand, cur);
    }
  }
  const topBrands = Array.from(brandCount.entries())
    .sort((a, b) => Number(b[1].isTarget) - Number(a[1].isTarget) || b[1].count - a[1].count)
    .slice(0, 8);

  return [
    {
      id: "questions",
      title: "Generate buyer-intent questions",
      subtitle: "Gemini agent brainstorms what real shoppers ask",
      icon: <Bot className="h-4 w-4" />,
      status: p1Status,
      meta: totalQ ? `${totalQ} questions` : undefined,
      detail: totalQ ? <QuestionList questions={questions} /> : null,
    },
    {
      id: "engines",
      title: "Query LLM engines in parallel",
      subtitle: "Each question runs against GPT-4o-mini and Gemini 2.0",
      icon: <Layers className="h-4 w-4" />,
      status: p2Status,
      meta:
        totalQ > 0
          ? `${openaiDone + geminiDone}/${totalQ * 2}`
          : undefined,
      detail:
        totalQ > 0 ? (
          <EngineProgress
            totalQ={totalQ}
            openaiDone={openaiDone}
            geminiDone={geminiDone}
            events={events}
          />
        ) : null,
    },
    {
      id: "extract",
      title: "Extract brand mentions",
      subtitle: "Agent fuzzy-matches every brand named in each answer",
      icon: <Tag className="h-4 w-4" />,
      status: p3Status,
      meta: extractionTotal > 0 ? `${extractedCount}/${extractionTotal}` : undefined,
      detail:
        topBrands.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {topBrands.map(([brand, info]) => (
              <span
                key={brand}
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  info.isTarget
                    ? "bg-accent text-white"
                    : "bg-ink-100 text-ink-700",
                )}
              >
                {brand}
                <span className="ml-1.5 opacity-60">×{info.count}</span>
              </span>
            ))}
          </div>
        ) : null,
    },
    {
      id: "score",
      title: "Score visibility & share-of-voice",
      subtitle: "Composite score combines visibility, position, sentiment",
      icon: <Trophy className="h-4 w-4" />,
      status: p4Status,
      detail:
        aeoScore !== undefined ? (
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-accent">{aeoScore}</span>
            <span className="text-xs text-ink-400 uppercase tracking-wider">/ 100 AEO</span>
          </div>
        ) : null,
    },
    {
      id: "recommend",
      title: "Write strategic recommendations",
      subtitle: "Gemini agent synthesizes losing queries + competitor wins",
      icon: <Lightbulb className="h-4 w-4" />,
      status: p5Status,
      detail: done ? (
        <div className="flex items-center gap-2 text-sm text-win">
          <Sparkles className="h-4 w-4" />
          Report ready — opening…
        </div>
      ) : null,
    },
  ];
}

function QuestionList({ questions }: { questions: string[] }) {
  return (
    <ol className="space-y-1.5 text-sm text-ink-700">
      {questions.map((q, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="font-mono text-xs text-ink-400 mt-0.5 shrink-0">Q{i + 1}</span>
          <span>{q}</span>
        </li>
      ))}
    </ol>
  );
}

function EngineProgress({
  totalQ,
  openaiDone,
  geminiDone,
  events,
}: {
  totalQ: number;
  openaiDone: number;
  geminiDone: number;
  events: StreamEvent[];
}) {
  const recentAnswers = events
    .filter((e) => e.phase === "engine_done")
    .slice(-4)
    .reverse() as Extract<StreamEvent, { phase: "engine_done" }>[];

  return (
    <div className="space-y-3">
      <EngineRow
        label={ENGINE_LABEL.openai}
        dot={ENGINE_DOT.openai}
        done={openaiDone}
        total={totalQ}
      />
      <EngineRow
        label={ENGINE_LABEL.gemini}
        dot={ENGINE_DOT.gemini}
        done={geminiDone}
        total={totalQ}
      />
      {recentAnswers.length > 0 && (
        <div className="mt-2 space-y-1 text-xs text-ink-500">
          {recentAnswers.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={clsx("inline-block h-1.5 w-1.5 rounded-full", ENGINE_DOT[a.engine])} />
              <span>
                <b className="text-ink-700">{ENGINE_LABEL[a.engine]}</b> answered Q{a.qi + 1}
              </span>
              <span className="font-mono text-ink-400">{a.latency_ms}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EngineRow({
  label,
  dot,
  done,
  total,
}: {
  label: string;
  dot: string;
  done: number;
  total: number;
}) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-2 text-ink-700">
          <span className={clsx("inline-block h-2 w-2 rounded-full", dot)} />
          <b className="font-medium">{label}</b>
        </span>
        <span className="font-mono text-ink-400">
          {done}/{total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
        <div
          className={clsx("h-full rounded-full transition-all", dot)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
