import { Buffer } from "node:buffer";
import type { Locale } from "../../app/site-header.tsx";
import type { Deps } from "./api.server.ts";

const CODE_TTL = 10 * 60 * 1000, LOGIN_TTL = 30 * 24 * 60 * 60 * 1000, RESEND_AFTER = 60 * 1000, MAX_ATTEMPTS = 5;
const COOKIE = "yat_element";
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
const hex = async (s: string) => Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))).toString("hex");
const emailOf = (v: unknown) => { const e = typeof v === "string" ? v.trim().toLowerCase() : ""; return e.length <= 254 && EMAIL.test(e) ? e : null; };
const localeOf = (v: unknown): Locale => (v === "zh-Hant" || v === "zh-Hans" ? v : "en");

function sixDigits() {
  const n = new Uint32Array(1);
  do crypto.getRandomValues(n); while (n[0] >= 4_294_000_000); // drop the top sliver so every code is equally likely
  return String(n[0] % 1_000_000).padStart(6, "0");
}

const MAIL: Record<Locale, (code: string) => { subject: string; text: string }> = {
  en: (code) => ({ subject: `${code} is your Element sign-in code`, text: `Your YAT.lifestyle Element code is ${code}. It expires in 10 minutes.\n\nIf you did not ask for it, you can ignore this email.` }),
  "zh-Hant": (code) => ({ subject: `你的 Element 登入碼：${code}`, text: `你的 YAT.lifestyle Element 登入碼是 ${code}，10 分鐘內有效。\n\n如果你沒有要求登入碼，請忽略這封電郵。` }),
  "zh-Hans": (code) => ({ subject: `你的 Element 登录码：${code}`, text: `你的 YAT.lifestyle Element 登录码是 ${code}，10 分钟内有效。\n\n如果你没有要求登录码，请忽略这封邮件。` }),
};

// Every valid address gets the same answer, whether or not it has a profile, a pending code or a failed send.
export async function authRequest(body: Record<string, unknown>, deps: Deps) {
  const email = emailOf(body.email);
  if (!email) return json({ ok: false }, 400);
  if (!deps.pepper) { console.warn("element auth: ELEMENT_CODE_PEPPER is not set"); return json({ ok: false }, 503); }
  const now = deps.now();
  const pending = await deps.db.prepare("SELECT created_at FROM element_auth_codes WHERE email = ?").bind(email).first<{ created_at: string }>();
  // One code a minute per address, so the form cannot be used to flood someone's inbox or reset the attempt counter.
  if (pending && now - Date.parse(pending.created_at) < RESEND_AFTER) return json({ ok: true });
  const code = sixDigits();
  await deps.db.prepare(`INSERT INTO element_auth_codes (email, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, ?)
    ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, created_at = excluded.created_at`)
    .bind(email, await hex(code + deps.pepper), now + CODE_TTL, new Date(now).toISOString()).run();
  try {
    if (!deps.sendEmail) throw new Error("no EMAIL binding");
    const mail = MAIL[localeOf(body.locale)](code);
    await deps.sendEmail({ to: email, subject: mail.subject, text: mail.text, html: `<p>${mail.text.replaceAll("\n\n", "</p><p>")}</p>` });
  } catch (error) {
    // Never log the address or the code.
    console.warn("element auth: code email failed:", error instanceof Error ? error.message : "unknown");
  }
  return json({ ok: true });
}

export async function authVerify(body: Record<string, unknown>, deps: Deps) {
  const email = emailOf(body.email), code = typeof body.code === "string" ? body.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code) || !deps.pepper) return json({ ok: false }, 400);
  const now = deps.now();
  // Spend an attempt before comparing, atomically, so parallel guesses cannot exceed the limit.
  const row = await deps.db.prepare(`UPDATE element_auth_codes SET attempts = attempts + 1
    WHERE email = ? AND attempts < ? AND expires_at > ? RETURNING code_hash`).bind(email, MAX_ATTEMPTS, now).first<{ code_hash: string }>();
  if (!row || row.code_hash !== await hex(code + deps.pepper)) return json({ ok: false }, 400);
  await deps.db.prepare("DELETE FROM element_auth_codes WHERE email = ?").bind(email).run();
  const id = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  await deps.db.prepare("INSERT INTO element_logins (id_hash, email, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(await hex(id), email, now + LOGIN_TTL, new Date(now).toISOString()).run();
  // A demo result can be claimed once: whoever holds its resultId took the test.
  if (typeof body.resultId === "string" && body.resultId.length <= 40) {
    await deps.db.prepare("UPDATE element_profiles SET email = ? WHERE result_id = ? AND email IS NULL").bind(email, body.resultId).run();
  }
  return withCookies({ ok: true }, [`${COOKIE}=${id}; Path=/; Max-Age=${LOGIN_TTL / 1000}; HttpOnly; Secure; SameSite=Lax`, `${HINT}=1; Path=/; Max-Age=${LOGIN_TTL / 1000}; Secure; SameSite=Lax`]);
}

