// comunikit — typed fetch wrapper with optional auth
import { supabase } from "@/lib/supabase";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || (import.meta.env.PROD ? "https://comunikit-production.up.railway.app" : "http://localhost:3001");

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Merge auth token into headers if a session exists.
  // Wrapped in try/catch so Telegram cookie-based flows still work when
  // Supabase auth hasn't initialised or throws unexpectedly.
  let token: string | undefined;

  try {
    let { data: { session } } = await supabase.auth.getSession();

    // If session exists but access_token is about to expire (within 60s),
    // proactively refresh it to avoid "Auth session missing" / 401 errors.
    if (session && session.expires_at && session.expires_at * 1000 < Date.now() + 60_000) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      session = refreshed.session;
    }

    token = session?.access_token;
  } catch {
    // Supabase client may throw if it hasn't fully initialised on first
    // render (race condition). Fall through — the request will still carry
    // credentials:"include" for cookie-based Telegram sessions.
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  let res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    // Send HTTP-only session cookies on every API call. Required for the
    // Telegram Login Widget flow where the backend owns the session via
    // an HTTP-only cookie instead of a bearer token.
    credentials: "include",
  });

  // Retry once on 401 — the JWT may have expired between the proactive
  // refresh window and the actual request, or the cached session was stale.
  if (res.status === 401 && token) {
    try {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed.session) {
        const retryHeaders: Record<string, string> = {
          ...headers,
          Authorization: `Bearer ${refreshed.session.access_token}`,
        };
        res = await fetch(`${BASE_URL}${path}`, {
          ...init,
          headers: retryHeaders,
          credentials: "include",
        });
      }
    } catch {
      // Refresh failed — fall through to the original 401 error handling.
    }
  }

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
