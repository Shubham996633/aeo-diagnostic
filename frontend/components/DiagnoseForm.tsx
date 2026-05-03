"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { streamDiagnose, type StreamEvent } from "@/lib/stream";
import { PRESETS } from "@/lib/presets";
import { getSession } from "@/lib/session";
import LiveAgentFeed from "@/components/LiveAgentFeed";

export default function DiagnoseForm() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [questionCount, setQuestionCount] = useState(6);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(i: number) {
    const p = PRESETS[i];
    setBrand(p.brand);
    setCategory(p.category);
    setCompetitors(p.competitors.join(", "));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEvents([]);
    setRunning(true);

    try {
      const session = getSession();
      await streamDiagnose(
        {
          brand: brand.trim(),
          category: category.trim(),
          competitors: competitors
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
          question_count: questionCount,
          user_email: session?.email,
        },
        (ev) => {
          setEvents((prev) => [...prev, ev]);
          if (ev.phase === "done") {
            setTimeout(() => router.push(`/report/${ev.report_id}`), 800);
          }
          if (ev.phase === "error") {
            setError(ev.message);
            setRunning(false);
          }
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stream failed");
      setRunning(false);
    }
  }

  if (running || events.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-600">
            Live agent activity
          </h3>
          <span className="font-mono text-xs text-ink-400">{events.length} events</span>
        </div>
        <LiveAgentFeed events={events} />
        {error && (
          <div className="rounded-lg border border-lose/30 bg-lose/5 p-3 text-sm text-lose">
            {error}
            <button
              onClick={() => {
                setEvents([]);
                setError(null);
                setRunning(false);
              }}
              className="ml-3 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-8 space-y-5">
      <div>
        <label className="label">Try a sample</label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(i)}
              className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-accent-ring hover:text-accent transition"
            >
              <Wand2 className="mr-1 inline h-3 w-3" />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-ink-100" />

      <div>
        <label className="label">Brand name</label>
        <input
          className="input"
          placeholder="e.g. Athletic Greens"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">Product category / what shoppers want</label>
        <input
          className="input"
          placeholder="e.g. greens powder for daily nutrition"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="label">Known competitors (comma-separated, optional)</label>
        <input
          className="input"
          placeholder="e.g. Bloom Greens, Huel Daily Greens, Ka'Chava"
          value={competitors}
          onChange={(e) => setCompetitors(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-ink-400">
          Leave blank to auto-detect any brands the LLMs mention.
        </p>
      </div>

      <div>
        <label className="label">Number of buyer questions</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={4}
            max={12}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="flex-1 accent-ink-900"
          />
          <span className="w-8 text-right font-mono text-sm">{questionCount}</span>
        </div>
        <p className="mt-1.5 text-xs text-ink-400">
          {questionCount * 2} engine queries + {questionCount * 2} mention extractions. ~{Math.ceil(questionCount * 1.6)}s.
        </p>
      </div>

      <button type="submit" className="btn-primary w-full">
        <Sparkles className="mr-2 h-4 w-4" />
        Run diagnostic
      </button>

      {error && (
        <div className="rounded-lg border border-lose/30 bg-lose/5 p-3 text-sm text-lose">
          {error}
        </div>
      )}
    </form>
  );
}
