import { productBySlug } from "./shop.ts";
import { MAIL, districtLine, escapeHtml, mailAddress, mailEyebrow, mailHeading, mailItems, mailLabel, mailLayout, mailLink, mailMuted, mailPanel, mailRule, mailSpace, mailText } from "./email-layout.ts";
import { HttpError, cleanText, integer, moneyCents, type AdminDeps } from "./admin.server.ts";

// Hong Kong has no daylight saving, so a fixed +8h offset gives its calendar dates.
const HK = 8 * 3600_000, DAY = 86_400_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/, MONTH = /^\d{4}-(?:0[1-9]|1[0-2])$/, PERCENT = /^\d{1,2}(?:\.\d{1,2})?$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const PAYMENT_METHODS = ["cash", "fps", "payme", "octopus", "card", "other"] as const;
const METHOD_NAMES: Record<string, string> = { cash: "Cash", fps: "FPS", payme: "PayMe", octopus: "Octopus", card: "Card", other: "Other" };

type Rate = { effective_from: number; airwallex_bp: number | null; airwallex_fixed_cents: number; partner_bp: number };
type OnlineOrder = { id: string; total_cents: number; items_json: string; paid_at: number; stage: string; shipping_cents: number | null };
type OnsiteDay = { id: string; place: string; day: string; stall_fee_cents: number; status: string; sales: number; bottles: number; sales_cents: number };

export const hkDate = (ms: number) => new Date(ms + HK).toISOString().slice(0, 10);
const startOf = (day: string) => Date.parse(`${day}T00:00:00+08:00`);
// Integer cents, rounded half up.
export const share = (cents: number, bp: number) => Math.floor((cents * bp + 5000) / 10000);
const nameOf = (slug: string) => productBySlug(slug)?.name ?? slug;

