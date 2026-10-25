import assert from "node:assert/strict";
import { pbkdf2Sync, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { handleAdmin, parseAdminUsers, verifyAdminPassword, type AdminDeps } from "./admin.server.ts";
import { runDailyDigest } from "./admin-notify.server.ts";
import type { CommerceStatement } from "./commerce.server.ts";

const ORIGIN = "https://admin.yatlifestyle.com", PASSWORD = "generated-test-password-" + "x".repeat(32);
const salt = Buffer.alloc(16, 7), PASSWORD_HASH = `pbkdf2-sha256$100000$${salt.toString("base64url")}$${pbkdf2Sync(PASSWORD, salt, 100000, 32, "sha256").toString("base64url")}`;

function setup() {
  const db = new DatabaseSync(":memory:");
  for (const file of ["0007_commerce.sql", "0008_admin.sql", "0009_inbox.sql", "0010_free_delivery.sql", "0011_admin_finance.sql", "0012_admin_order_seen.sql", "0014_admin_order_details.sql"]) db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
  const clock = { now: Date.parse("2026-10-12T10:00:00Z") }, limits = { allowed: true, keys: [] as string[] };
  // Match D1's bound-statement shape while exercising the real SQLite constraints and triggers.
  const statement = (sql: string): CommerceStatement => {
    let values: (string | number | null)[] = [];
    const result: CommerceStatement = {
      bind: (...bound) => { values = bound; return result; },
      first: async () => (db.prepare(sql).get(...values) ?? null) as never,
      all: async () => ({ success: true, results: db.prepare(sql).all(...values) as never }),
      run: async () => ({ success: true, meta: { changes: Number(db.prepare(sql).run(...values).changes) } }),
    };
    return result;
  };
  const deps: AdminDeps = {
    db: { prepare: statement, batch: async (statements) => { db.exec("BEGIN"); try { const result = []; for (const query of statements) result.push(await query.run()); db.exec("COMMIT"); return result; } catch (error) { db.exec("ROLLBACK"); throw error; } } },
    limiter: { limit: async ({ key }) => { limits.keys.push(key); return { success: limits.allowed }; } },
    username: "natasha", passwordHash: PASSWORD_HASH, sessionSecret: "test-session-secret-" + "s".repeat(48), now: () => clock.now,
  };
  const seedOrder = (status = "paid", mode = "prod", createdAt = clock.now) => {
    const id = randomUUID();
    db.prepare(`INSERT INTO commerce_orders
      (id, request_id, request_digest, access_hash, access_expires_at, locale, email, details_json, items_json, subtotal_cents, delivery_cents, discount_cents, total_cents, status, mode, return_origin, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'en', ?, ?, ?, 22800, 3000, 0, 25800, ?, ?, ?, ?, ?)`).run(
      id, randomUUID(), "private-digest", "private-access-hash", clock.now + 86400000, "buyer@example.com",
      JSON.stringify({ name: "Buyer", email: "buyer@example.com", phone: "+85212345678", district: "wan-chai", building: "Flat 1", street: "Test Street", country: "HK", notes: "Please ring" }),
      JSON.stringify([{ slug: "spill-the-tea", name: "Spill the tea", quantity: 1, unitPriceCents: 22800, lineTotalCents: 22800 }]),
      status, mode, "https://yatlifestyle.com", createdAt, createdAt,
    );
    return id;
  };
  return { db, deps, clock, limits, seedOrder };
}

const post = (action: string, body: unknown, cookie = "", origin = ORIGIN, extra: Record<string, string> = {}) => new Request(`${origin}/api/admin/${action}`, {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json", Cookie: cookie, ...extra }, body: JSON.stringify(body),
});
const get = (action: string, cookie = "", origin = ORIGIN) => new Request(`${origin}/api/admin/${action}`, { headers: { Cookie: cookie } });
async function signIn(deps: AdminDeps) {
  const response = await handleAdmin("login", post("login", { username: "natasha", password: PASSWORD }), deps);
  assert.equal(response.status, 200);
  return { response, cookie: response.headers.get("set-cookie")!.split(";")[0] };
}

test("admin: password format is fixed to the supported runtime cost; wrong credentials never create a session", async () => {
  const { deps, db } = setup();
  assert.equal(await verifyAdminPassword(PASSWORD, PASSWORD_HASH), true);
  assert.equal(await verifyAdminPassword("wrong", PASSWORD_HASH), false);
  for (const body of [{ username: "natasha", password: "wrong" }, { username: "someone", password: PASSWORD }]) {
    const response = await handleAdmin("login", post("login", body), deps);
    assert.equal(response.status, 401); assert.equal(response.headers.get("set-cookie"), null);
    assert.match(await response.text(), /username or password is incorrect/);
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_sessions").get()!.n, 0);
  assert.equal((await handleAdmin("login", post("login", { username: "natasha", password: PASSWORD }), { ...deps, passwordHash: "plaintext" })).status, 503);
});

test("admin: all operational endpoints reject anonymous requests before touching data", async () => {
  const { deps } = setup();
  let touched = 0;
  const guarded = { ...deps, db: { prepare: () => { touched++; throw new Error("must not query"); }, batch: deps.db.batch }, syncPayments: async () => { touched++; } };
  for (const action of ["status", "orders", "order", "vouchers", "delivery-notes", "inbox", "inbox-raw", "mail-settings", "money", "money-csv", "settings", "onsite-days", "onsite-day", "notify-settings", "unknown"]) assert.equal((await handleAdmin(action, get(action), guarded)).status, 401, action);
  for (const action of ["logout", "fulfillment", "shipped-email", "order-cancel", "voucher-create", "voucher-set-create", "voucher-deactivate", "mail-settings", "partner-paid", "partner-unpaid", "settings-save", "onsite-day-create", "onsite-day-update", "onsite-day-delete", "onsite-sale-save", "onsite-sale-delete", "orders-seen", "notify-settings", "notify-test"]) assert.equal((await handleAdmin(action, post(action, {}), guarded)).status, 401, action);
  assert.equal(touched, 0);
});

test("admin: sign-in is rate limited by IP and fails closed", async () => {
  const { deps, limits } = setup(); limits.allowed = false;
  assert.equal((await handleAdmin("login", post("login", { username: "natasha", password: PASSWORD }, "", ORIGIN, { "cf-connecting-ip": "203.0.113.1" }), deps)).status, 429);
  assert.deepEqual(limits.keys, ["yat-admin-login:203.0.113.1"]);
});

test("admin: only the secure admin host or local preview can sign in; mutations require same-origin JSON and bounded bodies", async () => {
  const { deps } = setup(), body = { username: "natasha", password: PASSWORD };
  for (const origin of ["https://yatlifestyle.com", "https://admin.yatlifestyle.com.evil.test", "http://admin.yatlifestyle.com"]) assert.equal((await handleAdmin("login", post("login", body, "", origin), deps)).status, 403);
  assert.equal((await handleAdmin("login", post("login", body, "", ORIGIN, { Origin: "https://evil.test" }), deps)).status, 403);
  assert.equal((await handleAdmin("login", new Request(`${ORIGIN}/api/admin/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), deps)).status, 403);
  assert.equal((await handleAdmin("login", post("login", body, "", ORIGIN, { "Content-Type": "text/plain" }), deps)).status, 415);
  assert.equal((await handleAdmin("login", post("login", [], "", ORIGIN), deps)).status, 400);
  assert.equal((await handleAdmin("login", post("login", { padding: "x".repeat(17000) }), deps)).status, 413);
  const local = await handleAdmin("login", post("login", body, "", "http://localhost:3100"), deps);
  assert.equal(local.status, 200); assert.match(local.headers.get("set-cookie")!, /HttpOnly; Secure; SameSite=Strict/);
});

test("admin: session is signed, stored only hashed, expires at eight hours and cannot replay after logout", async () => {
  const { deps, db, clock } = setup(), { response, cookie } = await signIn(deps);
  assert.match(response.headers.get("set-cookie")!, /^__Host-yat_admin=[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}; Path=\/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict$/);
  const raw = cookie.split("=")[1]; assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_sessions WHERE id_hash = ?").get(raw)!.n, 0);
  assert.equal((await handleAdmin("status", get("status", cookie), deps)).status, 200);
  const tampered = cookie.replace(/=(.)/, (_, char) => "=" + (char === "A" ? "B" : "A"));
  assert.equal((await handleAdmin("status", get("status", tampered), deps)).status, 401);
  assert.equal((await handleAdmin("status", get("status", cookie), { ...deps, sessionSecret: "rotated-secret-" + "z".repeat(48) })).status, 401);
  clock.now += 8 * 60 * 60 * 1000;
  assert.equal((await handleAdmin("status", get("status", cookie), deps)).status, 401);
  clock.now -= 8 * 60 * 60 * 1000;
  const logout = await handleAdmin("logout", post("logout", {}, cookie), deps);
  assert.equal(logout.status, 200); assert.match(logout.headers.get("set-cookie")!, /Max-Age=0/);
  assert.equal((await handleAdmin("status", get("status", cookie), deps)).status, 401);
  assert.equal((await handleAdmin("fulfillment", post("fulfillment", {}, cookie), deps)).status, 401);
});

test("admin: order list is paginated and excludes buyer details and access credentials; detail is deliberately protected", async () => {
  const { deps, seedOrder } = setup(), { cookie } = await signIn(deps);
  const id = seedOrder(); for (let index = 0; index < 50; index++) seedOrder(index % 2 ? "paid" : "unpaid");
  const list = await (await handleAdmin("orders", get("orders", cookie), deps)).json();
  assert.equal(list.orders.length, 50); assert.equal(list.hasMore, true);
  assert.ok(!/buyer@example|private-access|private-digest|details_json/.test(JSON.stringify(list)));
  assert.equal((await (await handleAdmin("orders", get("orders?page=2", cookie), deps)).json()).orders.length, 1);
  const filtered = await (await handleAdmin("orders", get("orders?payment=unpaid", cookie), deps)).json();
  assert.ok(filtered.orders.every((order: { payment_status: string }) => order.payment_status === "unpaid"));
  const detail = await (await handleAdmin("order", get(`order?id=${id}`, cookie), deps)).json();
  assert.equal(detail.order.details.email, "buyer@example.com"); assert.equal(detail.order.total_cents, 25800);
  assert.ok(!/private-access|private-digest|access_hash|payment_intent_id/.test(JSON.stringify(detail)));
  assert.equal((await handleAdmin("orders", get("orders?page=-1", cookie), deps)).status, 400);
});

test("admin: fulfillment protects payment, sequencing, concurrent versions and dispatch details with atomic history", async () => {
  const { deps, db, seedOrder } = setup(), { cookie } = await signIn(deps), id = seedOrder();
  const save = (status: string, version: number, extra = {}) => handleAdmin("fulfillment", post("fulfillment", { id, status, version, courier: "", trackingNumber: "", note: "", ...extra }, cookie), deps);
  for (const blocked of [seedOrder("unpaid"), seedOrder("paid", "sandbox")]) assert.equal((await handleAdmin("fulfillment", post("fulfillment", { id: blocked, status: "making", version: 0, courier: "", trackingNumber: "", note: "" }, cookie), deps)).status, 409);
  assert.equal((await save("making", 0)).status, 200);
  assert.equal((await save("dispatched", 1, { courier: "SF", trackingNumber: "1234" })).status, 409);
  assert.equal((await save("packed", 0)).status, 409);
  assert.equal((await save("packed", 1)).status, 200);
  assert.equal((await save("dispatched", 2)).status, 400);
  assert.equal((await save("dispatched", 2, { courier: "SF", trackingNumber: "1234" })).status, 400);
  assert.equal((await save("dispatched", 2, { courier: "SF", trackingNumber: "1234", shippingCost: "-1" })).status, 400);
  assert.equal((await save("dispatched", 2, { courier: "SF", trackingNumber: "1234", note: "Handed over", shippingCost: "45" })).status, 200);
  assert.equal((await save("dispatched", 3, { courier: "SF", trackingNumber: "1234", note: "Note line 1\nNote line 2", shippingCost: "45.50" })).status, 200);
  assert.equal(db.prepare("SELECT shipping_cents FROM admin_order_fulfillment WHERE order_id = ?").get(id)!.shipping_cents, 4550);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_order_history WHERE order_id = ?").get(id)!.n, 4);
  assert.equal(db.prepare("SELECT total_cents FROM commerce_orders WHERE id = ?").get(id)!.total_cents, 25800);
  const concurrentId = seedOrder(), payload = { id: concurrentId, status: "making", version: 0, courier: "", trackingNumber: "", note: "" };
  const saves = await Promise.all([handleAdmin("fulfillment", post("fulfillment", payload, cookie), deps), handleAdmin("fulfillment", post("fulfillment", payload, cookie), deps)]);
  assert.deepEqual(saves.map((result) => result.status).sort(), [200, 409]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_order_history WHERE order_id = ?").get(concurrentId)!.n, 1);
});

test("admin: vouchers store exact cents, validate all money/capacity fields, prevent duplicate codes and deactivate future use", async () => {
  const { deps, db } = setup(), { cookie } = await signIn(deps);
  const base = { code: "gift_12", kind: "fixed", amount: "12.34", minSubtotal: "228.00", maxUses: 5, expiresAt: deps.now() + 86400000 };
  assert.equal((await handleAdmin("voucher-create", post("voucher-create", base, cookie), deps)).status, 201);
  const row = db.prepare("SELECT amount, min_subtotal_cents FROM commerce_vouchers WHERE code = 'GIFT_12'").get()!;
  assert.equal(row.amount, 1234); assert.equal(row.min_subtotal_cents, 22800);
  assert.equal((await handleAdmin("voucher-create", post("voucher-create", base, cookie), deps)).status, 409);
  for (const invalid of [{ amount: "1.001" }, { amount: "-1" }, { amount: 1.5 }, { amount: "10000.01" }, { minSubtotal: "NaN" }, { maxUses: 0 }, { expiresAt: deps.now() }, { kind: "other" }, { code: "<bad>" }]) assert.equal((await handleAdmin("voucher-create", post("voucher-create", { ...base, code: "BAD_CODE", ...invalid }, cookie), deps)).status, 400, JSON.stringify(invalid));
  assert.equal((await handleAdmin("voucher-create", post("voucher-create", { ...base, code: "ALL_ITEMS", kind: "percent", amount: "100", minSubtotal: "0", maxUses: null, expiresAt: null }, cookie), deps)).status, 201);
  assert.equal((await handleAdmin("voucher-create", post("voucher-create", { ...base, code: "BAD_PERCENT", kind: "percent", amount: "101" }, cookie), deps)).status, 400);
  assert.equal((await handleAdmin("voucher-deactivate", post("voucher-deactivate", { code: "gift_12" }, cookie), deps)).status, 200);
  assert.equal(db.prepare("SELECT active FROM commerce_vouchers WHERE code = 'GIFT_12'").get()!.active, 0);
  assert.equal((await handleAdmin("voucher-deactivate", post("voucher-deactivate", { code: "MISSING" }, cookie), deps)).status, 404);
});

test("admin: inbox bodies and attachment names require authentication; forwarding is stored as a validated boolean", async () => {
  const { deps, db } = setup(), { cookie } = await signIn(deps), id = randomUUID();
  db.prepare("INSERT INTO commerce_inbox (id, message_id, from_email, to_email, subject, text_body, attachment_names, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, "message-1", "sender@example.com", "care@yatlifestyle.com", "Question", "<script>not executable HTML</script>\nA question", JSON.stringify(["invoice.pdf"]), deps.now());
  const listing = await (await handleAdmin("inbox", get("inbox", cookie), deps)).json();
  assert.equal(listing.emails.length, 1); assert.equal(listing.emails[0].text_body, undefined);
  const detail = await handleAdmin("inbox", get(`inbox?id=${id}`, cookie), deps);
  assert.match(detail.headers.get("content-type")!, /application\/json/);
  const body = await detail.json(); assert.match(body.email.text_body, /<script>/); assert.deepEqual(body.email.attachment_names, ["invoice.pdf"]);
  const settings = await (await handleAdmin("mail-settings", get("mail-settings", cookie), deps)).json(); assert.equal(settings.forwardingEnabled, true);
  assert.equal((await handleAdmin("mail-settings", post("mail-settings", { forwardingEnabled: false }, cookie), deps)).status, 200);
  assert.equal(db.prepare("SELECT forward_enabled FROM commerce_mail_settings WHERE id = 1").get()!.forward_enabled, 0);
  assert.equal((await handleAdmin("mail-settings", post("mail-settings", { forwardingEnabled: "false" }, cookie), deps)).status, 400);
  assert.equal((await handleAdmin("mail-settings", post("mail-settings", { forwardingEnabled: true, destination: "other@example.com" }, cookie), deps)).status, 400);
});

test("admin: original-email downloads are authenticated, restricted to the message namespace and sent as attachments", async () => {
  const { deps, db } = setup(), { cookie } = await signIn(deps), id = randomUUID(), digest = "a".repeat(64);
  db.prepare("INSERT INTO commerce_inbox (id, message_id, from_email, to_email, subject, text_body, received_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, digest, "sender@example.com", "care@yatlifestyle.com", "Invoice", "Text", deps.now());
  const fetched: string[] = [], bytes = new TextEncoder().encode("Content-Type: text/html\r\n\r\n<b>Original source</b>").buffer;
  const downloadDeps = { ...deps, getMailRaw: async (key: string) => { fetched.push(key); return bytes; } };
  assert.equal((await handleAdmin("inbox-raw", get(`inbox-raw?id=${id}`), downloadDeps)).status, 401); assert.deepEqual(fetched, []);
  const response = await handleAdmin("inbox-raw", get(`inbox-raw?id=${id}`, cookie), downloadDeps);
  assert.equal(response.status, 200); assert.equal(response.headers.get("content-type"), "message/rfc822");
  assert.equal(response.headers.get("content-disposition"), 'attachment; filename="message.eml"');
  assert.equal(response.headers.get("cache-control"), "no-store"); assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(fetched, [`commerce-inbox/${digest}.eml`]); assert.equal(await response.text(), new TextDecoder().decode(bytes));
  assert.equal((await handleAdmin("inbox-raw", get(`inbox-raw?id=${id}`, cookie), { ...deps, getMailRaw: async () => null })).status, 404);
});

test("admin: staff cancellation requires authentication and same origin, refuses paid orders and waits for provider confirmation", async () => {
  const { deps, seedOrder } = setup(), { cookie } = await signIn(deps), unpaid = seedOrder("unpaid"), paid = seedOrder("paid");
  const cancelled: string[] = [], cancelDeps = { ...deps, cancelOrder: async (id: string) => { cancelled.push(id); return { id, status: "cancelled" }; } };
  assert.equal((await handleAdmin("order-cancel", post("order-cancel", { id: unpaid }), cancelDeps)).status, 401);
  assert.equal((await handleAdmin("order-cancel", post("order-cancel", { id: unpaid }, cookie, ORIGIN, { Origin: "https://evil.test" }), cancelDeps)).status, 403);
  assert.equal((await handleAdmin("order-cancel", post("order-cancel", { id: paid }, cookie), cancelDeps)).status, 409); assert.deepEqual(cancelled, []);
  assert.equal((await handleAdmin("order-cancel", post("order-cancel", { id: unpaid }, cookie), cancelDeps)).status, 200); assert.deepEqual(cancelled, [unpaid]);
  const failed = await handleAdmin("order-cancel", post("order-cancel", { id: unpaid }, cookie), { ...deps, cancelOrder: async () => { throw new Error("sensitive-provider-response"); } });
  assert.equal(failed.status, 503); assert.ok(!(await failed.text()).includes("sensitive-provider-response"));
  assert.equal((await handleAdmin("order-cancel", post("order-cancel", { id: unpaid }, cookie), { ...deps, cancelOrder: async () => ({ id: unpaid, status: "unpaid" }) })).status, 503);
  assert.equal((await handleAdmin("order-cancel", post("order-cancel", { id: unpaid }, cookie), { ...deps, cancelOrder: async () => { throw Object.assign(new Error("provider paid"), { code: "already_paid", status: 409 }); } })).status, 409);
});

const paidAt = (db: DatabaseSync, id: string, iso: string) => db.prepare("UPDATE commerce_orders SET paid_at = ? WHERE id = ?").run(Date.parse(iso), id);
const ok = async (response: Response) => { const body = await response.json(); assert.ok(response.ok, JSON.stringify(body)); return body as Record<string, any>; };

test("admin finance: Money counts only paid live orders by Hong Kong date, applies dated rates and subtracts shipping, CJ share and stall fees", async () => {
  const { deps, db, seedOrder } = setup(), { cookie } = await signIn(deps);
  const early = seedOrder(), late = seedOrder(), november = seedOrder();
  paidAt(db, early, "2026-10-05T04:00:00Z"); paidAt(db, late, "2026-10-31T15:30:00Z"); paidAt(db, november, "2026-10-31T16:30:00Z");
  for (const ignored of [seedOrder("paid", "sandbox"), seedOrder("unpaid"), seedOrder("failed"), seedOrder("cancelled")]) paidAt(db, ignored, "2026-10-20T04:00:00Z");
  // The Airwallex rate starts on 10 October, so the earlier order has no fee estimate.
  await ok(await handleAdmin("settings-save", post("settings-save", { airwallexPercent: "3.4", airwallexFixed: "2.35", partnerPercent: "5", from: "2026-10-10" }, cookie), deps));
  for (const invalid of [{ airwallexPercent: "3.456" }, { airwallexPercent: "25" }, { partnerPercent: "" }, { from: "2026-02-30" }, { airwallexFixed: "abc" }]) assert.equal((await handleAdmin("settings-save", post("settings-save", { airwallexPercent: "3.4", airwallexFixed: "2.35", partnerPercent: "5", from: "2026-10-10", ...invalid }, cookie), deps)).status, 400, JSON.stringify(invalid));
  const save = (status: string, version: number, extra = {}) => handleAdmin("fulfillment", post("fulfillment", { id: early, status, version, courier: "SF", trackingNumber: "SF123", note: "", ...extra }, cookie), deps);
  await ok(await save("making", 0)); await ok(await save("packed", 1)); await ok(await save("dispatched", 2, { shippingCost: "45" }));
  db.prepare("INSERT INTO admin_order_fulfillment (order_id, status, courier, tracking_number, note, version, updated_by, updated_at) VALUES (?, 'dispatched', 'SF', 'SF999', '', 1, 'natasha', 0)").run(late);

  const day = await ok(await handleAdmin("onsite-day-create", post("onsite-day-create", { place: "PMQ weekend market", day: "2026-10-24", usualPrice: "240" }, cookie), deps));
  for (const sale of [{ slug: "golden", quantity: 2, unitPrice: "240", method: "cash" }, { slug: "ocean", quantity: 1, unitPrice: "250", method: "fps" }]) await ok(await handleAdmin("onsite-sale-save", post("onsite-sale-save", { id: randomUUID(), dayId: day.id, ...sale }, cookie), deps));
  await ok(await handleAdmin("onsite-day-update", post("onsite-day-update", { id: day.id, place: "PMQ weekend market", day: "2026-10-24", usualPrice: "240", stallFee: "300", status: "closed" }, cookie), deps));

  const money = await ok(await handleAdmin("money", get("money?from=2026-10-01&to=2026-10-31", cookie), deps));
  assert.deepEqual({ ...money.online, missingShipping: money.online.missingShipping.length }, { salesCents: 51600, orders: 2, feeCents: 877 + 235, feeUnset: 1, partnerCents: 2580, shippingCents: 4500, awaitingDispatch: 0, missingShipping: 1, keptCents: 51600 - 1112 - 2580 - 4500 });
  assert.equal(money.online.missingShipping[0], late);
  assert.deepEqual({ sales: money.onsite.salesCents, bottles: money.onsite.bottles, stall: money.onsite.stallCents, kept: money.onsite.keptCents }, { sales: 73000, bottles: 3, stall: 30000, kept: 43000 });
  assert.equal(money.keptCents, 43408 + 43000); assert.equal(money.grossCents, 51600 + 73000);
  assert.equal(money.series.length, 31); assert.equal(money.monthly, false);
  assert.deepEqual(money.series.filter((point: { cents: number }) => point.cents).map((point: { key: string }) => point.key), ["2026-10-05", "2026-10-31"]);
  assert.deepEqual(money.bestSellers.map((row: { name: string; quantity: number }) => [row.name, row.quantity]), [["Golden", 2], ["Spill the tea", 2], ["Ocean", 1]]);
  assert.deepEqual(money.previous, { from: "2026-09-01", to: "2026-09-30", keptCents: 0 });
  assert.deepEqual(money.partner.map((row: { month: string; owedCents: number }) => [row.month, row.owedCents]), [["2026-11", 1290], ["2026-10", 2580]]);

  const year = await ok(await handleAdmin("money", get("money?from=2026-01-01&to=2026-12-31", cookie), deps));
  assert.equal(year.monthly, true); assert.equal(year.series.length, 12); assert.equal(year.online.orders, 3);
  for (const query of ["from=2026-10-31&to=2026-10-01", "from=2026-13-01&to=2026-12-31", "from=2020-01-01&to=2026-01-01", "to=2026-10-01"]) assert.equal((await handleAdmin("money", get(`money?${query}`, cookie), deps)).status, 400, query);
});

test("admin finance: CJ's share is marked paid per started month with the owed amount snapshotted, and can be undone", async () => {
  const { deps, db, seedOrder } = setup(), { cookie } = await signIn(deps);
  paidAt(db, seedOrder(), "2026-10-02T04:00:00Z");
  assert.equal((await handleAdmin("partner-paid", post("partner-paid", { month: "2026-09" }, cookie), deps)).status, 409);
  assert.equal((await handleAdmin("partner-paid", post("partner-paid", { month: "2026-11" }, cookie), deps)).status, 400);
  assert.equal((await handleAdmin("partner-paid", post("partner-paid", { month: "2026-13" }, cookie), deps)).status, 400);
  assert.equal((await ok(await handleAdmin("partner-paid", post("partner-paid", { month: "2026-10" }, cookie), deps))).amountCents, 1290);
  assert.deepEqual({ ...db.prepare("SELECT month, amount_cents, paid_by FROM admin_partner_payouts").get() }, { month: "2026-10", amount_cents: 1290, paid_by: "natasha" });
  paidAt(db, seedOrder(), "2026-10-03T04:00:00Z");
  const months = (await ok(await handleAdmin("money", get("money?from=2026-10-01&to=2026-10-31", cookie), deps))).partner;
  assert.deepEqual(months[0], { month: "2026-10", owedCents: 2580, paidCents: 1290, paidAt: deps.now(), paidBy: "natasha" });
  await ok(await handleAdmin("partner-unpaid", post("partner-unpaid", { month: "2026-10" }, cookie), deps));
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_partner_payouts").get()!.n, 0);
});

test("admin finance: CSV covers online orders, onsite sales and stall fees with formula-safe text", async () => {
  const { deps, db, seedOrder } = setup(), { cookie } = await signIn(deps);
  paidAt(db, seedOrder(), "2026-10-05T04:00:00Z");
  const place = '=HYPERLINK("x"), market';
  const day = await ok(await handleAdmin("onsite-day-create", post("onsite-day-create", { place, day: "2026-10-24", usualPrice: "" }, cookie), deps));
  await ok(await handleAdmin("onsite-sale-save", post("onsite-sale-save", { id: randomUUID(), dayId: day.id, slug: "high-tea", quantity: 2, unitPrice: "250.50", method: "payme" }, cookie), deps));
  await ok(await handleAdmin("onsite-day-update", post("onsite-day-update", { id: day.id, place, day: "2026-10-24", usualPrice: "", stallFee: "100", status: "open" }, cookie), deps));
  const response = await handleAdmin("money-csv", get("money-csv?from=2026-10-01&to=2026-10-31", cookie), deps);
  assert.equal(response.status, 200); assert.match(response.headers.get("content-type")!, /^text\/csv/);
  assert.equal(response.headers.get("content-disposition"), 'attachment; filename="yat-sales-2026-10-01-to-2026-10-31.csv"');
  const lines = (await response.text()).replace(/^﻿/, "").trim().split("\r\n");
  assert.equal(lines.length, 4);
  assert.match(lines[1], /^2026-10-05,Online,[0-9a-f-]{36},Spill the tea × 1,1,258\.00,Airwallex,,12\.90,,,245\.10$/);
  assert.equal(lines[2], `2026-10-24,Onsite,"'=HYPERLINK(""x""), market",High Tea,2,501.00,PayMe,,,,,501.00`);
  assert.equal(lines[3], `2026-10-24,Onsite,"'=HYPERLINK(""x""), market",Stall fee,,,,,,,100.00,-100.00`);
});

test("admin finance: onsite days and sales validate input, save idempotently by sale id and protect days that still have sales", async () => {
  const { deps, db } = setup(), { cookie } = await signIn(deps);
  for (const invalid of [{ place: "" }, { place: "x".repeat(121) }, { day: "2026-02-30" }, { day: "24/10/2026" }, { usualPrice: "2.345" }]) assert.equal((await handleAdmin("onsite-day-create", post("onsite-day-create", { place: "Tai Kwun", day: "2026-10-31", usualPrice: "", ...invalid }, cookie), deps)).status, 400, JSON.stringify(invalid));
  const first = await ok(await handleAdmin("onsite-day-create", post("onsite-day-create", { place: "  Tai Kwun  ", day: "2026-10-31", usualPrice: "258" }, cookie), deps));
  const second = await ok(await handleAdmin("onsite-day-create", post("onsite-day-create", { place: "PMQ", day: "2026-10-24", usualPrice: "" }, cookie), deps));
  const saleId = randomUUID(), sale = { id: saleId, dayId: first.id, slug: "golden", quantity: 1, unitPrice: "258", method: "card" };
  for (const invalid of [{ slug: "missing" }, { quantity: 0 }, { quantity: 1.5 }, { unitPrice: "-5" }, { method: "bitcoin" }, { id: "not-a-uuid" }]) assert.equal((await handleAdmin("onsite-sale-save", post("onsite-sale-save", { ...sale, ...invalid }, cookie), deps)).status, 400, JSON.stringify(invalid));
  assert.equal((await handleAdmin("onsite-sale-save", post("onsite-sale-save", { ...sale, dayId: randomUUID() }, cookie), deps)).status, 404);
  await ok(await handleAdmin("onsite-sale-save", post("onsite-sale-save", sale, cookie), deps));
  await ok(await handleAdmin("onsite-sale-save", post("onsite-sale-save", sale, cookie), deps));
  await ok(await handleAdmin("onsite-sale-save", post("onsite-sale-save", { ...sale, quantity: 3, unitPrice: "200" }, cookie), deps));
  assert.deepEqual({ ...db.prepare("SELECT COUNT(*) AS n, SUM(quantity) AS q, MAX(unit_price_cents) AS p FROM admin_onsite_sales").get() }, { n: 1, q: 3, p: 20000 });
  assert.equal((await handleAdmin("onsite-sale-save", post("onsite-sale-save", { ...sale, dayId: second.id }, cookie), deps)).status, 404);
  assert.equal(db.prepare("SELECT day_id FROM admin_onsite_sales WHERE id = ?").get(saleId)!.day_id, first.id);
  const loaded = await ok(await handleAdmin("onsite-day", get(`onsite-day?id=${first.id}`, cookie), deps));
  assert.equal(loaded.day.place, "Tai Kwun"); assert.equal(loaded.day.usual_price_cents, 25800); assert.equal(loaded.sales.length, 1);
  const list = await ok(await handleAdmin("onsite-days", get("onsite-days", cookie), deps));
  assert.deepEqual(list.days.map((row: { day: string; sales_cents: number }) => [row.day, row.sales_cents]), [["2026-10-31", 60000], ["2026-10-24", 0]]);
  assert.deepEqual(list.places.sort(), ["PMQ", "Tai Kwun"]); assert.equal(list.today, "2026-10-12");
  assert.equal((await handleAdmin("onsite-day-delete", post("onsite-day-delete", { id: first.id }, cookie), deps)).status, 409);
  await ok(await handleAdmin("onsite-sale-delete", post("onsite-sale-delete", { id: saleId }, cookie), deps));
  await ok(await handleAdmin("onsite-day-delete", post("onsite-day-delete", { id: first.id }, cookie), deps));
  assert.equal((await handleAdmin("onsite-day", get(`onsite-day?id=${first.id}`, cookie), deps)).status, 404);
  assert.equal((await handleAdmin("onsite-day-update", post("onsite-day-update", { id: second.id, place: "PMQ", day: "2026-10-24", usualPrice: "", stallFee: "", status: "done" }, cookie), deps)).status, 400);
});

test("admin finance: the first dispatch emails the customer once in their language; failures release the claim and staff can resend", async () => {
  const { deps, db, seedOrder } = setup(), { cookie } = await signIn(deps);
  const sent: { to: string; subject: string; text: string; from: { email: string } }[] = [];
  let failing = true;
  const mailer: AdminDeps = { ...deps, sendEmail: async (message) => { if (failing) throw new Error("mail down"); sent.push(message); } };
  const id = seedOrder();
  db.prepare("INSERT INTO admin_order_fulfillment (order_id, status, courier, tracking_number, note, version, updated_by, updated_at) VALUES (?, 'packed', '', '', '', 1, 'natasha', 0)").run(id);
  const dispatch = (version: number, tracking = "SF123") => handleAdmin("fulfillment", post("fulfillment", { id, status: "dispatched", version, courier: "SF Express", trackingNumber: tracking, note: "", shippingCost: "40" }, cookie), mailer);
  assert.equal((await ok(await dispatch(1))).shippedEmail, "failed");
  assert.equal(db.prepare("SELECT shipped_email_at FROM admin_order_fulfillment WHERE order_id = ?").get(id)!.shipped_email_at, null);
  failing = false;
  assert.equal((await ok(await dispatch(2))).shippedEmail, "sent");
  assert.equal((await ok(await dispatch(3, "SF456"))).shippedEmail, "already");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "buyer@example.com"); assert.equal(sent[0].from.email, "orders@yatlifestyle.com");
  assert.equal(sent[0].subject, "Your YAT.LIFESTYLE order has shipped"); assert.match(sent[0].text, /Courier: SF Express\nTracking number: SF123\n\nSpill the tea × 1/);
  // The packed row plus three dispatch saves; claiming and releasing the email adds no history.
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_order_history WHERE order_id = ?").get(id)!.n, 4);
  assert.equal((await ok(await handleAdmin("shipped-email", post("shipped-email", { id }, cookie), mailer))).shippedEmail, "sent");
  assert.match(sent[1].text, /Tracking number: SF456/);
  assert.equal((await handleAdmin("shipped-email", post("shipped-email", { id: seedOrder() }, cookie), mailer)).status, 409);
  assert.equal((await handleAdmin("shipped-email", post("shipped-email", { id }, cookie), { ...mailer, sendEmail: undefined })).status, 503);
});

test("admin finance: printable voucher sets create unique, hand-typeable codes that share one batch", async () => {
  const { deps, db } = setup(), { cookie } = await signIn(deps);
  const base = { count: 12, prefix: "mkt", kind: "percent", amount: "15", minSubtotal: "0", maxUses: 1, expiresAt: deps.now() + 86400000 };
  for (const invalid of [{ count: 0 }, { count: 201 }, { count: "5" }, { prefix: "TOOLONGPREFIX1" }, { prefix: "with space" }, { amount: "101" }, { maxUses: 0 }]) assert.equal((await handleAdmin("voucher-set-create", post("voucher-set-create", { ...base, ...invalid }, cookie), deps)).status, 400, JSON.stringify(invalid));
  const set = await ok(await handleAdmin("voucher-set-create", post("voucher-set-create", base, cookie), deps));
  assert.equal(set.codes.length, 12); assert.equal(new Set(set.codes).size, 12);
  for (const code of set.codes) assert.match(code, /^MKT-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{8}$/);
  const listed = await ok(await handleAdmin("vouchers", get(`vouchers?batch=${set.batch}`, cookie), deps));
  assert.equal(listed.vouchers.length, 12);
  assert.ok(listed.vouchers.every((row: { batch: string; max_uses: number; amount: number }) => row.batch === set.batch && row.max_uses === 1 && row.amount === 15));
  const single = await ok(await handleAdmin("voucher-set-create", post("voucher-set-create", { ...base, count: 1, prefix: "", kind: "fixed", amount: "30" }, cookie), deps));
  assert.match(single.codes[0], /^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{8}$/);
  assert.equal(db.prepare("SELECT amount FROM commerce_vouchers WHERE code = ?").get(single.codes[0])!.amount, 3000);
  assert.equal((await handleAdmin("vouchers", get("vouchers?batch=nope", cookie), deps)).status, 400);
  assert.equal((await ok(await handleAdmin("vouchers", get("vouchers", cookie), deps))).vouchers.length, 13);
});

test("admin: a second account signs in with its own password, and removing its hash ends its sessions", async () => {
  const { deps } = setup(), salt2 = Buffer.alloc(16, 9), other = "second-test-password-" + "y".repeat(32);
  const users = parseAdminUsers(JSON.stringify({ cj: `pbkdf2-sha256$100000$${salt2.toString("base64url")}$${pbkdf2Sync(other, salt2, 100000, 32, "sha256").toString("base64url")}`, "Bad Name": "x", list: 5 }));
  assert.deepEqual(Object.keys(users), ["cj"]);
  assert.deepEqual(parseAdminUsers("not json"), {}); assert.deepEqual(parseAdminUsers(undefined), {}); assert.deepEqual(parseAdminUsers("[]"), {});
  const withUsers = { ...deps, users };
  for (const body of [{ username: "cj", password: PASSWORD }, { username: "natasha", password: other }, { username: "constructor", password: PASSWORD }]) assert.equal((await handleAdmin("login", post("login", body), withUsers)).status, 401, body.username);
  const response = await handleAdmin("login", post("login", { username: "cj", password: other }), withUsers);
  assert.equal(response.status, 200); assert.equal((await response.json()).username, "cj");
  const cookie = response.headers.get("set-cookie")!.split(";")[0];
  assert.equal((await (await handleAdmin("status", get("status", cookie), withUsers)).json()).username, "cj");
  assert.equal((await handleAdmin("status", get("status", cookie), deps)).status, 401);
  assert.equal((await handleAdmin("status", get("status", (await signIn(withUsers)).cookie), withUsers)).status, 200);
});

test("admin seen: only the owner opening a paid live order marks it seen; the unseen filter, counts and Mark all follow it", async () => {
  const { deps, db, seedOrder } = setup(), { cookie } = await signIn(deps);
  const cjDeps: AdminDeps = { ...deps, users: { cj: PASSWORD_HASH } };
  const cjCookie = (await handleAdmin("login", post("login", { username: "cj", password: PASSWORD }), cjDeps)).headers.get("set-cookie")!.split(";")[0];
  const first = seedOrder(), second = seedOrder(), unpaid = seedOrder("unpaid"), sandbox = seedOrder("paid", "sandbox");
  const status = async (who = cookie, using = deps) => (await (await handleAdmin("status", get("status", who), using)).json()) as { unseen: number; owner: boolean };
  assert.deepEqual(await status(), { ok: true, username: "natasha", owner: true, unseen: 2 } as never);
  await handleAdmin("order", get(`order?id=${first}`, cjCookie), cjDeps);
  assert.equal((await status(cjCookie, cjDeps)).unseen, 2);
  assert.equal((await status(cjCookie, cjDeps)).owner, false);
  for (const id of [first, unpaid, sandbox]) assert.equal((await handleAdmin("order", get(`order?id=${id}`, cookie), deps)).status, 200);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM admin_order_seen").get()!.n, 1);
  const unseen = await (await handleAdmin("orders", get("orders?seen=unseen", cookie), deps)).json();
  assert.deepEqual(unseen.orders.map((row: { id: string }) => row.id), [second]); assert.equal(unseen.unseen, 1);
  assert.ok((await (await handleAdmin("order", get(`order?id=${first}`, cookie), deps)).json()).order.seen_at);
  assert.equal((await handleAdmin("orders", get("orders?seen=maybe", cookie), deps)).status, 400);
  assert.equal((await handleAdmin("orders-seen", post("orders-seen", {}, cjCookie), cjDeps)).status, 403);
  assert.equal((await handleAdmin("orders-seen", post("orders-seen", {}, cookie), deps)).status, 200);
  assert.equal((await status()).unseen, 0);
});

test("admin seen: the daily email goes once per Hong Kong day after the saved time, skips empty days and retries failures", async () => {
  const { deps, db, clock, seedOrder } = setup();
  const sent: { to: string; subject: string; text: string }[] = [];
  let failing = false;
  const notify = { db: deps.db, defaultTo: "owner@example.com", now: () => clock.now, sendEmail: async (message: (typeof sent)[number]) => { if (failing) throw new Error("down"); sent.push(message); } };
  clock.now = Date.parse("2026-10-24T10:59:00Z"); // 18:59 in Hong Kong
  assert.equal((await runDailyDigest(notify)).result, "not-due");
  clock.now = Date.parse("2026-10-24T11:00:00Z");
  assert.deepEqual(await runDailyDigest(notify), { result: "none", count: 0 });
  assert.equal((await runDailyDigest(notify)).result, "already-sent");
  const order = seedOrder(); db.prepare("UPDATE commerce_orders SET paid_at = ? WHERE id = ?").run(Date.parse("2026-10-25T02:00:00Z"), order);
  clock.now = Date.parse("2026-10-25T11:05:00Z");
  failing = true;
  assert.equal((await runDailyDigest(notify)).result, "failed");
  assert.equal(db.prepare("SELECT last_sent_day FROM admin_notify_settings").get()!.last_sent_day, "2026-10-24");
  failing = false;
  assert.deepEqual(await runDailyDigest(notify), { result: "sent", count: 1 });
  assert.equal((await runDailyDigest(notify)).result, "already-sent");
  assert.equal(sent.length, 1); assert.equal(sent[0].to, "owner@example.com");
  assert.equal(sent[0].subject, "1 new YAT.LIFESTYLE order to review");
  assert.match(sent[0].text, /25 Oct, 10:00 · Spill the tea × 1 · HK\$258 · Wan Chai/);
  assert.match(sent[0].text, /https:\/\/admin\.yatlifestyle\.com\/admin/);

  // Settings: validated time and address, disable, and a test that leaves the schedule alone.
  let { cookie } = await signIn(deps);
  for (const invalid of [{ time: "7pm" }, { time: "24:00" }, { email: "not-an-email" }, { enabled: "yes" }]) assert.equal((await handleAdmin("notify-settings", post("notify-settings", { enabled: true, time: "19:00", email: "", ...invalid }, cookie), deps)).status, 400, JSON.stringify(invalid));
  const saved = await (await handleAdmin("notify-settings", post("notify-settings", { enabled: false, time: "08:30", email: " Natasha@Example.com " }, cookie), deps)).json();
  assert.deepEqual([saved.digest_enabled, saved.digest_time, saved.digest_email, saved.unseen], [0, "08:30", "natasha@example.com", 1]);
  clock.now = Date.parse("2026-10-26T01:00:00Z");
  assert.equal((await runDailyDigest(notify)).result, "disabled");
  ({ cookie } = await signIn(deps));
  const mailer = { ...deps, sendEmail: notify.sendEmail, forwardTo: "fallback@example.com" };
  assert.equal((await handleAdmin("notify-test", post("notify-test", {}, cookie), mailer)).status, 200);
  assert.equal(sent.at(-1)!.to, "natasha@example.com"); assert.match(sent.at(-1)!.subject, /^Test:/);
  assert.equal(db.prepare("SELECT last_sent_day FROM admin_notify_settings").get()!.last_sent_day, "2026-10-25");
  assert.equal((await handleAdmin("notify-test", post("notify-test", {}, cookie), { ...mailer, sendEmail: undefined })).status, 503);
});

test("admin: staff can step a stage back but not skip ahead, and re-dispatch does not email twice", async () => {
  const { deps, db, seedOrder } = setup(), { cookie } = await signIn(deps);
  const sent: unknown[] = [], mailer: AdminDeps = { ...deps, sendEmail: async (message) => { sent.push(message); } };
  const id = seedOrder();
  db.prepare("INSERT INTO admin_order_fulfillment (order_id, status, courier, tracking_number, note, version, updated_by, updated_at) VALUES (?, 'packed', '', '', '', 1, 'natasha', 0)").run(id);
  const save = (status: string, version: number) => handleAdmin("fulfillment", post("fulfillment", { id, status, version, courier: "SF Express", trackingNumber: "SF123", note: "", shippingCost: "40" }, cookie), mailer);
  await ok(await save("dispatched", 1));
  await ok(await save("packed", 2));
  assert.equal(db.prepare("SELECT status FROM admin_order_fulfillment WHERE order_id = ?").get(id)!.status, "packed");
  await ok(await save("new", 3));
  assert.equal((await save("packed", 4)).status, 409);
  await ok(await save("making", 4)); await ok(await save("packed", 5)); await ok(await save("dispatched", 6));
  assert.equal(sent.length, 1);
});

test("admin: delivery details edit is validated, keeps the verified email and is logged", async () => {
  const { deps, db, seedOrder } = setup(), { cookie } = await signIn(deps);
  const id = seedOrder();
  const edit = (details: Record<string, unknown>) => handleAdmin("order-details", post("order-details", { id, details }, cookie), deps);
  const base = { name: "Buyer", phone: "+85212345678", district: "wan-chai", building: "Flat 1", street: "Test Street", notes: "Please ring" };
  assert.equal((await edit({ ...base, phone: "123" })).status, 400);
  assert.equal((await edit({ ...base, district: "shanghai" })).status, 400);
  assert.deepEqual((await ok(await edit({ ...base, building: "Flat 9, 3/F", phone: "9876 5432", email: "evil@example.com" }))).changed, ["phone", "building"]);
  const details = (await ok(await handleAdmin("order", get(`order?id=${id}`, cookie), deps))).order.details;
  assert.match(db.prepare("SELECT details_json FROM commerce_orders WHERE id = ?").get(id)!.details_json as string, /"Flat 1"/);
  assert.equal(details.email, "buyer@example.com"); assert.equal(details.phone, "+85298765432"); assert.equal(details.building, "Flat 9, 3/F");
  assert.match(db.prepare("SELECT note FROM admin_order_history WHERE order_id = ? ORDER BY id DESC").get(id)!.note as string, /phone, building/);
});
