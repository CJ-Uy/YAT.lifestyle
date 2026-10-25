import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { normalizeCart, productBySlug, formatDelivery, formatPrice, PRODUCTS, HK_DISTRICTS, PRICE_CENTS, DELIVERY_CENTS, MAX_PER_SCENT, MAX_BAG_COUNT, type CartItem } from "./shop.ts";
import { getVerifiedEmail } from "./checkout-email.server.ts";
import { MAIL, districtLine, escapeHtml, mailAddress, mailEyebrow, mailHeading, mailItems, mailLabel, mailLayout, mailMuted, mailRows } from "./email-layout.ts";

export type CommerceResult = { success: boolean; meta?: { changes?: number } };
export type CommerceStatement = {
  bind(...values: (string | number | null)[]): CommerceStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ success: boolean; results: T[] }>;
  run(): Promise<CommerceResult>;
};
export type CommerceDB = { prepare(sql: string): CommerceStatement; batch(statements: CommerceStatement[]): Promise<CommerceResult[]> };
export type CommerceEnv = {
  DB: CommerceDB;
  AIRWALLEX_CLIENT_ID?: string;
  AIRWALLEX_API_KEY?: string;
  AIRWALLEX_ACCOUNT_ID?: string;
  AIRWALLEX_MODE?: string;
  AIRWALLEX_WEBHOOK_SECRET?: string;
  COMMERCE_COOKIE_SECRET?: string;
  CHECKOUT_RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  EMAIL?: { send(message: { to: string; from: { email: string; name: string }; subject: string; text: string; html: string }): Promise<unknown> };
};