function date(value: unknown) {
  const at = typeof value === "string" && DATE.test(value) ? startOf(value) : NaN;
  if (!Number.isFinite(at) || hkDate(at) !== value) throw new HttpError(400, "Choose a valid date.");
  return value as string;
}
function range(params: URLSearchParams) {
  const from = date(params.get("from")), to = date(params.get("to"));
  const days = Math.round((startOf(to) - startOf(from)) / DAY) + 1;
  if (days < 1 || days > 731) throw new HttpError(400, "Choose a range of up to two years.");
  return { from, to, days, start: startOf(from), end: startOf(to) + DAY };
}
function optionalMoney(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const cents = moneyCents(value);
  if (cents === null) throw new HttpError(400, "Enter amounts in HK$, like 240 or 240.50.");
  return cents;
}
function percentBp(value: unknown, label: string) {
  if (typeof value !== "string" || !PERCENT.test(value)) throw new HttpError(400, `Enter the ${label} as a percentage, like 3.4.`);
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
const id = (value: unknown, message: string) => { if (typeof value !== "string" || !UUID.test(value)) throw new HttpError(400, message); return value; };

async function rates(deps: AdminDeps) {
  return (await deps.db.prepare("SELECT effective_from, airwallex_bp, airwallex_fixed_cents, partner_bp FROM admin_rates ORDER BY effective_from, id").all<Rate>()).results;
}
// The latest rate already in effect when the order was paid; later saves win ties.
const rateAt = (list: Rate[], at: number) => list.reduce<Rate | undefined>((found, rate) => rate.effective_from <= at ? rate : found, undefined) ?? list[0];
function orderCosts(order: Pick<OnlineOrder, "total_cents" | "paid_at">, list: Rate[]) {
  const rate = rateAt(list, order.paid_at);
  return { fee: rate.airwallex_bp === null ? null : share(order.total_cents, rate.airwallex_bp) + rate.airwallex_fixed_cents, partner: share(order.total_cents, rate.partner_bp) };
}

async function onlineOrders(deps: AdminDeps, start: number, end: number) {
  return (await deps.db.prepare(`SELECT o.id, o.total_cents, o.items_json, o.paid_at, COALESCE(f.status, 'new') AS stage, f.shipping_cents
    FROM commerce_orders o LEFT JOIN admin_order_fulfillment f ON f.order_id = o.id
    WHERE o.status = 'paid' AND o.mode = 'prod' AND o.paid_at >= ? AND o.paid_at < ? ORDER BY o.paid_at, o.id`).bind(start, end).all<OnlineOrder>()).results;
}
async function onsiteDays(deps: AdminDeps, from: string, to: string) {
  return (await deps.db.prepare(`SELECT d.id, d.place, d.day, d.stall_fee_cents, d.status, COUNT(s.id) AS sales,
    COALESCE(SUM(s.quantity), 0) AS bottles, COALESCE(SUM(s.quantity * s.unit_price_cents), 0) AS sales_cents
    FROM admin_onsite_days d LEFT JOIN admin_onsite_sales s ON s.day_id = d.id
    WHERE d.day >= ? AND d.day <= ? GROUP BY d.id ORDER BY d.day, d.created_at`).bind(from, to).all<OnsiteDay>()).results;
}

async function summary(deps: AdminDeps, span: ReturnType<typeof range>, list: Rate[]) {
  const orders = await onlineOrders(deps, span.start, span.end), days = await onsiteDays(deps, span.from, span.to);
  const online = { salesCents: 0, orders: orders.length, feeCents: 0, feeUnset: 0, partnerCents: 0, shippingCents: 0, awaitingDispatch: 0, missingShipping: [] as string[], keptCents: 0 };
  const sold = new Map<string, { name: string; quantity: number }>();
  const tally = (slug: string, name: string, quantity: number) => { const row = sold.get(slug) ?? { name, quantity: 0 }; row.quantity += quantity; sold.set(slug, row); };
  const monthly = span.days > 62, series = new Map<string, { key: string; cents: number; orders: number }>();
  for (let at = span.start; at < span.end; at += DAY) { const key = hkDate(at).slice(0, monthly ? 7 : 10); if (!series.has(key)) series.set(key, { key, cents: 0, orders: 0 }); }
  for (const order of orders) {
    const costs = orderCosts(order, list);
    online.salesCents += order.total_cents; online.partnerCents += costs.partner;
    if (costs.fee === null) online.feeUnset++; else online.feeCents += costs.fee;
    if (order.shipping_cents !== null) online.shippingCents += order.shipping_cents;
    else if (order.stage === "dispatched") online.missingShipping.push(order.id);
    else online.awaitingDispatch++;
    const point = series.get(hkDate(order.paid_at).slice(0, monthly ? 7 : 10));
    if (point) { point.cents += order.total_cents; point.orders++; }
    for (const item of JSON.parse(order.items_json) as { slug: string; name: string; quantity: number }[]) tally(item.slug, item.name, item.quantity);
  }
  online.keptCents = online.salesCents - online.feeCents - online.partnerCents - online.shippingCents;
  const onsite = { salesCents: 0, bottles: 0, stallCents: 0, keptCents: 0, days };
  for (const day of days) { onsite.salesCents += day.sales_cents; onsite.bottles += day.bottles; onsite.stallCents += day.stall_fee_cents; }
  onsite.keptCents = onsite.salesCents - onsite.stallCents;
  const scents = (await deps.db.prepare(`SELECT s.slug, SUM(s.quantity) AS quantity FROM admin_onsite_sales s JOIN admin_onsite_days d ON d.id = s.day_id
    WHERE d.day >= ? AND d.day <= ? GROUP BY s.slug`).bind(span.from, span.to).all<{ slug: string; quantity: number }>()).results;
  for (const row of scents) tally(row.slug, nameOf(row.slug), row.quantity);
  const bestSellers = [...sold].map(([slug, row]) => ({ slug, ...row })).sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name)).slice(0, 5);
  return { online, onsite, series: [...series.values()], monthly, bestSellers, grossCents: online.salesCents + onsite.salesCents, keptCents: online.keptCents + onsite.keptCents };
}

