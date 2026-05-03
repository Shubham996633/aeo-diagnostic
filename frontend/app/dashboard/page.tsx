"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, Trash2 } from "lucide-react";
import DiagnoseForm from "@/components/DiagnoseForm";
import { getSession } from "@/lib/session";
import { listReports, deleteReport, type ReportSummary } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [history, setHistory] = useState<ReportSummary[]>([]);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.push("/login");
      return;
    }
    setName(s.name.split(" ")[0] || s.name);
    setEmail(s.email);
    listReports(s.email).then(setHistory).catch(() => setHistory([]));
  }, [router]);

  async function onDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pendingDelete !== id) {
      setPendingDelete(id);
      setTimeout(() => setPendingDelete((cur) => (cur === id ? null : cur)), 3000);
      return;
    }
    setPendingDelete(null);
    const previous = history;
    setHistory((h) => h.filter((r) => r.id !== id));
    try {
      await deleteReport(id, email);
    } catch {
      // restore on failure
      setHistory(previous);
    }
  }

  if (!name) return null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px] items-start">
      <div className="space-y-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-accent">
            Welcome, {name}
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Run a new diagnostic</h1>
          <p className="mt-2 text-ink-600">
            We'll generate buyer-intent questions, query both LLM engines, and grade your visibility.
          </p>
        </div>
        <DiagnoseForm />
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold tracking-tight">Your history</h2>
          <span className="text-xs text-ink-400">{history.length} runs</span>
        </div>
        {history.length === 0 ? (
          <div className="card p-6 text-center text-sm text-ink-400">
            <Clock className="mx-auto h-5 w-5 mb-2 text-ink-300" />
            No diagnostics yet.<br />
            Run your first one to see history here.
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="group relative">
                <Link
                  href={`/report/${h.id}`}
                  className="card p-4 hover:border-accent-ring transition flex items-center gap-3 pr-12"
                >
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-semibold text-sm"
                    style={{
                      background: `conic-gradient(#7c3aed ${(h.aeo_score / 100) * 360}deg, #f4f4f5 0)`,
                    }}
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-white">
                      {h.aeo_score}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{h.brand}</div>
                    <div className="text-xs text-ink-400 truncate">{h.category}</div>
                    <div className="text-[10px] font-mono text-ink-400 mt-0.5">
                      {new Date(h.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-accent transition" />
                </Link>
                <button
                  onClick={(e) => onDelete(h.id, e)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg text-ink-300 hover:bg-lose/10 hover:text-lose transition opacity-0 group-hover:opacity-100 ${
                    pendingDelete === h.id ? "!opacity-100 bg-lose/10 text-lose" : ""
                  }`}
                  aria-label={pendingDelete === h.id ? "Confirm delete" : "Delete report"}
                  title={pendingDelete === h.id ? "Click again to confirm" : "Delete report"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
