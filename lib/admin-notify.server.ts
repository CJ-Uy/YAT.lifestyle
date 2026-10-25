import type { CommerceDB } from "./commerce.server.ts";
import { formatPrice } from "./shop.ts";

export type Mailer = (message: { to: string; from: { email: string; name: string }; subject: string; text: string; html: string }) => Promise<unknown>;
export type NotifyDeps = { db: CommerceDB; sendEmail?: Mailer; defaultTo?: string; now: () => number };
export type NotifySettings = { digest_enabled: number; digest_time: string; digest_email: string | null; last_sent_day: string | null; last_run_at: number | null; last_count: number | null; last_error: string | null };
type UnseenOrder = { id: string; total_cents: number; items_json: string; details_json: string; paid_at: number };
export type DigestResult = "disabled" | "not-due" | "already-sent" | "none" | "sent" | "unavailable" | "failed";

const ADMIN_URL = "https://admin.yatlifestyle.com/admin", LISTED = 20;
// Hong Kong has no daylight saving, so a fixed +8h offset gives its local date and time.
const hk = (ms: number) => { const iso = new Date(ms + 8 * 3600_000).toISOString(); return { day: iso.slice(0, 10), time: iso.slice(11, 16) }; };
const when = (ms: number) => new Intl.DateTimeFormat("en-HK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Hong_Kong" }).format(ms);
const district = (slug: string) => slug.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));
const UNSEEN = "FROM commerce_orders o WHERE o.status = 'paid' AND o.mode = 'prod' AND NOT EXISTS (SELECT 1 FROM admin_order_seen s WHERE s.order_id = o.id)";

export const notifySettings = (db: CommerceDB) => db.prepare("SELECT digest_enabled, digest_time, digest_email, last_sent_day, last_run_at, last_count, last_error FROM admin_notify_settings WHERE id = 1").bind().first<NotifySettings>();
export async function unseenCount(db: CommerceDB) {
  return (await db.prepare(`SELECT COUNT(*) AS count ${UNSEEN}`).bind().first<{ count: number }>())?.count ?? 0;
}

export function digestMessage(orders: UnseenOrder[], count: number, to: string, test = false) {
  const lines = orders.slice(0, LISTED).map((order) => {
    const items = (JSON.parse(order.items_json) as { name: string; quantity: number }[]).map((item) => `${item.name} × ${item.quantity}`).join(", ");
    return `• ${when(order.paid_at)} · ${items} · ${formatPrice(order.total_cents)} · ${district((JSON.parse(order.details_json) as { district: string }).district)}`;
  });
  if (count > LISTED) lines.push(`…and ${count - LISTED} more`);
  const subject = test ? "Test: YAT.LIFESTYLE daily order email" : `${count} new YAT.LIFESTYLE order${count === 1 ? "" : "s"} to review`;
  const lead = count ? `${count} paid order${count === 1 ? " has" : "s have"} not been opened in the admin yet:` : "There are no unopened paid orders right now.";
  const text = `${test ? "This is a test of the daily order email.\n\n" : ""}${lead}\n\n${lines.join("\n")}${lines.length ? "\n\n" : ""}Open the admin: ${ADMIN_URL}\n\nOrders count as seen once Natasha opens them in the admin. Change the time or turn this email off in Admin → Settings.`;
  return { to, from: { email: "orders@yatlifestyle.com", name: "YAT.lifestyle admin" }, subject, text, html: `<p>${escapeHtml(text).replaceAll("\n", "<br>").replace(escapeHtml(ADMIN_URL), `<a href="${ADMIN_URL}">${ADMIN_URL}</a>`)}</p>` };
}

/** Sends the day's email of unopened paid orders once, at or after the saved Hong Kong time. `test` sends immediately and leaves the daily schedule alone. */
export async function runDailyDigest(deps: NotifyDeps, test = false): Promise<{ result: DigestResult; count?: number }> {
  const settings = await notifySettings(deps.db), now = deps.now(), today = hk(now);
  if (!settings) return { result: "unavailable" };
  if (!test && !settings.digest_enabled) return { result: "disabled" };
  if (!test && today.time < settings.digest_time) return { result: "not-due" };
  // Claiming the date first keeps overlapping cron runs from sending twice.
  if (!test && !await deps.db.prepare("UPDATE admin_notify_settings SET last_sent_day = ?, last_run_at = ? WHERE id = 1 AND (last_sent_day IS NULL OR last_sent_day <> ?) RETURNING id").bind(today.day, now, today.day).first()) return { result: "already-sent" };
  const record = (count: number | null, error: string | null, releaseDay: boolean) => deps.db.prepare(`UPDATE admin_notify_settings SET last_count = ?, last_error = ?${releaseDay ? ", last_sent_day = ?" : ""} WHERE id = 1`)
    .bind(...(releaseDay ? [count, error, settings.last_sent_day] : [count, error])).run();
  const count = await unseenCount(deps.db);
  if (!count && !test) { await record(0, null, false); return { result: "none", count }; }
  const to = settings.digest_email ?? deps.defaultTo;
  if (!deps.sendEmail || !to) { await record(count, "Email sending is not configured.", !test); return { result: "unavailable", count }; }
  const orders = (await deps.db.prepare(`SELECT o.id, o.total_cents, o.items_json, o.details_json, o.paid_at ${UNSEEN} ORDER BY o.paid_at DESC LIMIT ?`).bind(LISTED).all<UnseenOrder>()).results;
  try {
    await deps.sendEmail(digestMessage(orders, count, to, test));
  } catch {
    // Releasing the date lets the next cron run retry today.
    await record(count, "The email could not be sent. It will be retried.", !test);
    return { result: "failed", count };
  }
  if (!test) await record(count, null, false);
  return { result: "sent", count };
}
