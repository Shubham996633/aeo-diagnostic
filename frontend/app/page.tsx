import Link from "next/link";
import { ArrowRight, Bot, Gauge, Layers, Sparkles } from "lucide-react";
import LandingRedirect from "@/components/LandingRedirect";

export default function LandingPage() {
  return (
    <div className="space-y-24">
      <LandingRedirect />
      {/* Hero */}
      <section className="grid gap-12 md:grid-cols-2 md:gap-16 items-center pt-6">
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            ✦ Answer Engine Optimization
          </span>
          <h1 className="text-5xl font-semibold tracking-tight text-ink-900 leading-[1.05]">
            When shoppers ask AI, does your brand get the answer?
          </h1>
          <p className="text-lg text-ink-600 leading-relaxed">
            SEO is for Google. <b>AEO is for ChatGPT and Gemini.</b> We ask the
            buyer-intent questions your customers are asking, then grade how often
            your brand surfaces in the answers.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/login" className="btn-primary">
              <Sparkles className="mr-2 h-4 w-4" />
              Get started — it's free
            </Link>
            <Link href="/login" className="btn-secondary">
              See a sample report
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="flex items-center gap-4 pt-4 text-xs text-ink-400">
            <span>2 LLM engines</span>
            <span>·</span>
            <span>~15s diagnostic</span>
            <span>·</span>
            <span>Agent-driven</span>
          </div>
        </div>

        {/* Hero visual: mock score card */}
        <div className="relative">
          <div className="card p-8 space-y-6">
            <div className="flex items-center gap-5">
              <div
                className="grid h-28 w-28 place-items-center rounded-full"
                style={{ background: `conic-gradient(#7c3aed ${0.82 * 360}deg, #f4f4f5 0)` }}
              >
                <div className="grid h-20 w-20 place-items-center rounded-full bg-white">
                  <div className="text-center">
                    <div className="text-3xl font-semibold">82</div>
                    <div className="text-[9px] uppercase tracking-wider text-ink-400">
                      AEO score
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase font-medium tracking-wider text-win">Strong</div>
                <h3 className="text-xl font-semibold mt-1">Athletic Greens</h3>
                <p className="text-sm text-ink-600">daily greens powder</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">Athletic Greens ★</span>
                  <span className="font-mono">25%</span>
                </div>
                <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: "100%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-600">Amazing Grass</span>
                  <span className="font-mono text-ink-600">15%</span>
                </div>
                <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: "60%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-600">Garden of Life</span>
                  <span className="font-mono text-ink-600">12%</span>
                </div>
                <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: "48%" }} />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-xl bg-accent-soft" />
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="text-center mb-10">
          <span className="text-xs font-medium uppercase tracking-wider text-accent">How it works</span>
          <h2 className="text-3xl font-semibold tracking-tight mt-2">
            One brand input. A whole agent crew on the job.
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Step
            n={1}
            icon={<Bot className="h-5 w-5" />}
            title="Agent generates buyer questions"
            body="Gemini brainstorms the questions real shoppers type into ChatGPT — comparison, best-of, budget, use-case."
          />
          <Step
            n={2}
            icon={<Layers className="h-5 w-5" />}
            title="2 LLM engines answer in parallel"
            body="GPT-4o-mini and Gemini 2.0 each respond as if they were a real shopping advisor. Latencies tracked."
          />
          <Step
            n={3}
            icon={<Gauge className="h-5 w-5" />}
            title="Score, share-of-voice, recommendations"
            body="The agent extracts every brand mentioned, scores you against competitors, and writes 3 strategic moves."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="card p-12 text-center bg-ink-900 border-ink-900">
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Find out where you rank in 15 seconds.
        </h2>
        <p className="mt-3 text-ink-400">No credit card. Just your brand name.</p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-medium text-ink-900 hover:bg-ink-100 transition"
        >
          Run my diagnostic
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent">
          {icon}
        </div>
        <span className="font-mono text-xs text-ink-400">step {n}</span>
      </div>
      <h3 className="font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-600 leading-relaxed">{body}</p>
    </div>
  );
}