type Locale = "en" | "zh-Hant" | "zh-Hans";
type Mode = "prod" | "sandbox";
type WaitUntil = (promise: Promise<unknown>) => void;
type Details = { name: string; email: string; phone: string; district: string; building: string; street: string; notes: string; country: "HK" };
type OrderItem = CartItem & { name: string; unitPriceCents: number; lineTotalCents: number };
export type VoucherRow = { code: string; kind: "percent" | "fixed"; amount: number; min_subtotal_cents: number; expires_at: number | null; max_uses: number | null; active: number };
export type OrderRow = {
  id: string; request_id: string; request_digest: string; access_hash: string; access_expires_at: number; locale: Locale; email: string;
  details_json: string; items_json: string; subtotal_cents: number; delivery_cents: number; discount_cents: number; total_cents: number;
  currency: "HKD"; voucher_code: string | null; status: "unpaid" | "paid" | "cancelled" | "failed";
  payment_intent_id: string | null; payment_status: string | null; mode: Mode; return_origin: string;
  created_at: number; updated_at: number; paid_at: number | null; receipt_sent_at: number | null;
};
type Intent = { id: string; merchant_order_id: string; amount: number; currency: string; status: string; captured_amount?: number; client_secret?: string; latest_payment_attempt?: { status?: string } };
type Quote = { items: OrderItem[]; subtotalCents: number; deliveryCents: number; discountCents: number; totalCents: number; voucherCode: string | null };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const INTENT_ID = /^int_[A-Za-z0-9_]{8,120}$/;
const EMAIL = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;
const DISTRICTS = new Set<string>(HK_DISTRICTS.map(([id]) => id));
const ORDER_COLUMNS = "id, request_id, request_digest, access_hash, access_expires_at, locale, email, details_json, items_json, subtotal_cents, delivery_cents, discount_cents, total_cents, currency, voucher_code, status, payment_intent_id, payment_status, mode, return_origin, created_at, updated_at, paid_at, receipt_sent_at";
const tokens = new Map<string, { value: string; expires: number }>();
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) => Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", ...headers } });
class HttpError extends Error { status: number; code: string; constructor(status: number, code: string) { super(code); this.status = status; this.code = code; } }
class PaymentError extends Error { definitive: boolean; constructor(definitive = false) { super("payment_unavailable"); this.definitive = definitive; } }

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "invalid_request");
  return value as Record<string, unknown>;
}
function keys(body: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw new HttpError(400, "invalid_request");
}
async function rateLimit(env: CommerceEnv, key: string) {
  if (!env.CHECKOUT_RATE_LIMITER) throw new HttpError(503, "commerce_not_configured");
  if (!(await env.CHECKOUT_RATE_LIMITER.limit({ key })).success) throw new HttpError(429, "too_many_requests");
}
export function strictCart(value: unknown): CartItem[] {
  if (!Array.isArray(value) || !value.length || value.length > PRODUCTS.length) throw new HttpError(400, "invalid_cart");
  for (const raw of value) {
    const item = object(raw); keys(item, ["slug", "quantity"]);
    if (typeof item.slug !== "string" || !productBySlug(item.slug) || typeof item.quantity !== "number" || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_PER_SCENT) throw new HttpError(400, "invalid_cart");
  }
  const items = normalizeCart(value);
  if (items.length !== value.length || items.reduce((sum, item) => sum + item.quantity, 0) > MAX_BAG_COUNT
    || value.some((raw, index) => raw.quantity !== items[index].quantity)) throw new HttpError(400, "invalid_cart");
  return items.sort((a, b) => a.slug.localeCompare(b.slug));
}
function text(value: unknown, maximum: number, optional = false) {
  if (optional && value === undefined) return "";
  if (typeof value !== "string") throw new HttpError(400, "invalid_details");
  const trimmed = value.trim();
  if ((!optional && !trimmed) || trimmed.length > maximum || /[\u0000-\u001f\u007f]/.test(trimmed)) throw new HttpError(400, "invalid_details");
  return trimmed;
}
export function deliveryDetails(value: unknown): Details {
  const body = object(value); keys(body, ["name", "email", "phone", "district", "building", "street", "notes", "country"]);
  if (body.country !== undefined && body.country !== "HK") throw new HttpError(400, "invalid_details");
  const email = text(body.email, 254).toLowerCase(), district = text(body.district, 32);
  const phone = text(body.phone, 32).replace(/[\s()-]/g, "");
  const notes = body.notes === undefined ? "" : typeof body.notes === "string" ? body.notes.trim() : null;
  if (notes === null || notes.length > 1000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(notes)) throw new HttpError(400, "invalid_details");
  if (!EMAIL.test(email) || email.startsWith(".") || email.includes("..") || email.includes(".@") || !/^(?:\+852|00852)?\d{8}$/.test(phone) || !DISTRICTS.has(district)) throw new HttpError(400, "invalid_details");
  return { name: text(body.name, 120), email, phone: "+852" + phone.slice(-8), district, building: text(body.building, 300), street: text(body.street, 300, true), notes, country: "HK" };
}
function voucherCode(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new HttpError(400, "invalid_voucher");
  const code = value.trim().toUpperCase();
  if (!code) return null;
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) throw new HttpError(400, "invalid_voucher");
  return code;
}
export function discountFor(voucher: VoucherRow, subtotal: number, now: number): number {
  if (!Number.isSafeInteger(subtotal) || subtotal < 1 || voucher.active !== 1 || (voucher.expires_at !== null && voucher.expires_at <= now) || subtotal < voucher.min_subtotal_cents || !Number.isSafeInteger(voucher.amount) || voucher.amount < 1 || (voucher.kind !== "fixed" && voucher.kind !== "percent") || (voucher.kind === "percent" && voucher.amount > 100)) throw new HttpError(422, "voucher_unavailable");
  return Math.min(subtotal, voucher.kind === "percent" ? Math.floor(subtotal * voucher.amount / 100) : voucher.amount);
}
async function quote(items: CartItem[], code: string | null, env: CommerceEnv): Promise<Quote> {
  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * PRICE_CENTS, 0);
  let discountCents = 0;
  if (code) {
    const voucher = await env.DB.prepare("SELECT code, kind, amount, min_subtotal_cents, expires_at, max_uses, active FROM commerce_vouchers WHERE code = ?").bind(code).first<VoucherRow>();
    if (!voucher) throw new HttpError(422, "voucher_unavailable");
    discountCents = discountFor(voucher, subtotalCents, Date.now());
    const usage = await env.DB.prepare("SELECT COUNT(*) AS count FROM commerce_voucher_reservations WHERE voucher_code = ? AND status IN ('reserved', 'redeemed')").bind(code).first<{ count: number }>();
    if (voucher.max_uses !== null && (usage?.count ?? 0) >= voucher.max_uses) throw new HttpError(422, "voucher_unavailable");
  }
  return { items: items.map((item) => ({ ...item, name: productBySlug(item.slug)!.name, unitPriceCents: PRICE_CENTS, lineTotalCents: item.quantity * PRICE_CENTS })), subtotalCents, deliveryCents: DELIVERY_CENTS, discountCents, totalCents: subtotalCents + DELIVERY_CENTS - discountCents, voucherCode: code };
}
async function readBody(request: Request, limit = 16384): Promise<string> {
  if (Number(request.headers.get("content-length")) > limit) throw new HttpError(413, "request_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "invalid_request");
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > limit) { await reader.cancel(); throw new HttpError(413, "request_too_large"); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
}
async function readJson(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new HttpError(415, "json_required");
  try { return object(JSON.parse(await readBody(request))); } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, "invalid_request"); }
}
function paymentMode(env: CommerceEnv): Mode {
  if ((env.AIRWALLEX_MODE !== "prod" && env.AIRWALLEX_MODE !== "sandbox") || !env.AIRWALLEX_CLIENT_ID || !env.AIRWALLEX_API_KEY) throw new HttpError(503, "payments_not_configured");
  return env.AIRWALLEX_MODE;
}
function accessToken(order: Pick<OrderRow, "id" | "request_digest" | "email">, env: CommerceEnv): string {
  if (!env.COMMERCE_COOKIE_SECRET || env.COMMERCE_COOKIE_SECRET.length < 32) throw new HttpError(503, "payments_not_configured");
  return createHmac("sha256", env.COMMERCE_COOKIE_SECRET).update(`order\0${order.id}\0${order.request_digest}\0${order.email}`).digest("hex");
}
function orderCookie(order: OrderRow, env: CommerceEnv) {
  return `yat_order_${order.id}=${accessToken(order, env)}; Path=/; Max-Age=${Math.max(0, Math.floor((order.access_expires_at - Date.now()) / 1000))}; HttpOnly; Secure; SameSite=Lax`;
}
function ownsOrder(request: Request, order: OrderRow) {
  const token = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`yat_order_${order.id}=`))?.split("=")[1];
  return order.access_expires_at > Date.now() && !!token && /^[0-9a-f]{64}$/.test(token) && /^[0-9a-f]{64}$/.test(order.access_hash) && timingSafeEqual(Buffer.from(hash(token), "hex"), Buffer.from(order.access_hash, "hex"));
}
async function airwallex(path: string, mode: Mode, env: CommerceEnv, body?: unknown): Promise<unknown> {
  const base = mode === "prod" ? "https://api.airwallex.com" : "https://api.sandbox.airwallex.com";
  const cacheKey = `${base}:${env.AIRWALLEX_CLIENT_ID}:${hash(env.AIRWALLEX_API_KEY ?? "")}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    let cached = tokens.get(cacheKey);
    if (!cached || cached.expires < Date.now() + 60000) {
      const response = await fetch(`${base}/api/v1/authentication/login`, { method: "POST", headers: { "x-client-id": env.AIRWALLEX_CLIENT_ID!, "x-api-key": env.AIRWALLEX_API_KEY!, "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new PaymentError();
      const auth = await response.json() as { token?: string; expires_at?: string };
      const expiry = Date.parse(auth.expires_at ?? "");
      if (!auth.token || !Number.isFinite(expiry)) throw new PaymentError();
      cached = { value: auth.token, expires: expiry }; tokens.set(cacheKey, cached);
    }
    const response = await fetch(`${base}${path}`, { method: body === undefined ? "GET" : "POST", headers: { Authorization: `Bearer ${cached.value}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(15000) });
    if (response.status === 401 && attempt === 0) { tokens.delete(cacheKey); continue; }
    if (!response.ok) {
      const failure = await response.json().catch(() => ({})) as { code?: string };
      throw new PaymentError(response.status === 400 && ["validation_error", "currency_not_supported", "resource_not_found", "suspended_from_online_payments"].includes(failure.code ?? ""));
    }
    return response.json();
  }
  throw new PaymentError();
}
function cents(amount: unknown): number {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > .000001) throw new HttpError(503, "payment_mismatch");
  return Math.round(amount * 100);
}
export function validateIntent(value: unknown, order: Pick<OrderRow, "id" | "total_cents" | "currency" | "payment_intent_id">): Intent {
  const intent = object(value) as unknown as Intent;
  if (!INTENT_ID.test(intent.id ?? "") || (order.payment_intent_id && intent.id !== order.payment_intent_id) || intent.merchant_order_id !== order.id || intent.currency !== order.currency || cents(intent.amount) !== order.total_cents
    || !["REQUIRES_PAYMENT_METHOD", "REQUIRES_CUSTOMER_ACTION", "REQUIRES_CAPTURE", "PENDING", "PENDING_REVIEW", "SUCCEEDED", "CANCELLED"].includes(intent.status)
    || (intent.status === "SUCCEEDED" && intent.captured_amount !== undefined && cents(intent.captured_amount) !== order.total_cents)) throw new HttpError(503, "payment_mismatch");
  return intent;
}
async function findOrder(env: CommerceEnv, id: string) { return env.DB.prepare(`SELECT ${ORDER_COLUMNS} FROM commerce_orders WHERE id = ?`).bind(id).first<OrderRow>(); }
async function reconcile(order: OrderRow, intent: Intent, env: CommerceEnv, eventId?: string) {
  const now = Date.now();
  const failed = ["AUTHENTICATION_FAILED", "AUTHORIZATION_FAILED", "RISK_DECLINED", "FAILED_TO_PROCESS", "CAPTURE_FAILED", "EXPIRED"].includes(intent.latest_payment_attempt?.status ?? "");
  const status = intent.status === "SUCCEEDED" ? "paid" : intent.status === "CANCELLED" ? "cancelled" : failed ? "failed" : "unpaid";
  const statements = [env.DB.prepare(`UPDATE commerce_orders SET status = CASE WHEN status = 'paid' THEN status ELSE ? END,
    payment_status = CASE WHEN status = 'paid' THEN payment_status ELSE ? END,
    payment_intent_id = COALESCE(payment_intent_id, ?), updated_at = ?, paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, ?) ELSE paid_at END
    WHERE id = ? AND (payment_intent_id IS NULL OR payment_intent_id = ?)`).bind(status, intent.status, intent.id, now, status, now, order.id, intent.id),
    env.DB.prepare(`UPDATE commerce_voucher_reservations SET status = 'redeemed', updated_at = ? WHERE order_id = ? AND status = 'reserved' AND EXISTS (SELECT 1 FROM commerce_orders WHERE id = ? AND status = 'paid')`).bind(now, order.id, order.id),
    env.DB.prepare(`UPDATE commerce_voucher_reservations SET status = 'released', updated_at = ? WHERE order_id = ? AND status = 'reserved' AND EXISTS (SELECT 1 FROM commerce_orders WHERE id = ? AND status = 'cancelled')`).bind(now, order.id, order.id)];
  if (eventId) statements.push(env.DB.prepare("INSERT INTO commerce_webhook_events (id, order_id, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING").bind(eventId, order.id, now));
  const results = await env.DB.batch(statements);
  if (results.some((result) => !result.success)) throw new HttpError(503, "order_unavailable");
  const updated = await findOrder(env, order.id);
  if (!updated || updated.payment_intent_id !== intent.id) throw new HttpError(503, "payment_mismatch");
  return updated;
}
function orderView(order: OrderRow) {
  return { id: order.id, orderId: order.id, status: order.status, paymentStatus: order.payment_status, mode: order.mode, items: JSON.parse(order.items_json) as OrderItem[], details: JSON.parse(order.details_json) as Details,
    subtotalCents: order.subtotal_cents, deliveryCents: order.delivery_cents, discountCents: order.discount_cents, totalCents: order.total_cents, currency: order.currency, voucherCode: order.voucher_code, createdAt: order.created_at, paidAt: order.paid_at };
}
const RECEIPT = {
  en: { subject: "Your YAT.LIFESTYLE payment confirmation", lead: "Payment received. Thank you for your order.", eyebrow: "Order confirmed", thanks: (name: string) => `Thank you, ${name}.`,
    body: "We have received your payment and are preparing your order. It is estimated to arrive within 2 weeks.", reference: "Order reference", summary: "Your order", pack: "Each: 10 mL perfume · blue gift box · artificial flowers",
    subtotal: "Items subtotal", discount: "Voucher", delivery: "Hong Kong delivery", total: "Total paid", to: "Delivering to", help: "Questions about this order? Reply to this email or write to" },
  "zh-Hant": { subject: "YAT.LIFESTYLE 付款確認", lead: "已收到付款，感謝你的訂單。", eyebrow: "訂單已確認", thanks: (name: string) => `謝謝你，${name}。`,
    body: "我們已收到付款，正在準備你的訂單，預計兩星期內送達。", reference: "訂單編號", summary: "訂單明細", pack: "每份：10 mL 香水 · 藍色禮盒 · 人造花",
    subtotal: "商品小計", discount: "優惠碼", delivery: "香港送貨", total: "已付總額", to: "送貨地址", help: "對訂單有疑問？請直接回覆此電郵，或寫信至" },
  "zh-Hans": { subject: "YAT.LIFESTYLE 付款确认", lead: "已收到付款，感谢你的订单。", eyebrow: "订单已确认", thanks: (name: string) => `谢谢你，${name}。`,
    body: "我们已收到付款，正在准备你的订单，预计两星期内送达。", reference: "订单编号", summary: "订单明细", pack: "每份：10 mL 香水 · 蓝色礼盒 · 人造花",
    subtotal: "商品小计", discount: "优惠码", delivery: "香港配送", total: "已付总额", to: "配送地址", help: "对订单有疑问？请直接回复此邮件，或写信至" },
};
export function receiptMail(order: OrderRow) {
  const t = RECEIPT[order.locale] ?? RECEIPT.en, items = JSON.parse(order.items_json) as OrderItem[], details = JSON.parse(order.details_json) as Details;
  const rows: [string, string][] = [[t.subtotal, formatPrice(order.subtotal_cents)], ...(order.discount_cents > 0 ? [[`${t.discount}${order.voucher_code ? ` · ${order.voucher_code}` : ""}`, `−${formatPrice(order.discount_cents)}`] as [string, string]] : []),
    [t.delivery, formatDelivery(order.delivery_cents, order.locale)], [t.total, formatPrice(order.total_cents)]];
  const text = `${t.lead}\n${t.reference}: ${order.id}\n\n${items.map((item) => `${item.name} × ${item.quantity}  ${formatPrice(item.lineTotalCents)}`).join("\n")}\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${t.to}:\n${[details.name, details.phone, details.building, details.street, districtLine(details.district, order.locale)].filter(Boolean).join("\n")}\n\n${t.help} orders@yatlifestyle.com`;
  const body = `${mailEyebrow(t.eyebrow)}${mailHeading(t.thanks(details.name))}<p style="margin:0 0 12px;">${t.body}</p>${mailMuted(`${t.reference}: ${escapeHtml(order.id)}`)}
${mailLabel(t.summary)}${mailItems(items, order.locale)}<div style="padding:12px 0 18px;">${mailMuted(t.pack)}</div>${mailRows(rows, true)}
${mailLabel(t.to)}${mailAddress(details, order.locale)}
<div style="margin-top:32px;padding-top:16px;border-top:1px solid ${MAIL.rule};">${mailMuted(`${t.help} <a href="mailto:orders@yatlifestyle.com" style="color:${MAIL.gold};">orders@yatlifestyle.com</a>.`)}</div>`;
  return { subject: t.subject, text, html: mailLayout({ locale: order.locale, preheader: `${t.eyebrow} · ${formatPrice(order.total_cents)}`, body }) };
}
async function sendReceipt(order: OrderRow, env: CommerceEnv): Promise<boolean> {
  if (order.mode === "sandbox" || order.status !== "paid" || order.receipt_sent_at !== null) return true;
  if (!env.EMAIL) return false;
  const now = Date.now();
  const claimed = await env.DB.prepare(`UPDATE commerce_orders SET receipt_lock_until = ? WHERE id = ? AND status = 'paid' AND receipt_sent_at IS NULL AND (receipt_lock_until IS NULL OR receipt_lock_until < ?) RETURNING id`).bind(now + 60000, order.id, now).first<{ id: string }>();
  if (!claimed) return true;
  try {
    await env.EMAIL.send({ to: order.email, from: { email: "orders@yatlifestyle.com", name: "YAT.LIFESTYLE" }, ...receiptMail(order) });
    // shortcut: a crash between send and this write can repeat a receipt; use provider idempotency if it becomes necessary.
    const saved = await env.DB.prepare("UPDATE commerce_orders SET receipt_sent_at = ?, receipt_lock_until = NULL WHERE id = ? AND receipt_sent_at IS NULL").bind(Date.now(), order.id).run();
    if (!saved.success) throw new Error("receipt_write_failed");
    return true;
  } catch { await env.DB.prepare("UPDATE commerce_orders SET receipt_lock_until = NULL WHERE id = ? AND receipt_sent_at IS NULL").bind(order.id).run(); return false; }
}
export async function retryPendingReceipts(env: CommerceEnv) {
  const result = await env.DB.prepare(`SELECT ${ORDER_COLUMNS} FROM commerce_orders WHERE mode = 'prod' AND status = 'paid' AND receipt_sent_at IS NULL ORDER BY paid_at LIMIT 50`).all<OrderRow>();
  for (const order of result.results) await sendReceipt(order, env);
}
export async function syncPendingOrders(env: CommerceEnv, limit = 5) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) throw new RangeError("Invalid reconciliation limit");
  const mode = paymentMode(env);
  const result = await env.DB.prepare(`SELECT ${ORDER_COLUMNS} FROM commerce_orders WHERE status IN ('unpaid', 'failed') AND payment_intent_id IS NOT NULL AND mode = ? ORDER BY updated_at LIMIT ?`).bind(mode, limit).all<OrderRow>();
  await Promise.allSettled(result.results.map(async (order) => {
    const intent = validateIntent(await airwallex(`/api/v1/pa/payment_intents/${order.payment_intent_id}`, order.mode, env), order);
    await sendReceipt(await reconcile(order, intent, env), env);
  }));
}
export async function cancelUnpaidOrder(env: CommerceEnv, id: string) {
  if (!UUID.test(id)) throw new HttpError(400, "invalid_order");
  let order = await findOrder(env, id);
  if (!order) throw new HttpError(404, "order_not_found");
  if (paymentMode(env) !== order.mode) throw new HttpError(503, "payments_not_configured");
  if (!order.payment_intent_id) {
    // Staff recovery replays the immutable original request; it never creates a second payable order.
    order = await reconcile(order, await ensureIntent(order, env), env);
  }
  let intent = validateIntent(await airwallex(`/api/v1/pa/payment_intents/${order.payment_intent_id}`, order.mode, env), order);
  order = await reconcile(order, intent, env);
  if (order.status === "paid") { await sendReceipt(order, env); throw new HttpError(409, "already_paid"); }
  if (order.status === "cancelled") return { id: order.id, status: order.status, paymentStatus: order.payment_status };
  if (!["REQUIRES_PAYMENT_METHOD", "REQUIRES_CUSTOMER_ACTION", "REQUIRES_CAPTURE"].includes(intent.status)) throw new HttpError(409, "payment_not_cancellable");
  try {
    await airwallex(`/api/v1/pa/payment_intents/${intent.id}/cancel`, order.mode, env, { request_id: crypto.randomUUID(), cancellation_reason: "Cancelled by store administrator" });
  } catch {
    // A lost cancellation response is resolved by retrieval; never release a still-payable voucher slot.
  }
  intent = validateIntent(await airwallex(`/api/v1/pa/payment_intents/${intent.id}`, order.mode, env), order);
  order = await reconcile(order, intent, env);
  if (order.status === "paid") { await sendReceipt(order, env); throw new HttpError(409, "already_paid"); }
  if (order.status !== "cancelled") throw new HttpError(503, "cancellation_not_confirmed");
  return { id: order.id, status: order.status, paymentStatus: order.payment_status };
}
async function ensureIntent(order: OrderRow, env: CommerceEnv): Promise<Intent> {
  if (order.status === "paid") throw new HttpError(409, "already_paid");
  if (order.status === "cancelled" || (order.status === "failed" && !order.payment_intent_id && order.voucher_code && !(await env.DB.prepare("SELECT order_id FROM commerce_voucher_reservations WHERE order_id = ? AND status = 'reserved'").bind(order.id).first()))) throw new HttpError(410, "order_closed");
  if (order.payment_intent_id) return validateIntent(await airwallex(`/api/v1/pa/payment_intents/${order.payment_intent_id}`, order.mode, env), order);
  const now = Date.now();
  const locked = await env.DB.prepare("UPDATE commerce_orders SET intent_lock_until = ?, status = 'unpaid' WHERE id = ? AND status IN ('unpaid', 'failed') AND payment_intent_id IS NULL AND (intent_lock_until IS NULL OR intent_lock_until < ?) RETURNING id").bind(now + 60000, order.id, now).first<{ id: string }>();
  if (!locked) throw new HttpError(409, "payment_pending");
  try {
    const intent = validateIntent(await airwallex("/api/v1/pa/payment_intents/create", order.mode, env, { request_id: order.request_id, amount: order.total_cents / 100, currency: order.currency, merchant_order_id: order.id, return_url: `${order.return_origin}/order?id=${order.id}` }), order);
    if (!intent.client_secret || typeof intent.client_secret !== "string" || intent.client_secret.length > 8192) throw new PaymentError();
    const saved = await env.DB.prepare("UPDATE commerce_orders SET payment_intent_id = ?, payment_status = ?, intent_lock_until = NULL, updated_at = ? WHERE id = ? AND (payment_intent_id IS NULL OR payment_intent_id = ?)").bind(intent.id, intent.status, Date.now(), order.id, intent.id).run();
    if (!saved.success) throw new HttpError(503, "order_unavailable");
    return intent;
  } catch (error) {
    const statements = [env.DB.prepare("UPDATE commerce_orders SET status = CASE WHEN status = 'paid' THEN status ELSE 'failed' END, intent_lock_until = NULL, updated_at = ? WHERE id = ? AND payment_intent_id IS NULL").bind(Date.now(), order.id)];
    if (error instanceof PaymentError && error.definitive) statements.push(env.DB.prepare("UPDATE commerce_voucher_reservations SET status = 'released', updated_at = ? WHERE order_id = ? AND status = 'reserved' AND EXISTS (SELECT 1 FROM commerce_orders WHERE id = ? AND payment_intent_id IS NULL AND status = 'failed')").bind(Date.now(), order.id, order.id));
    await env.DB.batch(statements); throw error;
  }
}
function paymentView(order: OrderRow, intent: Intent) {
  if (order.status === "paid") throw new HttpError(409, "already_paid");
  if (order.status === "cancelled") throw new HttpError(410, "order_closed");
  if (!intent.client_secret || typeof intent.client_secret !== "string" || intent.client_secret.length > 8192) throw new PaymentError();
  return { orderId: order.id, intentId: intent.id, clientSecret: intent.client_secret, mode: order.mode, successUrl: `${order.return_origin}/order?id=${order.id}`, cancelUrl: `${order.return_origin}/order?id=${order.id}&cancelled=1`, totalCents: order.total_cents };
}

