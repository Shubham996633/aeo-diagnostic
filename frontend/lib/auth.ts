const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type AuthUser = { email: string; name: string };

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data as { detail?: string }).detail;
    throw new Error(detail || `Request failed: ${res.status}`);
  }
  return data as T;
}

export function register(email: string, password: string, name: string) {
  return postJson<AuthUser>("/auth/register", { email, password, name });
}

export function login(email: string, password: string) {
  return postJson<AuthUser>("/auth/login", { email, password });
}

export async function emailExists(email: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/auth/exists?email=${encodeURIComponent(email)}`,
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { exists: boolean };
    return data.exists;
  } catch {
    return false;
  }
}
