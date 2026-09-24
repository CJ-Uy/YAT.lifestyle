import { NEWSLETTER_POLICY_VERSION, newsletterCopy } from "./newsletter.ts";

export type NewsletterEnv = {
  DB: { prepare(sql: string): { bind(...values: (string | number)[]): { run(): Promise<{ success: boolean }> } } };
  NEWSLETTER_RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
};

const response = (status: number) => Response.json({ ok: status === 200 }, {
  status, headers: { "Cache-Control": "no-store", ...(status === 429 ? { "Retry-After": "60" } : {}) },
});

export async function subscribe(request: Request, env: NewsletterEnv): Promise<Response> {
  if (request.method !== "POST") return response(405);
  if (request.headers.get("origin") !== new URL(request.url).origin) return response(403);
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return response(415);
  try {
    // ponytail: anonymous IP throttling can affect shared networks. Add Turnstile if abuse grows.
    const ip = request.headers.get("cf-connecting-ip") || "local";
    if (!(await env.NEWSLETTER_RATE_LIMITER.limit({ key: `yat-newsletter:${ip}` })).success) return response(429);
    if (Number(request.headers.get("content-length")) > 4096) return response(413);
    const reader = request.body?.getReader();
    if (!reader) return response(400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); return response(413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let body;
    try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { return response(400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return response(400);
    if (typeof body.website === "string" && body.website.length) return response(200);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)
      || email.split("@")[0].length > 64 || email.startsWith(".") || email.includes("..") || email.includes(".@")
      || !["en", "zh-Hant", "zh-Hans"].includes(body.locale)
      || body.marketingConsent !== true || body.privacyAcknowledged !== true
      || body.policyVersion !== NEWSLETTER_POLICY_VERSION) return response(400);

    const locale = body.locale as keyof typeof newsletterCopy;
    const result = await env.DB.prepare(`INSERT INTO newsletter_subscribers
      (email, locale, policy_version, marketing_consent, privacy_acknowledged, source)
      VALUES (?, ?, ?, ?, 1, 'shop') ON CONFLICT(email) DO NOTHING`)
      .bind(email, locale, NEWSLETTER_POLICY_VERSION, newsletterCopy[locale].consent).run();
    // Existing addresses get the same response. Never reactivate a withdrawn subscription.
    return response(result.success ? 200 : 503);
  } catch {
    // Never log submitted addresses, request bodies or database errors containing them.
    return response(503);
  }
}
