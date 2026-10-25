import { Buffer } from "node:buffer";
import { MAIL, mailEyebrow, mailHeading, mailLayout, mailMuted, type MailLocale } from "./email-layout.ts";

type Statement = {
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
};
export type CheckoutEmailEnv = {
  DB: { prepare(sql: string): { bind(...values: (string | number | null)[]): Statement } };
  EMAIL: { send(message: { from: { email: string; name: string }; to: string; subject: string; text: string; html: string }): Promise<unknown> };
  CHECKOUT_CODE_PEPPER?: string;
  CHECKOUT_RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
};

const CODE_TTL = 10 * 60_000, PROOF_TTL = 30 * 60_000, RESEND_AFTER = 60_000;
const COOKIE = "yat_checkout_email", JSON_LIMIT = 4096;
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
const fail = (status: number, error: string, resendAfter?: number) => json({ ok: false, error, ...(resendAfter ? { resendAfter } : {}) }, status, status === 429 ? { "Retry-After": String(resendAfter ?? 60) } : {});
const emailOf = (value: unknown) => {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  return email.length <= 254 && EMAIL.test(email) && email.split("@")[0].length <= 64
    && !email.startsWith(".") && !email.includes("..") && !email.includes(".@") ? email : null;
};
const digest = async (value: string) => Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))).toString("hex");
async function codeHash(email: string, code: string, pepper: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pepper), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${email}\0${code}`))).toString("hex");
}
const local = (url: URL) => ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
function sixDigits() {
  const value = new Uint32Array(1);
  do crypto.getRandomValues(value); while (value[0] >= 4_294_000_000);
  return String(value[0] % 1_000_000).padStart(6, "0");
}

const mailCopy = {
  en: { subject: "Your YAT.LIFESTYLE checkout code", text: (code: string) => `Your checkout verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this code, ignore this email.`,
    eyebrow: "Checkout verification", heading: "Your checkout code", intro: "Enter this code on the checkout page to verify your email.", expires: "It expires in 10 minutes.", ignore: "If you did not request this code, ignore this email." },
  "zh-Hant": { subject: "YAT.LIFESTYLE 結帳驗證碼", text: (code: string) => `你的結帳驗證碼是 ${code}，10 分鐘內有效。\n\n如果你沒有要求驗證碼，請忽略這封電郵。`,
    eyebrow: "結帳驗證", heading: "你的結帳驗證碼", intro: "請在結帳頁面輸入以下驗證碼，以驗證你的電郵。", expires: "驗證碼於 10 分鐘內有效。", ignore: "如果你沒有要求驗證碼，請忽略這封電郵。" },
  "zh-Hans": { subject: "YAT.LIFESTYLE 结账验证码", text: (code: string) => `你的结账验证码是 ${code}，10 分钟内有效。\n\n如果你没有要求验证码，请忽略这封邮件。`,
    eyebrow: "结账验证", heading: "你的结账验证码", intro: "请在结账页面输入以下验证码，以验证你的邮箱。", expires: "验证码在 10 分钟内有效。", ignore: "如果你没有要求验证码，请忽略这封邮件。" },
};
function codeMail(locale: MailLocale, code: string) {
  const t = mailCopy[locale];
  // letter-spacing also trails the last digit, so the matching left padding keeps the code centred.
  const body = `${mailEyebrow(t.eyebrow)}${mailHeading(t.heading)}<p style="margin:0 0 24px;">${t.intro}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:22px 0 22px 10px;background:${MAIL.paper};border:1px solid ${MAIL.rule};font-family:${MAIL.sans};font-size:36px;font-weight:700;letter-spacing:10px;color:${MAIL.ink};-webkit-user-select:all;user-select:all;">${code}</td></tr></table>
