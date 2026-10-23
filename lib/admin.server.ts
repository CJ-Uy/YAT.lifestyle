import { Buffer } from "node:buffer";
import { timingSafeEqual } from "node:crypto";
import type { CommerceDB } from "./commerce.server.ts";
import { FINANCE_GET, FINANCE_POST, financeAction, sendShippedEmail } from "./admin-finance.server.ts";

export type AdminEnv = {
  DB: CommerceDB;
  CHECKOUT_RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD_HASH?: string;
  /** JSON object of further accounts, e.g. {"cj":"pbkdf2-sha256$..."}. */
  ADMIN_USERS?: string;
  ADMIN_SESSION_SECRET?: string;
  FORWARD_TO?: string;
};
export type AdminDeps = {
  db: AdminEnv["DB"];
  limiter: AdminEnv["CHECKOUT_RATE_LIMITER"];
  username?: string;
  passwordHash?: string;
  /** Further accounts beside the owner's, username → password hash. */
  users?: Record<string, string>;
  sessionSecret?: string;
  forwardTo?: string;
  syncPayments?: () => Promise<void>;
  getMailRaw?: (key: string) => Promise<ArrayBuffer | null>;
  cancelOrder?: (id: string) => Promise<unknown>;
  sendEmail?: (message: { to: string; from: { email: string; name: string }; subject: string; text: string; html: string }) => Promise<unknown>;
  now: () => number;
};

const COOKIE = "__Host-yat_admin", SESSION_TTL = 8 * 60 * 60 * 1000, BODY_LIMIT = 16 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CODE = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;
const STAGES = ["new", "making", "packed", "dispatched"] as const;
const PAYMENTS = ["paid", "unpaid", "cancelled", "failed"];
type Stage = typeof STAGES[number];
type Fulfillment = { status: Stage; courier: string; tracking_number: string; note: string; version: number; updated_at: number; shipping_cents: number | null; shipped_email_at: number | null };
export class HttpError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers },
});
const hash = async (value: string) => Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))).toString("hex");
const cookie = (value: string, maxAge: number) => `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`;
const tokenOf = (request: Request) => request.headers.get("cookie")?.match(/(?:^|;\s*)__Host-yat_admin=([A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43})(?:;|$)/)?.[1];
const equal = (left: Uint8Array, right: Uint8Array) => left.length === right.length && timingSafeEqual(left, right);

async function signature(id: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(id))).toString("base64url");
}

export async function verifyAdminPassword(password: string, encoded: string) {
  const match = encoded.match(/^pbkdf2-sha256\$(\d{6,7})\$([A-Za-z0-9_-]{22,86})\$([A-Za-z0-9_-]{43})$/);
  if (!match) throw new HttpError(503, "Admin sign-in is not configured.");
  const iterations = Number(match[1]), salt = Buffer.from(match[2], "base64url"), expected = Buffer.from(match[3], "base64url");
  // shortcut: workerd caps PBKDF2 at 100,000 iterations; use the generated 32-byte password until higher costs are supported.
  if (iterations !== 100000 || salt.length < 16 || salt.length > 64 || expected.length !== 32) throw new HttpError(503, "Admin sign-in is not configured.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const actual = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", iterations, salt }, key, 256));
  return equal(actual, expected);
}

function checkHost(request: Request) {
  const url = new URL(request.url), local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((!local && (url.hostname !== "admin.yatlifestyle.com" || url.protocol !== "https:")) || url.username || url.password) throw new HttpError(403, "Use the admin site to continue.");
  const origin = request.headers.get("origin");
  if ((origin && origin !== url.origin) || (request.method !== "GET" && origin !== url.origin)) throw new HttpError(403, "Reload the admin site and try again.");
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new HttpError(403, "Reload the admin site and try again.");
}