export async function handleCommerce(action: string, request: Request, env: CommerceEnv, waitUntil: WaitUntil = () => {}) {
  let cookie: string | undefined;
  let orderId: string | undefined;
  try {
    if (action === "order") {
      if (request.method !== "GET") throw new HttpError(405, "method_not_allowed");
      const id = new URL(request.url).searchParams.get("id") ?? "";
      if (!UUID.test(id)) throw new HttpError(400, "invalid_order");
      let order = await findOrder(env, id);
      if (!order || !ownsOrder(request, order)) throw new HttpError(404, "order_not_found");
      if (order.payment_intent_id && order.status !== "paid" && order.status !== "cancelled") {
        if (paymentMode(env) !== order.mode) throw new HttpError(503, "payments_not_configured");
        const intent = validateIntent(await airwallex(`/api/v1/pa/payment_intents/${order.payment_intent_id}`, order.mode, env), order);
        order = await reconcile(order, intent, env);
      }
      waitUntil(sendReceipt(order, env));
      return json(orderView(order));
    }
    if (action !== "quote" && action !== "create" && action !== "resume") throw new HttpError(404, "not_found");
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed");
    const origin = new URL(request.url).origin;
    if (request.headers.get("origin") !== origin) throw new HttpError(403, "origin_mismatch");
    await rateLimit(env, `commerce:${action}:ip:${request.headers.get("cf-connecting-ip") || "local"}`);
    const body = await readJson(request);
    if (action === "resume") {
      keys(body, ["id"]);
      if (typeof body.id !== "string" || !UUID.test(body.id)) throw new HttpError(400, "invalid_order");
      let order = await findOrder(env, body.id);
      if (!order || !ownsOrder(request, order)) throw new HttpError(404, "order_not_found");
      if (paymentMode(env) !== order.mode) throw new HttpError(503, "payments_not_configured");
      const intent = await ensureIntent(order, env);
      order = await reconcile(order, intent, env);
      waitUntil(sendReceipt(order, env));
      return json(paymentView(order, intent));
    }
    keys(body, action === "quote" ? ["items", "voucher"] : ["items", "voucher", "details", "locale", "requestId"]);
    const items = strictCart(body.items), code = voucherCode(body.voucher);
    if (action === "quote") return json(await quote(items, code, env));
    const mode = paymentMode(env), details = deliveryDetails(body.details);
    if (mode === "prod" && !["https://yatlifestyle.com", "https://www.yatlifestyle.com"].includes(origin)) throw new HttpError(403, "production_origin_required");
    if (!env.COMMERCE_COOKIE_SECRET || env.COMMERCE_COOKIE_SECRET.length < 32) throw new HttpError(503, "payments_not_configured");
    if (!UUID.test(typeof body.requestId === "string" ? body.requestId : "") || !["en", "zh-Hant", "zh-Hans"].includes(String(body.locale))) throw new HttpError(400, "invalid_request");
    if (await getVerifiedEmail(request, env) !== details.email) throw new HttpError(401, "email_verification_required");
    await rateLimit(env, `commerce:create:email:${hash(details.email)}`);
    const requestId = body.requestId as string, locale = body.locale as Locale;
    const digest = hash(JSON.stringify({ items, voucher: code, details, locale, mode, origin }));
    let order = await env.DB.prepare(`SELECT ${ORDER_COLUMNS} FROM commerce_orders WHERE request_id = ?`).bind(requestId).first<OrderRow>();
    if (!order) {
      const priced = await quote(items, code, env), now = Date.now(), id = crypto.randomUUID();
      const accessHash = hash(accessToken({ id, request_digest: digest, email: details.email }, env));
      const statements = [env.DB.prepare(`INSERT INTO commerce_orders (id, request_id, request_digest, access_hash, access_expires_at, locale, email, details_json, items_json, subtotal_cents, delivery_cents, discount_cents, total_cents, voucher_code, mode, return_origin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, requestId, digest, accessHash, now + 2592000000, locale, details.email, JSON.stringify(details), JSON.stringify(priced.items), priced.subtotalCents, priced.deliveryCents, priced.discountCents, priced.totalCents, code, mode, origin, now, now)];
      if (code) statements.push(env.DB.prepare("INSERT INTO commerce_voucher_reservations (order_id, voucher_code, status, created_at, updated_at) VALUES (?, ?, 'reserved', ?, ?)").bind(id, code, now, now));
      try { const result = await env.DB.batch(statements); if (result.some((entry) => !entry.success)) throw new Error("order_insert_failed"); }
      catch { order = await env.DB.prepare(`SELECT ${ORDER_COLUMNS} FROM commerce_orders WHERE request_id = ?`).bind(requestId).first<OrderRow>(); if (!order) throw new HttpError(code ? 422 : 503, code ? "voucher_unavailable" : "order_unavailable"); }
      order ??= await findOrder(env, id);
    }
    if (!order) throw new HttpError(503, "order_unavailable");
    if (order.email !== details.email || order.request_digest !== digest) throw new HttpError(409, "request_conflict");
    cookie = orderCookie(order, env);
    orderId = order.id;
    const intent = await ensureIntent(order, env);
    order = await reconcile(order, intent, env);
    waitUntil(sendReceipt(order, env));
    return json(paymentView(order, intent), 200, { "Set-Cookie": cookie });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 503, code = error instanceof HttpError ? error.code : "payment_unavailable";
    return json({ ok: false, error: code, ...(orderId ? { orderId } : {}) }, status, { ...(cookie ? { "Set-Cookie": cookie } : {}), ...(code === "payment_pending" ? { "Retry-After": "2" } : status === 429 ? { "Retry-After": "60" } : {}) });
  }
}

export function validWebhookSignature(raw: string, timestamp: string | null, signature: string | null, secret: string | undefined, now = Date.now()) {
  if (!secret || !timestamp || !/^\d{13}$/.test(timestamp) || !signature || !/^[0-9a-fA-F]{64}$/.test(signature) || Math.abs(now - Number(timestamp)) > 300000) return false;
  const expected = createHmac("sha256", secret).update(timestamp + raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export async function handleAirwallexWebhook(request: Request, env: CommerceEnv, waitUntil: WaitUntil = () => {}) {
  try {
    if (request.method !== "POST") throw new HttpError(405, "method_not_allowed");
    if (!env.AIRWALLEX_WEBHOOK_SECRET) throw new HttpError(503, "webhook_not_configured");
    const raw = await readBody(request, 262144);
    if (!validWebhookSignature(raw, request.headers.get("x-timestamp"), request.headers.get("x-signature"), env.AIRWALLEX_WEBHOOK_SECRET)) throw new HttpError(400, "invalid_signature");
    let event: Record<string, unknown>;
    try { event = object(JSON.parse(raw)); } catch { throw new HttpError(400, "invalid_event"); }
    if (env.AIRWALLEX_ACCOUNT_ID && (event.account_id ?? event.accountId) !== env.AIRWALLEX_ACCOUNT_ID) throw new HttpError(400, "unexpected_account");
    if (typeof event.id !== "string" || !/^[A-Za-z0-9_-]{1,160}$/.test(event.id) || typeof event.name !== "string") throw new HttpError(400, "invalid_event");
    if (!event.name.startsWith("payment_intent.") && !event.name.startsWith("payment_attempt.")) return json({ ok: true });
    const data = object(object(event.data).object), id = event.name.startsWith("payment_intent.") ? data.id : data.payment_intent_id;
    if (typeof id !== "string" || !INTENT_ID.test(id)) throw new HttpError(400, "invalid_event");
    let order = await env.DB.prepare(`SELECT ${ORDER_COLUMNS} FROM commerce_orders WHERE payment_intent_id = ?`).bind(id).first<OrderRow>();
    if (!order && typeof data.merchant_order_id === "string" && UUID.test(data.merchant_order_id)) order = await findOrder(env, data.merchant_order_id);
    if (!order) return json({ ok: true });
    if (paymentMode(env) !== order.mode) throw new HttpError(503, "payments_not_configured");
    const seen = await env.DB.prepare("SELECT id FROM commerce_webhook_events WHERE id = ?").bind(event.id).first<{ id: string }>();
    if (!seen) {
      const intent = validateIntent(await airwallex(`/api/v1/pa/payment_intents/${id}`, order.mode, env), { ...order, payment_intent_id: order.payment_intent_id ?? id });
      order = await reconcile(order, intent, env, event.id);
    }
    const receipt = sendReceipt(order, env); waitUntil(receipt);
    if (!await receipt) throw new HttpError(503, "receipt_pending");
    return json({ ok: true });
  } catch (error) { return json({ ok: false, error: error instanceof HttpError ? error.code : "webhook_unavailable" }, error instanceof HttpError ? error.status : 503); }
}