async function partnerMonths(deps: AdminDeps, list: Rate[]) {
  // shortcut: sums every paid live order in memory; move to per-month SQL once orders reach the tens of thousands.
  const orders = (await deps.db.prepare("SELECT total_cents, paid_at FROM commerce_orders WHERE status = 'paid' AND mode = 'prod' AND paid_at IS NOT NULL").all<{ total_cents: number; paid_at: number }>()).results;
  const owed = new Map<string, number>();
  for (const order of orders) { const month = hkDate(order.paid_at).slice(0, 7); owed.set(month, (owed.get(month) ?? 0) + orderCosts(order, list).partner); }
  const paid = (await deps.db.prepare("SELECT month, amount_cents, paid_at, paid_by FROM admin_partner_payouts").all<{ month: string; amount_cents: number; paid_at: number; paid_by: string }>()).results;
  const months = new Set([...owed.keys(), ...paid.map((row) => row.month)]);
  return [...months].sort().reverse().slice(0, 12).map((month) => {
    const payout = paid.find((row) => row.month === month);
    return { month, owedCents: owed.get(month) ?? 0, paidCents: payout?.amount_cents ?? null, paidAt: payout?.paid_at ?? null, paidBy: payout?.paid_by ?? null };
  });
}

const isoDay = (utc: number) => new Date(utc).toISOString().slice(0, 10);
// A calendar month or year compares with the one before; any other range with the same number of days just before it.
function previousRange(span: ReturnType<typeof range>) {
  const [year, month, day] = span.from.split("-").map(Number);
  if (day === 1 && span.to === isoDay(Date.UTC(year, month, 0))) return { from: isoDay(Date.UTC(year, month - 2, 1)), to: isoDay(Date.UTC(year, month - 1, 0)) };
  if (span.from === `${year}-01-01` && span.to === `${year}-12-31`) return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
  return { from: hkDate(span.start - span.days * DAY), to: hkDate(span.start - DAY) };
}

async function money(request: Request, deps: AdminDeps) {
  const span = range(new URL(request.url).searchParams), list = await rates(deps);
  const { from: previousFrom, to: previousTo } = previousRange(span);
  const [current, previous, partner] = await Promise.all([
    summary(deps, span, list),
    summary(deps, range(new URLSearchParams({ from: previousFrom, to: previousTo })), list),
    partnerMonths(deps, list),
  ]);
  return { from: span.from, to: span.to, ...current, previous: { from: previousFrom, to: previousTo, keptCents: previous.keptCents }, partner, rate: rateAt(list, deps.now()) };
}

const cell = (value: string | number) => {
  if (typeof value === "number" || /^-?\d+\.\d{2}$/.test(value)) return value;
  // Neutralise spreadsheet formulas in typed place names.
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};
const dollars = (cents: number | null) => cents === null ? "" : (cents / 100).toFixed(2);

