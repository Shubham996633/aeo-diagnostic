"use client";

type Props = { score: number; brand: string; category: string };

function scoreLabel(score: number): { label: string; tone: string } {
  if (score >= 70) return { label: "Strong", tone: "text-win" };
  if (score >= 40) return { label: "Mid-pack", tone: "text-warn" };
  if (score >= 15) return { label: "Weak", tone: "text-lose" };
  return { label: "Invisible", tone: "text-lose" };
}

export default function ScoreHero({ score, brand, category }: Props) {
  const { label, tone } = scoreLabel(score);
  const angle = (score / 100) * 360;

  return (
    <div className="card p-8 flex items-center gap-8">
      <div
        className="relative grid h-36 w-36 place-items-center rounded-full"
        style={{
          background: `conic-gradient(#7c3aed ${angle}deg, #f4f4f5 0)`,
        }}
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-white">
          <div className="text-center">
            <div className="text-4xl font-semibold tracking-tight">{score}</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-400">AEO score</div>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className={`text-sm font-medium uppercase tracking-wider ${tone}`}>{label}</div>
        <h2 className="text-2xl font-semibold tracking-tight mt-1">{brand}</h2>
        <p className="text-ink-600 mt-1">{category}</p>
        <p className="text-xs text-ink-400 mt-3">
          Score blends visibility (% of queries you appear in), avg position, and sentiment across engines.
        </p>
      </div>
    </div>
  );
}
