"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";
import { saveSession, getSession } from "@/lib/session";
import { login, register, emailExists } from "@/lib/auth";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      let user: { name: string; email: string };

      if (mode === "signin") {
        // If unknown email, nudge into signup instead of failing on password.
        const exists = await emailExists(cleanEmail);
        if (!exists) {
          setMode("signup");
          setError("No account with that email yet. Pick a name to sign up.");
          setSubmitting(false);
          return;
        }
        user = await login(cleanEmail, password);
      } else {
        if (!name.trim()) {
          setError("Please enter your name");
          setSubmitting(false);
          return;
        }
        user = await register(cleanEmail, password, name.trim());
      }

      saveSession(user.name, user.email, remember);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center pt-6">
      {/* Left: pitch */}
      <div className="space-y-6 hidden md:block">
        <span className="inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          {mode === "signin" ? "✦ Welcome back" : "✦ Get started"}
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-ink-900 leading-tight">
          See how AI describes your brand to shoppers.
        </h1>
        <p className="text-ink-600 leading-relaxed">
          {mode === "signin"
            ? "Sign in to run new diagnostics, track your AEO score over time, and see which competitors are stealing your share of voice in AI answers."
            : "Create an account to keep a history of every diagnostic you run and compare your visibility across LLM engines."}
        </p>
        <ul className="space-y-2.5 text-sm text-ink-600">
          <li className="flex gap-2"><span className="text-accent">→</span> Visibility across GPT-4o-mini & Gemini 2.0</li>
          <li className="flex gap-2"><span className="text-accent">→</span> Per-engine sentiment and avg position</li>
          <li className="flex gap-2"><span className="text-accent">→</span> Strategic recommendations from a Gemini agent</li>
          <li className="flex gap-2"><span className="text-accent">→</span> Persistent history across sessions</li>
        </ul>
      </div>

      {/* Right: form */}
      <div className="card p-8 md:p-10">
        <div className="flex gap-1.5 rounded-lg bg-ink-100 p-1 text-sm font-medium mb-6">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); }}
            className={`flex-1 rounded-md py-2 transition ${
              mode === "signin" ? "bg-white text-ink-900 shadow-sm" : "text-ink-600"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 rounded-md py-2 transition ${
              mode === "signup" ? "bg-white text-ink-900 shadow-sm" : "text-ink-600"
            }`}
          >
            Sign up
          </button>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-1.5 text-sm text-ink-600">
          {mode === "signin" ? "Sign in to continue." : "Takes 10 seconds. No credit card."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label className="label">Your name</label>
              <input
                className="input"
                placeholder="e.g. Shubham Maurya"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@brand.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={mode === "signin"}
              required
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                className="input pr-11"
                type={showPwd ? "text" : "password"}
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded text-ink-400 hover:text-ink-800"
                aria-label={showPwd ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-ink-600 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 accent-ink-900"
            />
            Remember me on this device
          </label>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-lose/30 bg-lose/5 p-3 text-sm text-lose">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? (
              "Signing you in…"
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {mode === "signin" ? "Sign in" : "Create account"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>

          <p className="pt-1 text-center text-xs text-ink-400">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
              className="font-medium text-accent hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in instead"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
