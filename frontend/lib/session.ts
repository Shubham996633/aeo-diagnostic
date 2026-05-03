"use client";

const KEY = "aeo_session_v1";

export type Session = { name: string; email: string; createdAt: string };

/** Pick the active store. If a session lives in localStorage, prefer that. */
function activeStore(): Storage | null {
  if (typeof window === "undefined") return null;
  if (window.localStorage.getItem(KEY)) return window.localStorage;
  if (window.sessionStorage.getItem(KEY)) return window.sessionStorage;
  return null;
}

export function getSession(): Session | null {
  const store = activeStore();
  if (!store) return null;
  try {
    const raw = store.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(name: string, email: string, remember: boolean): Session {
  const s: Session = { name, email, createdAt: new Date().toISOString() };
  // Clear both stores first so a "remember=false" login doesn't co-exist with a stale persistent one
  window.localStorage.removeItem(KEY);
  window.sessionStorage.removeItem(KEY);
  const store = remember ? window.localStorage : window.sessionStorage;
  store.setItem(KEY, JSON.stringify(s));
  return s;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.sessionStorage.removeItem(KEY);
}

/** Two-letter initials for the avatar circle. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stable color from the email so the same user always gets the same avatar tint. */
export function avatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = (hash * 31 + email.charCodeAt(i)) | 0;
  const hues = [262, 220, 200, 160, 35, 0, 340, 290];
  const h = hues[Math.abs(hash) % hues.length];
  return `hsl(${h} 70% 55%)`;
}
