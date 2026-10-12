import assert from "node:assert/strict";
import { pbkdf2Sync, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { handleAdmin, verifyAdminPassword, type AdminDeps } from "./admin.server.ts";
import type { CommerceStatement } from "./commerce.server.ts";

const ORIGIN = "https://admin.yatlifestyle.com", PASSWORD = "generated-test-password-" + "x".repeat(32);
const salt = Buffer.alloc(16, 7), PASSWORD_HASH = `pbkdf2-sha256$100000$${salt.toString("base64url")}$${pbkdf2Sync(PASSWORD, salt, 100000, 32, "sha256").toString("base64url")}`;

function setup() {
  const db = new DatabaseSync(":memory:");
  for (const file of ["0007_commerce.sql", "0008_admin.sql", "0009_inbox.sql"]) db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
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
  for (const action of ["status", "orders", "order", "vouchers", "delivery-notes", "inbox", "inbox-raw", "mail-settings", "unknown"]) assert.equal((await handleAdmin(action, get(action), guarded)).status, 401, action);
  for (const action of ["logout", "fulfillment", "order-cancel", "voucher-create", "voucher-deactivate", "mail-settings"]) assert.equal((await handleAdmin(action, post(action, {}), guarded)).status, 401, action);
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
  assert.equal((await save("dispatched", 2, { courier: "SF", trackingNumber: "1234", note: "Handed over" })).status, 200);
  assert.equal((await save("dispatched", 3, { courier: "SF", trackingNumber: "1234", note: "Note line 1\nNote line 2" })).status, 200);
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