async function readJson(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new HttpError(415, "Send a JSON request.");
  if (Number(request.headers.get("content-length")) > BODY_LIMIT) throw new HttpError(413, "The request is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "The request is incomplete.");
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > BODY_LIMIT) { await reader.cancel(); throw new HttpError(413, "The request is too large."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body: unknown;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new HttpError(400, "The request is incomplete."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "The request is incomplete.");
  return body as Record<string, unknown>;
}

async function viewer(request: Request, deps: AdminDeps) {
  const token = tokenOf(request);
  if (!token) return null;
  const [id, supplied] = token.split(".");
  if (!equal(Buffer.from(supplied, "base64url"), Buffer.from(await signature(id, deps.sessionSecret!), "base64url"))) return null;
  const row = await deps.db.prepare("SELECT username FROM admin_sessions WHERE id_hash = ? AND expires_at > ?").bind(await hash(token), deps.now()).first<{ username: string }>();
  return row && passwordHashOf(row.username, deps) ? row.username : null;
}

// Removing an account's hash also ends its existing sessions.
const passwordHashOf = (username: string, deps: AdminDeps) => username === deps.username ? deps.passwordHash
  : deps.users && Object.hasOwn(deps.users, username) ? deps.users[username] : undefined;

export function parseAdminUsers(value: string | undefined) {
  try {
    const parsed: unknown = JSON.parse(value ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => /^[a-z0-9_-]{2,32}$/.test(entry[0]) && typeof entry[1] === "string"));
  } catch { return {}; }
}

async function login(request: Request, deps: AdminDeps) {
  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  if (!deps.limiter || !(await deps.limiter.limit({ key: `yat-admin-login:${ip}` })).success) throw new HttpError(429, "Too many sign-in attempts. Wait a minute and try again.");
  const body = await readJson(request);
  if (typeof body.username !== "string" || body.username.length > 64 || typeof body.password !== "string" || !body.password || body.password.length > 256) throw new HttpError(400, "Enter your username and password.");
  const username = body.username, known = passwordHashOf(username, deps);
  // Unknown usernames still pay the full PBKDF2 cost, so timing does not reveal which accounts exist.
  const valid = await verifyAdminPassword(body.password, known ?? deps.passwordHash!);
  if (!valid || !known) throw new HttpError(401, "The username or password is incorrect.");
  const id = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url"), token = `${id}.${await signature(id, deps.sessionSecret!)}`, now = deps.now();
  await deps.db.prepare("DELETE FROM admin_sessions WHERE expires_at <= ?").bind(now).run();
  await deps.db.prepare("INSERT INTO admin_sessions (id_hash, username, expires_at, created_at) VALUES (?, ?, ?, ?)").bind(await hash(token), username, now + SESSION_TTL, now).run();
  return json({ ok: true, username }, 200, { "Set-Cookie": cookie(token, SESSION_TTL / 1000) });
}

export const integer = (value: unknown, min: number, max: number) => typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
export const cleanText = (value: unknown, max: number) => typeof value === "string" && value.length <= max && !/[\p{Cc}]/u.test(value) ? value.trim() : null;
const orderId = (value: unknown) => { if (typeof value !== "string" || !UUID.test(value)) throw new HttpError(400, "Choose a valid order."); return value; };

async function orders(request: Request, deps: AdminDeps) {
  const params = new URL(request.url).searchParams, payment = params.get("payment") ?? "all", fulfillment = params.get("fulfillment") ?? "all", page = Number(params.get("page") ?? 1);
  if ((payment !== "all" && !PAYMENTS.includes(payment)) || (fulfillment !== "all" && !STAGES.includes(fulfillment as Stage)) || !integer(page, 1, 10000)) throw new HttpError(400, "Choose a valid order filter.");
  try { await deps.syncPayments?.(); } catch { console.warn("admin payment check unavailable"); }
  const rows = await deps.db.prepare(`SELECT o.id, o.status AS payment_status, o.mode, o.total_cents, o.created_at, o.paid_at,
    COALESCE(f.status, 'new') AS fulfillment_status
    FROM commerce_orders o LEFT JOIN admin_order_fulfillment f ON f.order_id = o.id
    WHERE (? = 'all' OR o.status = ?) AND (? = 'all' OR COALESCE(f.status, 'new') = ?)
    ORDER BY o.created_at DESC, o.id DESC LIMIT 51 OFFSET ?`).bind(payment, payment, fulfillment, fulfillment, (page - 1) * 50).all();
  return json({ orders: rows.results.slice(0, 50), page, hasMore: rows.results.length > 50 });
}

async function detail(request: Request, deps: AdminDeps) {
  const id = orderId(new URL(request.url).searchParams.get("id"));
  const row = await deps.db.prepare(`SELECT id, locale, details_json, items_json, subtotal_cents, delivery_cents, discount_cents, total_cents,
    currency, voucher_code, status AS payment_status, payment_status AS provider_status, mode, created_at, paid_at
    FROM commerce_orders WHERE id = ?`).bind(id).first<{ details_json: string; items_json: string } & Record<string, unknown>>();
  if (!row) throw new HttpError(404, "That order could not be found.");
  const { details_json, items_json, ...order } = row;
  const fulfillment = await deps.db.prepare("SELECT status, courier, tracking_number, note, version, updated_at, shipping_cents, shipped_email_at FROM admin_order_fulfillment WHERE order_id = ?").bind(id).first<Fulfillment>();
  // shortcut: expose the latest 100 audit entries; add cursor pagination if a single order needs more.
  const history = await deps.db.prepare("SELECT previous_status, status, courier, tracking_number, note, actor, created_at FROM admin_order_history WHERE order_id = ? ORDER BY id DESC LIMIT 100").bind(id).all();
  return json({ order: { ...order, details: JSON.parse(details_json), items: JSON.parse(items_json), fulfillment: fulfillment ?? { status: "new", courier: "", tracking_number: "", note: "", version: 0, shipping_cents: null, shipped_email_at: null }, history: history.results } });
}

async function fulfill(body: Record<string, unknown>, deps: AdminDeps, actor: string) {
  const id = orderId(body.id), status = body.status as Stage;
  const courier = cleanText(body.courier, 80), tracking = cleanText(body.trackingNumber, 120);
  const note = typeof body.note === "string" && body.note.length <= 2000 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(body.note) ? body.note.trim() : null;
  const shipping = body.shippingCost === undefined || body.shippingCost === "" ? null : moneyCents(body.shippingCost);
  if (!STAGES.includes(status) || !integer(body.version, 0, 1_000_000) || courier === null || tracking === null || note === null
    || (shipping === null && body.shippingCost !== undefined && body.shippingCost !== "")) throw new HttpError(400, "Check the fulfillment details.");
  const order = await deps.db.prepare("SELECT status, mode FROM commerce_orders WHERE id = ?").bind(id).first<{ status: string; mode: string }>();
  if (!order) throw new HttpError(404, "That order could not be found.");
  if (order.status !== "paid" || order.mode !== "prod") throw new HttpError(409, "Only paid live orders can enter fulfillment.");
  const current = await deps.db.prepare("SELECT status, version FROM admin_order_fulfillment WHERE order_id = ?").bind(id).first<{ status: Stage; version: number }>();
  const previous = current?.status ?? "new", version = current?.version ?? 0;
  if (version !== body.version) throw new HttpError(409, "This order changed. Reload it before saving.");
  if (status !== previous && STAGES.indexOf(status) !== STAGES.indexOf(previous) + 1) throw new HttpError(409, "Complete each fulfillment step in order.");
  if (status === "dispatched" && (courier.length < 2 || tracking.length < 3 || shipping === null)) throw new HttpError(400, "Add the courier, tracking number and shipping cost before dispatch.");
  // The version guard and history trigger keep a concurrent save from overwriting another operator's work.
  const saved = await deps.db.prepare(`INSERT INTO admin_order_fulfillment (order_id, status, courier, tracking_number, note, shipping_cents, version, updated_by, updated_at)
    SELECT ?, ?, ?, ?, ?, ?, 1, ?, ? WHERE EXISTS (SELECT 1 FROM commerce_orders WHERE id = ? AND status = 'paid' AND mode = 'prod')
    ON CONFLICT(order_id) DO UPDATE SET status = excluded.status, courier = excluded.courier, tracking_number = excluded.tracking_number,
    note = excluded.note, shipping_cents = excluded.shipping_cents, version = admin_order_fulfillment.version + 1, updated_by = excluded.updated_by, updated_at = excluded.updated_at
    WHERE admin_order_fulfillment.version = ? RETURNING version`).bind(id, status, courier, tracking, note, shipping, actor, deps.now(), id, version).first();
  if (!saved) throw new HttpError(409, "This order changed. Reload it before saving.");
  // The first save as dispatched emails the customer; a failed send is retried by the next save or the resend action.
  return json({ ok: true, shippedEmail: status === "dispatched" ? await sendShippedEmail(id, deps) : null });
}

async function resendShippedEmail(body: Record<string, unknown>, deps: AdminDeps) {
  const id = orderId(body.id);
  const row = await deps.db.prepare("UPDATE admin_order_fulfillment SET shipped_email_at = NULL WHERE order_id = ? AND status = 'dispatched' RETURNING order_id").bind(id).first();
  if (!row) throw new HttpError(409, "Only dispatched orders have a shipped email.");
  const result = await sendShippedEmail(id, deps);
  if (result !== "sent") throw new HttpError(503, "The shipped email could not be sent. Try again later.");
  return json({ ok: true, shippedEmail: result });
}

async function vouchers(request: Request, deps: AdminDeps) {
  const batch = new URL(request.url).searchParams.get("batch");
  if (batch !== null && !UUID.test(batch)) throw new HttpError(400, "Choose a valid voucher set.");
  // shortcut: show the newest 200 vouchers; add pagination when the owner needs a larger catalogue.
  const rows = await deps.db.prepare(`SELECT v.code, v.kind, v.amount, v.min_subtotal_cents, v.expires_at, v.max_uses, v.active, v.created_at, v.batch,
    (SELECT COUNT(*) FROM commerce_voucher_reservations r WHERE r.voucher_code = v.code AND r.status = 'redeemed') AS redeemed,
    (SELECT COUNT(*) FROM commerce_voucher_reservations r WHERE r.voucher_code = v.code AND r.status = 'reserved') AS reserved
    FROM commerce_vouchers v WHERE (? IS NULL OR v.batch = ?) ORDER BY v.created_at DESC, v.code LIMIT 200`).bind(batch, batch).all();
  return json({ vouchers: rows.results });
}

function voucherTerms(body: Record<string, unknown>, deps: AdminDeps) {
  const kind = body.kind;
  const amount = kind === "percent" && typeof body.amount === "string" && /^\d{1,3}$/.test(body.amount) ? Number(body.amount) : kind === "fixed" ? moneyCents(body.amount) : null;
  const minimum = moneyCents(body.minSubtotal);
  if ((kind !== "percent" && kind !== "fixed") || !integer(amount, 1, kind === "percent" ? 100 : 1_000_000)
    || !integer(minimum, 0, 1_000_000) || !(body.maxUses === null || integer(body.maxUses, 1, 1_000_000))
    || !(body.expiresAt === null || integer(body.expiresAt, deps.now() + 1, Number.MAX_SAFE_INTEGER))) return null;
  return { kind, amount: amount as number, minimum: minimum as number, maxUses: body.maxUses as number | null, expiresAt: body.expiresAt as number | null };
}
const insertVoucher = (deps: AdminDeps, code: string, terms: NonNullable<ReturnType<typeof voucherTerms>>, batch: string | null) => deps.db.prepare(`INSERT INTO commerce_vouchers (code, kind, amount, min_subtotal_cents, expires_at, max_uses, active, created_at, batch)
  VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?) ON CONFLICT(code) DO NOTHING RETURNING code`).bind(code, terms.kind, terms.amount, terms.minimum, terms.expiresAt, terms.maxUses, deps.now(), batch);

async function createVoucher(body: Record<string, unknown>, deps: AdminDeps) {
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "", terms = voucherTerms(body, deps);
  if (!CODE.test(code) || !terms) throw new HttpError(400, "Check the voucher code, value, minimum, usage limit and expiry.");
  if (!await insertVoucher(deps, code, terms, null).first()) throw new HttpError(409, "That voucher code already exists.");
  return json({ ok: true, code }, 201);
}

// No 0/O, 1/I/L: printed codes are typed back in by hand.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function randomCode(prefix: string) {
  const bytes = new Uint8Array(16); let code = "";
  while (code.length < 8) {
    crypto.getRandomValues(bytes);
    for (const byte of bytes) if (byte < 248 && code.length < 8) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return prefix ? `${prefix}-${code}` : code;
}

async function createVoucherSet(body: Record<string, unknown>, deps: AdminDeps) {
  const prefix = typeof body.prefix === "string" ? body.prefix.trim().toUpperCase() : "", terms = voucherTerms(body, deps);
  if (!integer(body.count, 1, 200) || !/^[A-Z0-9]{0,12}$/.test(prefix) || !terms) throw new HttpError(400, "Check how many codes, the prefix (letters and numbers, up to 12), value, minimum, uses per code and expiry.");
  const batch = crypto.randomUUID(), codes: string[] = [];
  // A random 8-character code collides with another voucher only in theory; conflicting rows are skipped and topped up.
  for (let round = 0; round < 5 && codes.length < (body.count as number); round++) {
    const wanted = Array.from({ length: (body.count as number) - codes.length }, () => randomCode(prefix));
    await deps.db.batch(wanted.map((code) => insertVoucher(deps, code, terms, batch)));
    codes.splice(0, codes.length, ...(await deps.db.prepare("SELECT code FROM commerce_vouchers WHERE batch = ?").bind(batch).all<{ code: string }>()).results.map((row) => row.code));
  }
  if (codes.length < (body.count as number)) throw new HttpError(503, "Some codes could not be created. Try again.");
  return json({ ok: true, batch, codes }, 201);
}

export function moneyCents(value: unknown) {
  if (typeof value !== "string" || !/^\d{1,6}(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

async function deactivateVoucher(body: Record<string, unknown>, deps: AdminDeps) {
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!CODE.test(code)) throw new HttpError(400, "Choose a valid voucher.");
  const row = await deps.db.prepare("UPDATE commerce_vouchers SET active = 0 WHERE code = ? RETURNING code").bind(code).first();
  if (!row) throw new HttpError(404, "That voucher could not be found.");
  return json({ ok: true });
}

async function inbox(request: Request, deps: AdminDeps) {
  const params = new URL(request.url).searchParams, id = params.get("id");
  if (id !== null) {
    if (!UUID.test(id)) throw new HttpError(400, "Choose a valid email.");
    const row = await deps.db.prepare("SELECT id, from_email, to_email, subject, text_body, attachment_names, received_at, forwarded_at, forward_error FROM commerce_inbox WHERE id = ?").bind(id).first<{ attachment_names: string } & Record<string, unknown>>();
    if (!row) throw new HttpError(404, "That email could not be found.");
    return json({ email: { ...row, attachment_names: JSON.parse(row.attachment_names) } });
  }
  const page = Number(params.get("page") ?? 1);
  if (!integer(page, 1, 10000)) throw new HttpError(400, "Choose a valid inbox page.");
  const rows = await deps.db.prepare("SELECT id, from_email, to_email, subject, received_at, forwarded_at, forward_error FROM commerce_inbox ORDER BY received_at DESC, id DESC LIMIT 51 OFFSET ?").bind((page - 1) * 50).all();
  return json({ emails: rows.results.slice(0, 50), page, hasMore: rows.results.length > 50 });
}

async function mailSettings(deps: AdminDeps, body?: Record<string, unknown>) {
  if (body) {
    if (typeof body.forwardingEnabled !== "boolean" || Object.keys(body).some((key) => key !== "forwardingEnabled")) throw new HttpError(400, "Choose whether incoming mail should be forwarded.");
    await deps.db.prepare("UPDATE commerce_mail_settings SET forward_enabled = ? WHERE id = 1").bind(body.forwardingEnabled ? 1 : 0).run();
  }
  const setting = await deps.db.prepare("SELECT forward_enabled FROM commerce_mail_settings WHERE id = 1").bind().first<{ forward_enabled: number }>();
  if (!setting) throw new HttpError(503, "Inbox settings are not configured.");
  return json({ forwardingEnabled: setting.forward_enabled === 1, destination: deps.forwardTo ?? "A66454385@gmail.com" });
}

async function inboxRaw(request: Request, deps: AdminDeps) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !UUID.test(id)) throw new HttpError(400, "Choose a valid email.");
  const row = await deps.db.prepare("SELECT message_id FROM commerce_inbox WHERE id = ?").bind(id).first<{ message_id: string }>();
  if (!row || !/^[a-f0-9]{64}$/.test(row.message_id)) throw new HttpError(404, "That original email could not be found.");
  if (!deps.getMailRaw) throw new HttpError(503, "Original email storage is not configured.");
  const raw = await deps.getMailRaw(`commerce-inbox/${row.message_id}.eml`);
  if (!raw) throw new HttpError(404, "That original email could not be found.");
  return new Response(raw, { headers: { "Content-Type": "message/rfc822", "Content-Disposition": 'attachment; filename="message.eml"', "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

async function cancelOrder(body: Record<string, unknown>, deps: AdminDeps) {
  const id = orderId(body.id);
  const order = await deps.db.prepare("SELECT status FROM commerce_orders WHERE id = ?").bind(id).first<{ status: string }>();
  if (!order) throw new HttpError(404, "That order could not be found.");
  if (order.status === "paid") throw new HttpError(409, "Paid orders cannot be cancelled here.");
  if (order.status === "cancelled") return json({ ok: true });
  if (!deps.cancelOrder) throw new HttpError(503, "Order cancellation is not configured.");
  try {
    const result = await deps.cancelOrder(id);
    if (!result || typeof result !== "object" || !("status" in result) || result.status !== "cancelled") throw new Error("unconfirmed cancellation");
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "already_paid") throw new HttpError(409, "Payment has been confirmed. Paid orders cannot be cancelled here.");
    if (code === "payment_not_cancellable") throw new HttpError(409, "This payment is being processed or cannot be cancelled. Keep the order open.");
    throw new HttpError(503, "The payment provider could not confirm cancellation. Keep the order open and try again.");
  }
  return json({ ok: true });
}

// Planning research stays in this server module and is delivered only after admin authentication.
const DELIVERY_NOTES = {
  checkedAt: "12 October 2026",
  introduction: "Hong Kong is the only launch market. These notes are planning evidence, not carrier approval or a shipping quotation.",
  sections: [
    { title: "Hong Kong launch", points: ["Customer home delivery is free; the HK$258 price includes it (previously HK$228 plus a HK$30 fee). Published ordinary parcel benchmarks do not establish acceptance or a price for this alcohol perfume.", "SF product and home/locker service acceptance remains unconfirmed. Obtain a written decision for the finished blend, packaging, route and delivery areas.", "Hongkong Post lists perfume among dangerous articles. Ordinary postal, Lalamove or GoGoX bookings do not establish an approved perfume service."] },
    { title: "Before requesting a quote", points: ["Obtain the finished-product SDS, composition, flash point and transport classification. Recipe alcohol/base proportions do not establish the finished perfume's ethanol concentration or classification.", "Measure the actual packed carton: gross weight and external length × width × height, including protection, blue gift box and artificial decorative flowers.", "Confirm the service, pickup/drop-off model, packaging, permitted locations, surcharges, glass/liquid compensation, exclusions, quote expiry and trial-shipment conditions."] },
    { title: "Locker planning", points: ["HK$25 is a published collection benchmark when SF collects from the sender; HK$16 depends on sender drop-off too. Both remain ordinary parcel benchmarks, not perfume quotations.", "Offer only carrier-approved location/service types. Store the location code and address, Hong Kong recipient phone, current collection instructions and overflow/redirection policy.", "Locker arrival and customer collection are separate events. Location access, capacity and collection periods vary."] },
    { title: "Preparation and delivery", points: ["The owner target is dispatch within 1–1.5 weeks and receipt within two weeks. Confirm calendar versus working days; preparation is separate from carrier transit.", "Timing is an estimate, not a guarantee. Send tracking after actual handover, using the accepted carrier's transit estimate and operating calendar.", "Keep proposed customer fee, quoted carrier cost, approved service, SDS/formula version, packaging version, weight/dimensions, quote expiry, evidence and approval status separate. Unknown values remain confirmation required."] },
    { title: "Mainland and international expansion", points: ["Mainland and international checkout destinations remain disabled. A personal/C2C tariff does not establish permission for repeated commercial perfume sales.", "A qualified broker must confirm the commercial import or eligible CBEC pathway, importer, cosmetics registration/filing, documentation, labeling and destination-specific requirements.", "DHL and FedEx perfume/dangerous-goods routes require product and account/service acceptance, suitable safety documents and destination-specific quotes. A nominal 10 mL bottle alone does not establish an exemption.", "Ask the broker to check the rules applicable on the actual shipping date, including the published GACC cosmetics notice taking effect on 1 December 2026."] },
  ],
  sources: [
    { label: "SF Hong Kong published parcel rates", url: "https://htm.sf-express.com/hk/tc/download/HK-Express-Service-Rate-sender-paid_20260130.pdf" },
    { label: "SF Hong Kong carriage terms", url: "https://htm.sf-express.com/hk/en/download/HKMOwb_TaC_EN.pdf" },
    { label: "SF locker directory", url: "https://hk.sf-express.com/hk/en/more/sf-locker" },
    { label: "Hongkong Post dangerous articles", url: "https://www.hongkongpost.hk/en/sending_mail/no_posting_da/index.html" },
    { label: "DHL Hong Kong perfume and SDS guidance", url: "https://www.dhl.com/discover/en-hk/logistics-advice/import-export-advice/everything-you-need-to-know-about-shipping-liquids-internationally" },
    { label: "FedEx Hong Kong dangerous goods", url: "https://www.fedex.com/en-hk/shipping/dangerous-goods.html" },
    { label: "NMPA cosmetics provisions", url: "https://english.nmpa.gov.cn/2022-06/30/c_785637.htm" },
    { label: "Hong Kong TID GACC notice, December 2026", url: "https://www.tid.gov.hk/en/tradecircular/2026/ci4542026.html?categoryId=27" },
  ],
  limitations: "Research used official carrier and government sources. No carrier or third party was contacted, no account approval or product acceptance was obtained, and no shipment was booked. The full private research records remain in the project; recheck date-sensitive facts before expansion.",
};

export async function handleAdmin(action: string, request: Request, deps: AdminDeps) {
  try {
    checkHost(request);
    if (!deps.username || !deps.passwordHash || !deps.sessionSecret || deps.sessionSecret.length < 32) throw new HttpError(503, "Admin sign-in is not configured.");
    if (action === "login") {
      if (request.method !== "POST") throw new HttpError(405, "Use the sign-in form.");
      return await login(request, deps);
    }
    const actor = await viewer(request, deps);
    if (!actor) throw new HttpError(401, "Sign in to continue.");
    if (["logout", "fulfillment", "shipped-email", "order-cancel", "voucher-create", "voucher-set-create", "voucher-deactivate"].includes(action) || FINANCE_POST.has(action) || (action === "mail-settings" && request.method === "POST")) {
      if (request.method !== "POST") throw new HttpError(405, "Use the admin form.");
      const body = await readJson(request);
      if (action === "logout") {
        await deps.db.prepare("DELETE FROM admin_sessions WHERE id_hash = ?").bind(await hash(tokenOf(request)!)).run();
        return json({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
      }
      if (FINANCE_POST.has(action)) return json(await financeAction(action, request, deps, actor, body));
      if (action === "fulfillment") return await fulfill(body, deps, actor);
      if (action === "shipped-email") return await resendShippedEmail(body, deps);
      if (action === "order-cancel") return await cancelOrder(body, deps);
      if (action === "voucher-create") return await createVoucher(body, deps);
      if (action === "voucher-set-create") return await createVoucherSet(body, deps);
      if (action === "mail-settings") return await mailSettings(deps, body);
      return await deactivateVoucher(body, deps);
    }
    if (request.method !== "GET") throw new HttpError(405, "Use the admin form.");
    if (FINANCE_GET.has(action)) {
      const result = await financeAction(action, request, deps, actor);
      return result instanceof Response ? result : json(result);
    }
    if (action === "status") return json({ ok: true, username: actor });
    if (action === "orders") return await orders(request, deps);
    if (action === "order") return await detail(request, deps);
    if (action === "vouchers") return await vouchers(request, deps);
    if (action === "inbox") return await inbox(request, deps);
    if (action === "inbox-raw") return await inboxRaw(request, deps);
    if (action === "mail-settings") return await mailSettings(deps);
    if (action === "delivery-notes") return json(DELIVERY_NOTES);
    throw new HttpError(404, "That admin action could not be found.");
  } catch (error) {
    if (error instanceof HttpError) return json({ ok: false, error: error.message }, error.status);
    console.warn("admin request failed");
    return json({ ok: false, error: "The request could not be completed. Please try again." }, 500);
  }
}
