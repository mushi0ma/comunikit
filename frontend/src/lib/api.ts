// comunikit — typed fetch wrapper with optional auth
import { supabase } from "@/lib/supabase";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || (import.meta.env.PROD ? "https://comunikit-production.up.railway.app" : "http://localhost:3001");

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Merge auth token into headers if a session exists
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    // Send HTTP-only session cookies on every API call. Required for the
    // Telegram Login Widget flow where the backend owns the session via
    // an HTTP-only cookie instead of a bearer token.
    credentials: "include",
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body: unknown = await res.json();
      if (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string") {
        message = (body as { error: string }).error;
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  const body: unknown = await res.json();
  // BFF standard envelope: { success, data, error }
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}
