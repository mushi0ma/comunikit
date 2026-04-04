// comunikit — typed fetch wrapper
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3001";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
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
