// One door to /api/element/*. Every call has a timeout and resolves to null on any failure,
// so the caller always falls back to local logic and the demo never dead-ends.
// JSON bodies for session, survey and result; FormData (multipart) for photo and voice uploads.
export async function callApi<T>(action: "session" | "photo" | "survey" | "voice" | "result", body: unknown, timeoutMs: number): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const form = body instanceof FormData;
  try {
    const response = await fetch(`/api/element/${action}`, {
      method: "POST", signal: controller.signal,
      headers: form ? undefined : { "Content-Type": "application/json" },
      body: form ? body : JSON.stringify(body),
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