async function moneyCsv(request: Request, deps: AdminDeps) {
  const span = range(new URL(request.url).searchParams), list = await rates(deps);
  const rows: (string | number)[][] = [["Date", "Channel", "Reference", "Items", "Bottles", "Sales (HK$)", "Payment method", "Airwallex fee est. (HK$)", "CJ share (HK$)", "Shipping (HK$)", "Stall fee (HK$)", "Kept (HK$)"]];
  for (const order of await onlineOrders(deps, span.start, span.end)) {
    const costs = orderCosts(order, list), items = JSON.parse(order.items_json) as { slug: string; name: string; quantity: number }[];
    rows.push([hkDate(order.paid_at), "Online", order.id, items.map((item) => `${item.name} × ${item.quantity}`).join("; "), items.reduce((sum, item) => sum + item.quantity, 0),
      dollars(order.total_cents), "Airwallex", dollars(costs.fee), dollars(costs.partner), dollars(order.shipping_cents), "",
      dollars(order.total_cents - (costs.fee ?? 0) - costs.partner - (order.shipping_cents ?? 0))]);
  }
  const sales = (await deps.db.prepare(`SELECT d.day, d.place, s.slug, s.quantity, s.unit_price_cents, s.payment_method FROM admin_onsite_sales s
    JOIN admin_onsite_days d ON d.id = s.day_id WHERE d.day >= ? AND d.day <= ? ORDER BY d.day, d.created_at, s.created_at`).bind(span.from, span.to)
    .all<{ day: string; place: string; slug: string; quantity: number; unit_price_cents: number; payment_method: string }>()).results;
  for (const sale of sales) rows.push([sale.day, "Onsite", sale.place, nameOf(sale.slug), sale.quantity, dollars(sale.quantity * sale.unit_price_cents), METHOD_NAMES[sale.payment_method], "", "", "", "", dollars(sale.quantity * sale.unit_price_cents)]);
  for (const day of await onsiteDays(deps, span.from, span.to)) if (day.stall_fee_cents) rows.push([day.day, "Onsite", day.place, "Stall fee", "", "", "", "", "", "", dollars(day.stall_fee_cents), dollars(-day.stall_fee_cents)]);
  const body = "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="yat-sales-${span.from}-to-${span.to}.csv"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

async function markPartnerPaid(body: Record<string, unknown>, deps: AdminDeps, actor: string) {
  if (typeof body.month !== "string" || !MONTH.test(body.month) || body.month > hkDate(deps.now()).slice(0, 7)) throw new HttpError(400, "Choose a month that has started.");
  const month = body.month, owed = (await partnerMonths(deps, await rates(deps))).find((row) => row.month === month)?.owedCents ?? 0;
  if (!owed) throw new HttpError(409, "Nothing is owed for that month.");
  // Marking again after later orders records the new full amount for the month.
  await deps.db.prepare(`INSERT INTO admin_partner_payouts (month, amount_cents, paid_at, paid_by) VALUES (?, ?, ?, ?)
    ON CONFLICT(month) DO UPDATE SET amount_cents = excluded.amount_cents, paid_at = excluded.paid_at, paid_by = excluded.paid_by`).bind(month, owed, deps.now(), actor).run();
  return { ok: true, month, amountCents: owed };
}
async function unmarkPartnerPaid(body: Record<string, unknown>, deps: AdminDeps) {
  if (typeof body.month !== "string" || !MONTH.test(body.month)) throw new HttpError(400, "Choose a valid month.");
  await deps.db.prepare("DELETE FROM admin_partner_payouts WHERE month = ?").bind(body.month).run();
  return { ok: true };
}

async function settings(deps: AdminDeps) {
  const list = await rates(deps);
  const history = (await deps.db.prepare("SELECT effective_from, airwallex_bp, airwallex_fixed_cents, partner_bp, created_by, created_at FROM admin_rates ORDER BY effective_from DESC, id DESC LIMIT 20").all()).results;
  return { current: rateAt(list, deps.now()), history };
}
async function saveSettings(body: Record<string, unknown>, deps: AdminDeps, actor: string) {
  const airwallex = body.airwallexPercent === "" ? null : percentBp(body.airwallexPercent, "Airwallex fee");
  const fixed = optionalMoney(body.airwallexFixed) ?? 0, partner = percentBp(body.partnerPercent, "CJ share");
  if ((airwallex !== null && airwallex > 2000) || fixed > 10000 || partner > 5000) throw new HttpError(400, "Check the rates: Airwallex up to 20%, fixed fee up to HK$100, CJ share up to 50%.");
  const from = startOf(date(body.from));
  await deps.db.prepare("INSERT INTO admin_rates (effective_from, airwallex_bp, airwallex_fixed_cents, partner_bp, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(from, airwallex, fixed, partner, actor, deps.now()).run();
  return settings(deps);
}

async function listDays(deps: AdminDeps) {
  // shortcut: newest 60 selling days; add paging when the history grows past a season.
  const days = (await deps.db.prepare(`SELECT d.id, d.place, d.day, d.usual_price_cents, d.stall_fee_cents, d.status, COUNT(s.id) AS sales,
    COALESCE(SUM(s.quantity), 0) AS bottles, COALESCE(SUM(s.quantity * s.unit_price_cents), 0) AS sales_cents
    FROM admin_onsite_days d LEFT JOIN admin_onsite_sales s ON s.day_id = d.id GROUP BY d.id ORDER BY d.day DESC, d.created_at DESC LIMIT 60`).all()).results;
  const places = (await deps.db.prepare("SELECT place FROM admin_onsite_days GROUP BY place ORDER BY MAX(created_at) DESC LIMIT 20").all<{ place: string }>()).results.map((row) => row.place);
  return { days, places, today: hkDate(deps.now()) };
}
async function getDay(request: Request, deps: AdminDeps) {
  const dayId = id(new URL(request.url).searchParams.get("id"), "Choose a valid selling day.");
  const day = await deps.db.prepare("SELECT id, place, day, usual_price_cents, stall_fee_cents, status, created_at, closed_at FROM admin_onsite_days WHERE id = ?").bind(dayId).first();
  if (!day) throw new HttpError(404, "That selling day could not be found.");
  const sales = (await deps.db.prepare("SELECT id, slug, quantity, unit_price_cents, payment_method, created_by, created_at, updated_at FROM admin_onsite_sales WHERE day_id = ? ORDER BY created_at DESC, id").bind(dayId).all()).results;
  return { day, sales };
}
function dayFields(body: Record<string, unknown>) {
  const place = cleanText(body.place, 120);
  if (!place) throw new HttpError(400, "Name the place or event.");
  return { place, day: date(body.day), usual: optionalMoney(body.usualPrice) };
}
async function createDay(body: Record<string, unknown>, deps: AdminDeps, actor: string) {
  const fields = dayFields(body), dayId = crypto.randomUUID(), now = deps.now();
  await deps.db.prepare("INSERT INTO admin_onsite_days (id, place, day, usual_price_cents, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(dayId, fields.place, fields.day, fields.usual, actor, now, now).run();
  return { ok: true, id: dayId };
}
async function updateDay(body: Record<string, unknown>, deps: AdminDeps) {
  const dayId = id(body.id, "Choose a valid selling day."), fields = dayFields(body), stall = optionalMoney(body.stallFee) ?? 0, now = deps.now();
  if (body.status !== "open" && body.status !== "closed") throw new HttpError(400, "Choose whether the day is open or closed.");
  const row = await deps.db.prepare(`UPDATE admin_onsite_days SET place = ?, day = ?, usual_price_cents = ?, stall_fee_cents = ?, status = ?, updated_at = ?,
    closed_at = CASE WHEN ? = 'closed' THEN COALESCE(closed_at, ?) ELSE NULL END WHERE id = ? RETURNING id`)
    .bind(fields.place, fields.day, fields.usual, stall, body.status, now, body.status, now, dayId).first();
  if (!row) throw new HttpError(404, "That selling day could not be found.");
  return { ok: true };
}
async function deleteDay(body: Record<string, unknown>, deps: AdminDeps) {
  const dayId = id(body.id, "Choose a valid selling day.");
  const row = await deps.db.prepare("DELETE FROM admin_onsite_days WHERE id = ? AND NOT EXISTS (SELECT 1 FROM admin_onsite_sales WHERE day_id = ?) RETURNING id").bind(dayId, dayId).first();
  if (!row) throw new HttpError(409, "Delete this day's sales first, or keep the day.");
  return { ok: true };
}
async function saveSale(body: Record<string, unknown>, deps: AdminDeps, actor: string) {
  const saleId = id(body.id, "Reload and record the sale again."), dayId = id(body.dayId, "Choose a valid selling day.");
  const price = moneyCents(body.unitPrice), method = body.method;
  if (typeof body.slug !== "string" || !productBySlug(body.slug)) throw new HttpError(400, "Choose a scent.");
  if (!integer(body.quantity, 1, 100)) throw new HttpError(400, "Choose a quantity from 1 to 100.");
  if (price === null || price > 10_000_000) throw new HttpError(400, "Enter the price each in HK$, like 240.");
  if (typeof method !== "string" || !(PAYMENT_METHODS as readonly string[]).includes(method)) throw new HttpError(400, "Choose how they paid.");
  const now = deps.now();
  // The same id updates the sale in place; it can never move a sale to another day.
  const saved = await deps.db.prepare(`INSERT INTO admin_onsite_sales (id, day_id, slug, quantity, unit_price_cents, payment_method, created_by, created_at, updated_at)
    SELECT ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM admin_onsite_days WHERE id = ?)
    ON CONFLICT(id) DO UPDATE SET slug = excluded.slug, quantity = excluded.quantity, unit_price_cents = excluded.unit_price_cents,
    payment_method = excluded.payment_method, updated_at = excluded.updated_at WHERE admin_onsite_sales.day_id = excluded.day_id RETURNING id`)
    .bind(saleId, dayId, body.slug, body.quantity as number, price, method, actor, now, now, dayId).first();
  if (!saved) throw new HttpError(404, "That selling day could not be found.");
  return { ok: true, id: saleId };
}
async function deleteSale(body: Record<string, unknown>, deps: AdminDeps) {
  await deps.db.prepare("DELETE FROM admin_onsite_sales WHERE id = ?").bind(id(body.id, "Choose a valid sale.")).run();
  return { ok: true };
}

export const FINANCE_POST = new Set(["partner-paid", "partner-unpaid", "settings-save", "onsite-day-create", "onsite-day-update", "onsite-day-delete", "onsite-sale-save", "onsite-sale-delete"]);
export const FINANCE_GET = new Set(["money", "money-csv", "settings", "onsite-days", "onsite-day"]);

export async function financeAction(action: string, request: Request, deps: AdminDeps, actor: string, body?: Record<string, unknown>): Promise<unknown> {
  if (body) {
    if (action === "partner-paid") return markPartnerPaid(body, deps, actor);
    if (action === "partner-unpaid") return unmarkPartnerPaid(body, deps);
    if (action === "settings-save") return saveSettings(body, deps, actor);
    if (action === "onsite-day-create") return createDay(body, deps, actor);
    if (action === "onsite-day-update") return updateDay(body, deps);
    if (action === "onsite-day-delete") return deleteDay(body, deps);
    if (action === "onsite-sale-save") return saveSale(body, deps, actor);
    return deleteSale(body, deps);
  }
  if (action === "money") return money(request, deps);
  if (action === "money-csv") return moneyCsv(request, deps);
  if (action === "settings") return settings(deps);
  if (action === "onsite-days") return listDays(deps);
  return getDay(request, deps);
}

const SHIPPED = {
  en: { subject: "Your YAT.LIFESTYLE order has shipped", lead: "Your order is on its way.", courier: "Courier", tracking: "Tracking number", order: "Order", to: "Delivering to",
    eyebrow: "Shipped", heading: "Your order is on its way.", body: "Your fragrances have left our studio. Use the tracking number below with the courier to follow the delivery.", items: "In this parcel", help: "Questions about this order? Reply to this email or write to" },
  "zh-Hant": { subject: "你的 YAT.LIFESTYLE 訂單已寄出", lead: "你的訂單已經寄出。", courier: "速遞公司", tracking: "追蹤編號", order: "訂單", to: "送貨地址",
    eyebrow: "已寄出", heading: "你的訂單已經寄出。", body: "你的香水已從我們的工作室寄出。請使用以下追蹤編號，向速遞公司查詢送貨進度。", items: "包裹內容", help: "對訂單有疑問？請直接回覆此電郵，或寫信至" },
  "zh-Hans": { subject: "你的 YAT.LIFESTYLE 订单已寄出", lead: "你的订单已经寄出。", courier: "快递公司", tracking: "追踪编号", order: "订单", to: "送货地址",
    eyebrow: "已寄出", heading: "你的订单已经寄出。", body: "你的香水已从我们的工作室寄出。请使用以下追踪编号，向快递公司查询配送进度。", items: "包裹内容", help: "对订单有疑问？请直接回复此邮件，或写信至" },
};
type ShippedDetails = { name: string; district: string; phone?: string; building?: string; street?: string };
export function shippedMail(orderId: string, locale: keyof typeof SHIPPED, courier: string, tracking: string, items: { slug: string; name: string; quantity: number }[], details: ShippedDetails) {
  const t = SHIPPED[locale] ?? SHIPPED.en, mailLocale = SHIPPED[locale] ? locale : "en";
  const text = `${t.lead}\n\n${t.courier}: ${courier}\n${t.tracking}: ${tracking}\n\n${items.map((item) => `${item.name} × ${item.quantity}`).join("\n")}\n\n${t.order}: ${orderId}\n${t.to}: ${details.name}, ${districtLine(details.district, mailLocale)}`;
  const label = `font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${MAIL.muted};`;
  const body = `${mailEyebrow(t.eyebrow)}${mailHeading(t.heading)}${mailText(t.body)}${mailSpace(24)}
${mailPanel([mailText(t.courier, label) + mailText(escapeHtml(courier), "font-size:16px;line-height:24px;"), mailText(t.tracking, label) + mailText(escapeHtml(tracking), "font-size:18px;font-weight:700;letter-spacing:1px;word-break:break-all;")])}
${mailLabel(t.items)}${mailItems(items.map(({ slug, name, quantity }) => ({ slug, name, quantity })), mailLocale)}
${mailLabel(t.to)}${mailAddress(details, mailLocale)}
${mailSpace(32)}${mailRule()}${mailSpace(16)}${mailMuted(`${t.order}: ${escapeHtml(orderId)}<br>${t.help} ${mailLink("mailto:orders@yatlifestyle.com", "orders@yatlifestyle.com")}.`)}`;
  return { subject: t.subject, text, html: mailLayout({ locale: mailLocale, preheader: `${t.tracking}: ${tracking}`, body }) };
}

/** Sends the customer's shipped email once per dispatched order. */
export async function sendShippedEmail(orderId: string, deps: AdminDeps): Promise<"sent" | "already" | "unavailable" | "failed"> {
  const claimed = await deps.db.prepare("UPDATE admin_order_fulfillment SET shipped_email_at = ? WHERE order_id = ? AND status = 'dispatched' AND shipped_email_at IS NULL RETURNING courier, tracking_number")
    .bind(deps.now(), orderId).first<{ courier: string; tracking_number: string }>();
  if (!claimed) return "already";
  const release = () => deps.db.prepare("UPDATE admin_order_fulfillment SET shipped_email_at = NULL WHERE order_id = ?").bind(orderId).run();
  if (!deps.sendEmail) { await release(); return "unavailable"; }
  try {
    const order = await deps.db.prepare("SELECT o.locale, o.email, o.items_json, COALESCE(d.details_json, o.details_json) AS details_json FROM commerce_orders o LEFT JOIN admin_order_details d ON d.order_id = o.id WHERE o.id = ?").bind(orderId).first<{ locale: keyof typeof SHIPPED; email: string; items_json: string; details_json: string }>();
    if (!order) throw new Error("order_missing");
    await deps.sendEmail({ to: order.email, from: { email: "orders@yatlifestyle.com", name: "YAT.LIFESTYLE" },
      ...shippedMail(orderId, order.locale, claimed.courier, claimed.tracking_number, JSON.parse(order.items_json), JSON.parse(order.details_json)) });
    // shortcut: a crash after the claim and before sending leaves the email marked sent; staff can see the timestamp and resend.
    return "sent";
  } catch {
    await release();
    return "failed";
  }
}
