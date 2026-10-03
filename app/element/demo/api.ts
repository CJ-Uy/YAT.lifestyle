// One door to /api/element/*. Every call has a timeout and resolves to null on any failure,
// so the caller always falls back to local logic and the demo never dead-ends.
export async function callApi<T>(action: "session" | "photo" | "survey" | "voice" | "result", body: unknown, timeoutMs: number): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`/api/element/${action}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
