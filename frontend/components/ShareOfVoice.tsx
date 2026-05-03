"use client";

import type { CompetitorShare } from "@/lib/api";

const PALETTE = ["#7c3aed", "#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#a855f7", "#64748b", "#fb7185"];

export default function ShareOfVoice({
  shares,
  targetBrand,
}: {
  shares: CompetitorShare[];
  targetBrand: string;
}) {
  const top = shares.slice(0, 7);
  const max = top[0]?.share_pct ?? 100;

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-semibold tracking-tight">Share of voice</h3>
        <span className="text-xs text-ink-400">Across all engine answers</span>
      </div>
      <div className="space-y-3">
        {top.length === 0 && (
          <p className="text-sm text-ink-400">No brand mentions detected.</p>
        )}
        {top.map((s, i) => {
          const isTarget = s.name === targetBrand;
          const width = max > 0 ? (s.share_pct / max) * 100 : 0;
          return (
            <div key={s.name}>
              <div className="flex items-baseline justify-between text-sm mb-1">
                <span className={isTarget ? "font-semibold text-ink-900" : "text-ink-600"}>
                  {isTarget && <span className="mr-1.5 text-accent">★</span>}
                  {s.name}
                </span>
                <span className="font-mono text-xs text-ink-600">
                  {s.share_pct}% <span className="text-ink-400">({s.mention_count})</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${width}%`,
                    background: isTarget ? "#7c3aed" : PALETTE[(i + 1) % PALETTE.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