// A readable "signed in" hint next to the HttpOnly session cookie, so pages only ask for /profile when it can succeed.
// It carries no secret: forging it only makes the page ask and get a 401.
const HINT = "yat_element_in";
const withCookies = (body: unknown, cookies: string[]) =>
  Response.json(body, { headers: [["Cache-Control", "no-store"], ...cookies.map((c): [string, string] => ["Set-Cookie", c])] });

const cookieOf = (request: Request) => request.headers.get("cookie")?.match(/(?:^|;\s*)yat_element=([A-Za-z0-9_-]{43})(?:;|$)/)?.[1];

export async function viewerEmail(request: Request, deps: Deps) {
  const id = cookieOf(request);
  if (!id) return null;
  const row = await deps.db.prepare("SELECT email FROM element_logins WHERE id_hash = ? AND expires_at > ?").bind(await hex(id), deps.now()).first<{ email: string }>();
  return row?.email ?? null;
}

export async function authLogout(_body: Record<string, unknown>, deps: Deps, request: Request) {
  const id = cookieOf(request);
  if (id) await deps.db.prepare("DELETE FROM element_logins WHERE id_hash = ?").bind(await hex(id)).run();
  return withCookies({ ok: true }, [`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`, `${HINT}=; Path=/; Max-Age=0; Secure; SameSite=Lax`]);
}

type Row = { share_id: string; first_name: string | null; likes: string; nose_type: string; nose_name: string; tags: string; shared: number };
const COLUMNS = "share_id, first_name, likes, nose_type, nose_name, tags, shared";
// The only shape a profile ever leaves the server in. Built field by field so skin, oil or pH can never ride along.
const view = (r: Row) => {
  const { tagLabels = {}, ...noseName } = JSON.parse(r.nose_name) as Record<string, unknown> & { tagLabels?: Record<string, string> };
  return { shareId: r.share_id, firstName: r.first_name, noseType: r.nose_type, noseName, likes: JSON.parse(r.likes), tags: JSON.parse(r.tags), tagLabels, shared: r.shared === 1 };
};

export async function publicProfile(deps: Deps, shareId: string) {
  if (!/^[a-z0-9-]{1,40}$/.test(shareId)) return null;
  const row = await deps.db.prepare(`SELECT ${COLUMNS} FROM element_profiles WHERE share_id = ? AND shared = 1`).bind(shareId).first<Row>();
  return row ? view(row) : null;
}

// GET ?share=<id>: a shared profile, public. POST {}: your own profile. POST {shared}: toggle your latest profile.
// POST {resultId, shared: true}: share a demo profile without an account; the resultId is the proof of ownership.
export async function profile(body: Record<string, unknown>, deps: Deps, request: Request) {
  if (typeof body.resultId === "string") {
    if (body.shared !== true || body.resultId.length > 40) return json({ ok: false }, 400);
    await deps.db.prepare("UPDATE element_profiles SET shared = 1 WHERE result_id = ?").bind(body.resultId).run();
    const row = await deps.db.prepare(`SELECT ${COLUMNS} FROM element_profiles WHERE result_id = ?`).bind(body.resultId).first<Row>();
    return row ? json(view(row)) : json({ ok: false }, 404);
  }
  const email = await viewerEmail(request, deps);
  if (!email) return json({ ok: false }, 401);
  if (body.shared !== undefined && typeof body.shared !== "boolean") return json({ ok: false }, 400);
  const latest = `SELECT id, ${COLUMNS} FROM element_profiles WHERE email = ? ORDER BY created_at DESC LIMIT 1`;
  let row = await deps.db.prepare(latest).bind(email).first<Row & { id: string }>();
  if (row && typeof body.shared === "boolean") {
    await deps.db.prepare("UPDATE element_profiles SET shared = ? WHERE id = ?").bind(body.shared ? 1 : 0, row.id).run();
    row = { ...row, shared: body.shared ? 1 : 0 };
  }
  return json({ email, profile: row ? view(row) : null });
}

// For compare: a profile may be used when it is shared or when it belongs to the person asking.
export async function profileVector(deps: Deps, shareId: string, viewer: string | null) {
  const row = shareId.length <= 40 ? await deps.db.prepare("SELECT likes, tags, shared, email FROM element_profiles WHERE share_id = ?").bind(shareId)
    .first<{ likes: string; tags: string; shared: number; email: string | null }>() : null;
  if (!row || (row.shared !== 1 && !(viewer && row.email?.toLowerCase() === viewer))) return null;
  return { likes: JSON.parse(row.likes), tags: JSON.parse(row.tags) };
}