<p style="margin:16px 0 28px;color:${MAIL.muted};">${t.expires}</p><div style="border-top:1px solid ${MAIL.rule};padding-top:16px;">${mailMuted(t.ignore)}</div>`;
  return { subject: t.subject, text: t.text(code), html: mailLayout({ locale, preheader: t.text(code).split("\n")[0], body }) };
}

class BodyError extends Error { status: number; constructor(status: number) { super(); this.status = status; } }
async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new BodyError(415);
  if (Number(request.headers.get("content-length")) > JSON_LIMIT) throw new BodyError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new BodyError(400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > JSON_LIMIT) { await reader.cancel(); throw new BodyError(413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new BodyError(400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new BodyError(400);
  return body as Record<string, unknown>;
}

async function getProof(request: Request, env: Pick<CheckoutEmailEnv, "DB">, now: () => number) {
  const id = request.headers.get("cookie")?.match(/(?:^|;\s*)yat_checkout_email=([A-Za-z0-9_-]{43})(?:;|$)/)?.[1];
  if (!id) return null;
  const proof = await env.DB.prepare("SELECT email, expires_at FROM checkout_email_proofs WHERE id_hash = ? AND expires_at > ?")
    .bind(await digest(id), now()).first<{ email: string; expires_at: number }>();
  const email = proof ? emailOf(proof.email) : null;
  return proof && email ? { email, expiresAt: proof.expires_at } : null;
}

export async function getVerifiedEmail(request: Request, env: Pick<CheckoutEmailEnv, "DB">, now = Date.now): Promise<string | null> {
  return (await getProof(request, env, now))?.email ?? null;
}

async function requestCode(body: Record<string, unknown>, email: string, env: CheckoutEmailEnv, now: number) {
  if (body.locale !== "en" && body.locale !== "zh-Hant" && body.locale !== "zh-Hans") return fail(400, "invalid-request");
  if (!env.EMAIL) return fail(503, "unavailable");
  const code = sixDigits(), hash = await codeHash(email, code, env.CHECKOUT_CODE_PEPPER!);
  // Reserve the resend window atomically before sending, including simultaneous requests.
  const reserved = await env.DB.prepare(`INSERT INTO checkout_email_codes
    (email, code_hash, expires_at, requested_at, delivered_at, attempts, consumed_token) VALUES (?, ?, ?, ?, NULL, 0, NULL)
    ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
      requested_at = excluded.requested_at, delivered_at = NULL, attempts = 0, consumed_token = NULL
    WHERE checkout_email_codes.requested_at <= ? RETURNING email`)
    .bind(email, hash, now + CODE_TTL, now, now - RESEND_AFTER).first<{ email: string }>();
  if (!reserved) {
    const pending = await env.DB.prepare("SELECT requested_at FROM checkout_email_codes WHERE email = ?").bind(email).first<{ requested_at: number }>();
    return fail(429, "cooldown", Math.max(1, Math.ceil((RESEND_AFTER - (now - (pending?.requested_at ?? now))) / 1000)));
  }
  try {
    await env.EMAIL.send({ from: { email: "orders@yatlifestyle.com", name: "YAT.LIFESTYLE" }, to: email, ...codeMail(body.locale, code) });
  } catch {
    await env.DB.prepare("DELETE FROM checkout_email_codes WHERE email = ? AND code_hash = ? AND delivered_at IS NULL").bind(email, hash).run();
    return fail(503, "send-failed");
  }
  const delivered = await env.DB.prepare("UPDATE checkout_email_codes SET delivered_at = ? WHERE email = ? AND code_hash = ? RETURNING email")
    .bind(now, email, hash).first<{ email: string }>();
  return delivered ? json({ ok: true, resendAfter: 60 }) : fail(503, "unavailable");
}

async function verifyCode(body: Record<string, unknown>, email: string, request: Request, env: CheckoutEmailEnv, now: number) {
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!/^\d{6}$/.test(code)) return fail(400, "invalid-code");
  const id = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url"), idHash = await digest(id);
  const hash = await codeHash(email, code, env.CHECKOUT_CODE_PEPPER!);
  // The fifth attempt and a correct code's one-time consumption both happen in this single guarded write.
  const consumed = await env.DB.prepare(`UPDATE checkout_email_codes SET attempts = attempts + 1,
    consumed_token = CASE WHEN code_hash = ? THEN ? ELSE NULL END
    WHERE email = ? AND attempts < 5 AND expires_at > ? AND delivered_at IS NOT NULL AND consumed_token IS NULL
    RETURNING consumed_token`).bind(hash, idHash, email, now).first<{ consumed_token: string | null }>();
  if (consumed?.consumed_token !== idHash) return fail(400, "invalid-code");
  const stored = await env.DB.prepare("INSERT INTO checkout_email_proofs (id_hash, email, expires_at) VALUES (?, ?, ?)")
    .bind(idHash, email, now + PROOF_TTL).run();
  if (!stored.success) return fail(503, "unavailable");
  const url = new URL(request.url), secure = url.protocol === "https:" || !local(url);
  return json({ ok: true, email, expiresIn: PROOF_TTL / 1000 }, 200, { "Set-Cookie": `${COOKIE}=${id}; Path=/; Max-Age=${PROOF_TTL / 1000}; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax` });
}

export async function handleCheckoutEmail(action: string, request: Request, env: CheckoutEmailEnv, now = Date.now): Promise<Response> {
  if (!["request", "verify", "status"].includes(action)) return fail(404, "not-found");
  if (request.method !== (action === "status" ? "GET" : "POST")) return fail(405, "method-not-allowed");
  const url = new URL(request.url), origin = request.headers.get("origin");
  if ((action !== "status" && origin !== url.origin) || (origin && origin !== url.origin)
    || request.headers.get("sec-fetch-site") === "cross-site" || (url.protocol !== "https:" && !local(url))) return fail(403, "invalid-origin");
  if (!env.DB || !env.CHECKOUT_RATE_LIMITER || !env.CHECKOUT_CODE_PEPPER || env.CHECKOUT_CODE_PEPPER.length < 32) return fail(503, "unavailable");
  try {
    const ip = request.headers.get("cf-connecting-ip") || (local(url) ? "local" : null);
    if (!ip) return fail(503, "unavailable");
    if (!(await env.CHECKOUT_RATE_LIMITER.limit({ key: `yat-checkout-email:${action}:ip:${ip}` })).success) return fail(429, "rate-limited");
    if (action === "status") {
      const proof = await getProof(request, env, now);
      return json({ ok: true, email: proof?.email ?? null, expiresIn: proof ? Math.max(0, Math.ceil((proof.expiresAt - now()) / 1000)) : 0 });
    }
    const body = await readJson(request), email = emailOf(body.email);
    if (!email) return fail(400, "invalid-email");
    const key = await codeHash(email, "rate-limit", env.CHECKOUT_CODE_PEPPER);
    if (!(await env.CHECKOUT_RATE_LIMITER.limit({ key: `yat-checkout-email:${action}:email:${key}` })).success) return fail(429, "rate-limited");
    const timestamp = now();
    await env.DB.prepare("DELETE FROM checkout_email_proofs WHERE expires_at <= ?").bind(timestamp).run();
    await env.DB.prepare("DELETE FROM checkout_email_codes WHERE expires_at <= ?").bind(timestamp).run();
    return action === "request" ? await requestCode(body, email, env, timestamp) : await verifyCode(body, email, request, env, timestamp);
  } catch (error) {
    // Binding and database errors can contain addresses; never log them or a submitted code.
    return error instanceof BodyError ? fail(error.status, "invalid-request") : fail(503, "unavailable");
  }
}
