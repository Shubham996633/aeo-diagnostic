"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts";
import type { EngineScore } from "@/lib/api";

const ENGINE_LABEL: Record<string, string> = {
  openai: "GPT-4o-mini",
  gemini: "Gemini 2.0",
};
const ENGINE_COLOR: Record<string, string> = {
  openai: "#10a37f",
  gemini: "#4285f4",
};

export default function EngineBreakdown({ scores }: { scores: EngineScore[] }) {
  const data = scores.map((s) => ({
    name: ENGINE_LABEL[s.engine] ?? s.engine,
    visibility: s.visibility_pct,
    color: ENGINE_COLOR[s.engine] ?? "#71717a",
    avg_pos: s.avg_position,
  }));

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="font-semibold tracking-tight">Visibility by engine</h3>
        <span className="text-xs text-ink-400">% of questions where brand appeared</span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 16, right: 32 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#52525b", fontSize: 13 }}
              width={100}
            />
            <Bar dataKey="visibility" radius={[6, 6, 6, 6]} barSize={28}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
              <LabelList
                dataKey="visibility"
                position="right"
                formatter={(v: number) => `${v}%`}
                style={{ fill: "#18181b", fontSize: 13, fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        {data.map((d) => (
          <div key={d.name} className="rounded-lg border border-ink-200 px-3 py-2">
            <div className="text-ink-400">{d.name} avg position</div>
            <div className="font-mono font-medium text-ink-900">
              {d.avg_pos !== null ? `#${d.avg_pos}` : "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
