"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { getSession, clearSession, type Session } from "@/lib/session";
import Avatar from "@/components/Avatar";

export default function SiteHeader() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function logout() {
    clearSession();
    setSession(null);
    setOpen(false);
    router.push("/");
  }

  return (
    <header className="border-b border-ink-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <a href={session ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-white text-sm font-bold">
            A
          </span>
          <span className="font-semibold tracking-tight">AEO Diagnostic</span>
        </a>

        <div className="flex items-center gap-3">
          {session ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2.5 rounded-full border border-ink-200 bg-white pl-1.5 pr-2.5 py-1 hover:border-ink-400 transition"
              >
                <Avatar name={session.name} email={session.email} size={28} />
                <span className="hidden sm:inline text-sm font-medium text-ink-800">
                  {session.name.split(" ")[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-60 rounded-xl border border-ink-200 bg-white shadow-card overflow-hidden z-20">
                  <div className="px-4 py-3 border-b border-ink-100">
                    <div className="font-medium text-sm text-ink-900">{session.name}</div>
                    <div className="text-xs text-ink-400 truncate">{session.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push("/dashboard");
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 text-left"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-lose hover:bg-lose/5 text-left border-t border-ink-100"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className="text-sm font-medium text-ink-800 hover:text-ink-900"
            >
              Sign in →
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
