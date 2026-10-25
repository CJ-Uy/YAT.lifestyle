import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { cancelUnpaidOrder, deliveryDetails, discountFor, handleAirwallexWebhook, handleCommerce, strictCart, syncPendingOrders, validateIntent, validWebhookSignature, type CommerceEnv, type CommerceStatement, type VoucherRow } from "./commerce.server.ts";

const ORIGIN = "https://yatlifestyle.com", EMAIL_COOKIE = "yat_checkout_email=" + "a".repeat(43);
const details = { name: "Alex Chan", email: "alex@example.com", phone: "+852 2345-6789", district: "central-western", building: "Flat A, 1/F, Test Building", street: "Test Street", notes: "" };
const body = (extra: Record<string, unknown> = {}) => ({ items: [{ slug: "midnight", quantity: 1 }], details, locale: "en", requestId: crypto.randomUUID(), ...extra });
const post = (action: string, value: unknown, cookie = EMAIL_COOKIE, origin = ORIGIN) => new Request(`${origin}/api/commerce/${action}`, { method: "POST", headers: { Origin: origin, "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify(value) });
const get = (id: string, cookie = "") => new Request(`${ORIGIN}/api/commerce/order?id=${id}`, { headers: { Cookie: cookie } });
const decode = async (response: Response) => await response.json() as Record<string, any>;

function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  for (const file of ["0006_checkout_email.sql", "0007_commerce.sql", "0010_free_delivery.sql", "0015_inventory.sql"]) db.exec(readFileSync(new URL(`../migrations/${file}`, import.meta.url), "utf8"));
  db.prepare("INSERT INTO checkout_email_proofs (id_hash, email, expires_at) VALUES (?, ?, ?)").run(createHash("sha256").update("a".repeat(43)).digest("hex"), details.email, Date.now() + 1800000);
  const sql = new WeakMap<CommerceStatement, { query: string; values: (string | number | null)[] }>();
  const prepare = (query: string): CommerceStatement => {
    const statement: CommerceStatement = {
      bind: (...values) => { sql.set(statement, { query, values }); return statement; },
      first: async <T>() => { const values = sql.get(statement)!.values; return (db.prepare(query).get(...values) ?? null) as T | null; },
      all: async <T>() => ({ success: true, results: db.prepare(query).all(...sql.get(statement)!.values) as T[] }),
      run: async () => ({ success: true, meta: { changes: Number(db.prepare(query).run(...sql.get(statement)!.values).changes) } }),
    };
    sql.set(statement, { query, values: [] }); return statement;
  };
  const mail: Parameters<NonNullable<CommerceEnv["EMAIL"]>["send"]>[0][] = [];
  const env: CommerceEnv = {
    DB: { prepare, batch: async (statements) => {
      db.exec("BEGIN IMMEDIATE");
      try { const results = statements.map((statement) => { const { query, values } = sql.get(statement)!; return { success: true, meta: { changes: Number(db.prepare(query).run(...values).changes) } }; }); db.exec("COMMIT"); return results; }
      catch (error) { db.exec("ROLLBACK"); throw error; }
    } },
    AIRWALLEX_CLIENT_ID: "test-client-" + crypto.randomUUID(), AIRWALLEX_API_KEY: "test-api-key", AIRWALLEX_MODE: "prod", AIRWALLEX_WEBHOOK_SECRET: "test-webhook-secret", COMMERCE_COOKIE_SECRET: "test-cookie-secret-with-at-least-32-characters",
    CHECKOUT_RATE_LIMITER: { limit: async () => ({ success: true }) },
    EMAIL: { send: async (message) => { mail.push(message); } },
  };
  const intents = new Map<string, Record<string, any>>(), requests: Record<string, any>[] = [];
  const provider = { failAfterCreate: false, failDefinitively: false, retrieveCount: 0, cancelCount: 0, declineCancel: false, paidDuringCancel: false, loseCancelResponse: false };
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    assert.match(url, /^https:\/\/api(?:\.sandbox)?\.airwallex\.com\/api\/v1\//);
    if (url.endsWith("/authentication/login")) return Response.json({ token: "test-access-token", expires_at: new Date(Date.now() + 3600000).toISOString() });
    if (url.endsWith("/payment_intents/create")) {
      const payload = JSON.parse(init!.body as string) as Record<string, any>;
      assert.equal(db.prepare("SELECT status FROM commerce_orders WHERE id = ?").get(payload.merchant_order_id)!.status, "unpaid");
      requests.push(payload);
      if (provider.failDefinitively) return Response.json({ code: "validation_error" }, { status: 400 });
      let intent = [...intents.values()].find((entry) => entry.request_id === payload.request_id);
      if (!intent) { intent = { ...payload, id: "int_" + crypto.randomUUID().replaceAll("-", ""), client_secret: "test-client-secret", status: "REQUIRES_PAYMENT_METHOD" }; intents.set(intent.id, intent); }
      if (provider.failAfterCreate) { provider.failAfterCreate = false; throw new Error("simulated response loss"); }
      return Response.json(intent);
    }
    if (url.endsWith("/cancel")) {
      const intent = intents.get(url.split("/").at(-2)!); assert.ok(intent); provider.cancelCount++;
      const payload = JSON.parse(init!.body as string); assert.match(payload.request_id, /^[0-9a-f-]{36}$/); assert.equal(payload.cancellation_reason, "Cancelled by store administrator");
      if (provider.declineCancel) return Response.json({ code: "invalid_state" }, { status: 400 });
      if (provider.paidDuringCancel) { intent.status = "SUCCEEDED"; intent.captured_amount = intent.amount; return Response.json({ code: "invalid_state" }, { status: 400 }); }
      intent.status = "CANCELLED";
      if (provider.loseCancelResponse) throw new Error("simulated cancellation response loss");
      return Response.json(intent);
    }
    provider.retrieveCount++;
    const intent = intents.get(url.split("/").pop()!);
    assert.ok(intent, "tests never contact a live provider"); return Response.json(intent);
  };
  const tasks: Promise<unknown>[] = [];
  const handle = (action: string, request: Request) => handleCommerce(action, request, env, (task) => { tasks.push(task); });
  const hook = (event: unknown, timestamp = String(Date.now()), signature?: string) => {
    const raw = typeof event === "string" ? event : JSON.stringify(event);
    return handleAirwallexWebhook(new Request(`${ORIGIN}/api/airwallex/webhook`, { method: "POST", headers: { "x-timestamp": timestamp, "x-signature": signature ?? createHmac("sha256", env.AIRWALLEX_WEBHOOK_SECRET!).update(timestamp + raw).digest("hex") }, body: raw }), env, (task) => { tasks.push(task); });
  };
  const voucher = (code = "SAVE10", maxUses: number | null = null) => db.prepare("INSERT INTO commerce_vouchers (code, kind, amount, min_subtotal_cents, max_uses, active, created_at) VALUES (?, 'percent', 10, 0, ?, 1, ?)").run(code, maxUses, Date.now());
  const count = (table: string) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()!.count;
  return { db, env, intents, provider, fetcher, requests, handle, hook, mail, tasks, voucher, count };
}
async function created(fixture: ReturnType<typeof setup>, value = body()) {
  const response = await fixture.handle("create", post("create", value));
  assert.equal(response.status, 200); const payment = await decode(response);
  return { payment, cookie: response.headers.get("set-cookie")!.split(";")[0], response };
}

test("commerce: strict carts reject price overrides, malformed entries, duplicates and silent limit truncation", () => {
  for (const value of [null, [], [{ slug: "missing", quantity: 1 }], [{ slug: "midnight", quantity: "1" }], [{ slug: "midnight", quantity: 1.5 }], [{ slug: "midnight", quantity: 0 }], [{ slug: "midnight", quantity: 11 }], [{ slug: "midnight", quantity: 1, priceCents: 1 }], [{ slug: "midnight", quantity: 1 }, { slug: "midnight", quantity: 1 }], ["midnight", {}], [{ slug: "midnight", quantity: 10 }, { slug: "golden", quantity: 10 }, { slug: "forest", quantity: 10 }, { slug: "dark", quantity: 1 }]]) assert.throws(() => strictCart(value));
  assert.deepEqual(strictCart([{ slug: "midnight", quantity: 10 }, { slug: "golden", quantity: 10 }, { slug: "forest", quantity: 10 }]), [{ slug: "forest", quantity: 10 }, { slug: "golden", quantity: 10 }, { slug: "midnight", quantity: 10 }]);
});

test("commerce: only an HK district and bounded delivery fields pass server validation", () => {
  assert.equal(deliveryDetails(details).phone, "+85223456789");
  assert.equal(deliveryDetails({ ...details, notes: "Use side entrance\nCall on arrival" }).notes, "Use side entrance\nCall on arrival");
  for (const value of [{ ...details, country: "CN" }, { ...details, district: "shanghai" }, { ...details, building: "" }, { ...details, name: "A\nB" }, { ...details, phone: "+8623456789" }, { ...details, email: "..a@example.com" }, { ...details, email: "a@example.com\nBcc:b@example.com" }, { ...details, notes: "x".repeat(1001) }]) assert.throws(() => deliveryDetails(value));
});

test("commerce: voucher money rounds down, affects merchandise only and never makes checkout free", () => {
  const voucher: VoucherRow = { code: "SAVE10", kind: "percent", amount: 10, min_subtotal_cents: 0, expires_at: null, max_uses: null, active: 1 };
  assert.equal(discountFor(voucher, 22801, Date.now()), 2280);
  assert.equal(discountFor({ ...voucher, kind: "fixed", amount: 999999 }, 22800, Date.now()), 22800);
  for (const invalid of [{ ...voucher, active: 0 }, { ...voucher, amount: 101 }, { ...voucher, expires_at: Date.now() - 1 }, { ...voucher, min_subtotal_cents: 30000 }]) assert.throws(() => discountFor(invalid, 22800, Date.now()));
});

test("commerce: quotes use server prices, and browser origin/body boundaries fail closed", async () => {
  const fixture = setup(); fixture.voucher();
  const quote = await decode(await fixture.handle("quote", post("quote", { items: [{ slug: "golden", quantity: 2 }], voucher: " save10 " })));
  assert.deepEqual([quote.subtotalCents, quote.deliveryCents, quote.discountCents, quote.totalCents, quote.voucherCode], [51600, 0, 5160, 46440, "SAVE10"]);
  assert.equal((await fixture.handle("quote", new Request(`${ORIGIN}/api/commerce/quote`, { method: "POST", headers: { Origin: "https://attacker.example", "Content-Type": "application/json" }, body: "{}" }))).status, 403);
  assert.equal((await fixture.handle("quote", post("quote", { items: [{ slug: "golden", quantity: 1 }], totalCents: 1 }))).status, 400);
  assert.equal((await fixture.handle("quote", new Request(`${ORIGIN}/api/commerce/quote`, { method: "POST", headers: { Origin: ORIGIN, "Content-Type": "application/json" }, body: "x".repeat(17000) }))).status, 413);
});

test("commerce: verified email and production HTTPS origin are mandatory before order or intent creation", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher);
  assert.equal((await fixture.handle("create", post("create", body(), ""))).status, 401);
  assert.equal((await fixture.handle("create", post("create", body({ details: { ...details, email: "other@example.com" } })))).status, 401);
  assert.equal((await fixture.handle("create", post("create", body(), EMAIL_COOKIE, "http://localhost:3000"))).status, 403);
  assert.equal(fixture.count("commerce_orders"), 0); assert.equal(fixture.requests.length, 0);
});

test("commerce: order snapshot exists before provider create and UUID alone cannot reveal or resume it", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher);
  const { payment, cookie, response } = await created(fixture);
  assert.equal(payment.totalCents, 25800); assert.equal(fixture.requests[0].amount, 258); assert.equal(fixture.requests[0].currency, "HKD");
  assert.match(response.headers.get("set-cookie")!, /; HttpOnly; Secure; SameSite=Lax$/);
  assert.doesNotMatch(JSON.stringify(payment), /test-api-key|test-cookie-secret|access_hash|request_digest|alex@example/);
  assert.equal((await fixture.handle("order", get(payment.orderId))).status, 404);
  assert.equal((await fixture.handle("resume", post("resume", { id: payment.orderId }, ""))).status, 404);
  const order = await decode(await fixture.handle("order", get(payment.orderId, cookie)));
  assert.equal(order.id, payment.orderId); assert.equal(order.items[0].unitPriceCents, 25800); assert.equal(order.status, "unpaid");
  assert.throws(() => fixture.db.prepare("UPDATE commerce_orders SET total_cents = 1 WHERE id = ?").run(payment.orderId), /immutable_order_snapshot/);
});

test("commerce: same request UUID reuses immutable intent even after voucher deactivation; changed bodies conflict", async (t) => {
  const fixture = setup(); fixture.voucher(); t.mock.method(globalThis, "fetch", fixture.fetcher);
  const value = body({ voucher: "SAVE10" }), first = await created(fixture, value);
  fixture.db.prepare("UPDATE commerce_vouchers SET active = 0 WHERE code = 'SAVE10'").run();
  const retry = await created(fixture, value);
  assert.equal(retry.payment.intentId, first.payment.intentId); assert.equal(fixture.count("commerce_orders"), 1); assert.equal(fixture.requests.length, 1);
  assert.equal((await fixture.handle("create", post("create", { ...value, items: [{ slug: "golden", quantity: 1 }] }))).status, 409);
  assert.equal(fixture.requests.length, 1);
});

test("commerce: simultaneous same-key creates produce one durable order and one intent", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher); const value = body();
  const responses = await Promise.all(Array.from({ length: 8 }, () => fixture.handle("create", post("create", value))));
  assert.ok(responses.every((response) => response.status === 200 || response.status === 409));
  assert.equal(fixture.count("commerce_orders"), 1); assert.equal(fixture.requests.length, 1);
  const retry = await created(fixture, value); assert.equal(retry.payment.intentId, [...fixture.intents.keys()][0]);
});

test("commerce: network loss retries the identical original request, amount, order and callback", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher); fixture.provider.failAfterCreate = true; const value = body();
  const failure = await fixture.handle("create", post("create", value)); assert.equal(failure.status, 503);
  assert.ok(failure.headers.get("set-cookie")); assert.equal(fixture.count("commerce_orders"), 1);
  const cookie = failure.headers.get("set-cookie")!.split(";")[0], id = fixture.db.prepare("SELECT id FROM commerce_orders").get()!.id as string;
  const resumed = await decode(await fixture.handle("resume", post("resume", { id }, cookie)));
  assert.equal(resumed.intentId, [...fixture.intents.keys()][0]); assert.equal(fixture.intents.size, 1); assert.equal(fixture.requests.length, 2);
  assert.deepEqual(fixture.requests[1], fixture.requests[0]);
});

test("commerce: max-use voucher reservations are atomic and roll back losing orders", async (t) => {
  const fixture = setup(); fixture.voucher("LASTONE", 1); t.mock.method(globalThis, "fetch", fixture.fetcher);
  const responses = await Promise.all(Array.from({ length: 8 }, () => fixture.handle("create", post("create", body({ voucher: "LASTONE" })))));
  assert.equal(responses.filter((response) => response.status === 200).length, 1);
  assert.ok(responses.every((response) => response.status === 200 || response.status === 422));
  assert.equal(fixture.count("commerce_orders"), 1); assert.equal(fixture.count("commerce_voucher_reservations"), 1); assert.equal(fixture.requests.length, 1);
});

test("commerce: reconciliation rejects foreign intents, currency, fractional amounts and partial capture", () => {
  const order = { id: crypto.randomUUID(), total_cents: 25800, currency: "HKD" as const, payment_intent_id: "int_123456789" };
  const intent = { id: order.payment_intent_id, merchant_order_id: order.id, amount: 258, currency: "HKD", status: "SUCCEEDED", captured_amount: 258 };
  assert.equal(validateIntent(intent, order).status, "SUCCEEDED");
  for (const invalid of [{ ...intent, id: "int_other123" }, { ...intent, merchant_order_id: crypto.randomUUID() }, { ...intent, currency: "USD" }, { ...intent, amount: 257.999 }, { ...intent, amount: 257.99 }, { ...intent, captured_amount: 200 }, { ...intent, status: "MADE_UP" }]) assert.throws(() => validateIntent(invalid, order));
});

test("commerce: webhook signatures bind raw bytes to a five-minute millisecond timestamp", () => {
  const raw = '{ "id": "evt_test" }', secret = "test-secret", now = Date.now(), timestamp = String(now);
  const signature = createHmac("sha256", secret).update(timestamp + raw).digest("hex");
  assert.equal(validWebhookSignature(raw, timestamp, signature, secret, now), true);
  assert.equal(validWebhookSignature(raw.replaceAll(" ", ""), timestamp, signature, secret, now), false);
  assert.equal(validWebhookSignature(raw, timestamp, signature, secret, now + 300001), false);
  assert.equal(validWebhookSignature(raw, String(Math.floor(now / 1000)), signature, secret, now), false);
  assert.equal(validWebhookSignature(raw, timestamp, "0".repeat(64), secret, now), false);
});

test("commerce: signed webhook marks closed-browser payment paid, redeems once and deduplicates receipt", async (t) => {
  const fixture = setup(); fixture.voucher(); t.mock.method(globalThis, "fetch", fixture.fetcher);
  const { payment, cookie } = await created(fixture, body({ voucher: "SAVE10" })); const intent = fixture.intents.get(payment.intentId)!;
  intent.status = "SUCCEEDED"; intent.captured_amount = intent.amount;
  const event = { id: "evt_paid_1", name: "payment_intent.succeeded", data: { object: intent } };
  assert.equal((await fixture.hook(event)).status, 200); assert.equal((await fixture.hook(event)).status, 200);
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_orders").get()!.status, "paid");
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "redeemed"); assert.equal(fixture.mail.length, 1); assert.equal(fixture.count("commerce_webhook_events"), 1);
  assert.equal((await fixture.handle("resume", post("resume", { id: payment.orderId }, cookie))).status, 409);
  const order = await decode(await fixture.handle("order", get(payment.orderId, cookie))); assert.equal(order.status, "paid"); assert.ok(order.paidAt); assert.equal(order.clientSecret, undefined);
  intent.status = "REQUIRES_PAYMENT_METHOD";
  assert.equal((await fixture.hook({ ...event, id: "evt_stale_1", name: "payment_intent.updated" })).status, 200);
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_orders").get()!.status, "paid"); assert.equal(fixture.mail.length, 1);
});

test("commerce: failed attempt keeps reservation, provider cancellation releases it, browser cancel flag does neither", async (t) => {
  const fixture = setup(); fixture.voucher(); t.mock.method(globalThis, "fetch", fixture.fetcher);
  const { payment, cookie } = await created(fixture, body({ voucher: "SAVE10" })); const intent = fixture.intents.get(payment.intentId)!;
  const browserCancel = new Request(`${ORIGIN}/api/commerce/order?id=${payment.orderId}&cancelled=1`, { headers: { Cookie: cookie } });
  assert.equal((await decode(await fixture.handle("order", browserCancel))).status, "unpaid");
  intent.latest_payment_attempt = { status: "AUTHORIZATION_FAILED" };
  assert.equal((await fixture.hook({ id: "evt_failed_1", name: "payment_attempt.authorization_failed", data: { object: { payment_intent_id: intent.id } } })).status, 200);
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_orders").get()!.status, "failed"); assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "reserved");
  intent.status = "CANCELLED";
  assert.equal((await fixture.hook({ id: "evt_cancelled_1", name: "payment_intent.cancelled", data: { object: intent } })).status, 200);
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_orders").get()!.status, "cancelled"); assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "released");
});

test("commerce: receipt delivery failure keeps paid state and retries safely on duplicate webhook", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher); const { payment } = await created(fixture); const intent = fixture.intents.get(payment.intentId)!;
  intent.status = "SUCCEEDED";
  let fail = true; fixture.env.EMAIL!.send = async (message) => { if (fail) throw new Error("simulated mail outage"); fixture.mail.push(message); };
  const event = { id: "evt_mail_retry", name: "payment_intent.succeeded", data: { object: intent } };
  assert.equal((await fixture.hook(event)).status, 503); assert.equal(fixture.db.prepare("SELECT status FROM commerce_orders").get()!.status, "paid"); assert.equal(fixture.db.prepare("SELECT receipt_sent_at FROM commerce_orders").get()!.receipt_sent_at, null);
  fail = false; assert.equal((await fixture.hook(event)).status, 200); assert.equal(fixture.mail.length, 1);
});

test("commerce: bounded admin synchronization reconciles existing intents without new payment creation", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher); const { payment } = await created(fixture);
  fixture.intents.get(payment.intentId)!.status = "SUCCEEDED";
  await syncPendingOrders(fixture.env, 5);
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_orders").get()!.status, "paid"); assert.equal(fixture.requests.length, 1); assert.equal(fixture.mail.length, 1);
});

test("commerce: signed webhook cannot replace the original order's payment intent or confirm a mismatched amount", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher); const { payment } = await created(fixture);
  const original = fixture.intents.get(payment.intentId)!;
  const foreign = { ...original, id: "int_foreign123456", status: "SUCCEEDED" }; fixture.intents.set(foreign.id, foreign);
  assert.equal((await fixture.hook({ id: "evt_foreign", name: "payment_intent.succeeded", data: { object: foreign } })).status, 503);
  assert.equal(fixture.db.prepare("SELECT payment_intent_id FROM commerce_orders").get()!.payment_intent_id, payment.intentId);
  original.status = "SUCCEEDED"; original.amount = 1;
  assert.equal((await fixture.hook({ id: "evt_wrong_amount", name: "payment_intent.succeeded", data: { object: original } })).status, 503);
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_orders").get()!.status, "unpaid"); assert.equal(fixture.count("commerce_webhook_events"), 0); assert.equal(fixture.mail.length, 0);
});

test("commerce: retained opaque token stops granting access after the server's thirty-day expiry", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher); const { payment, cookie } = await created(fixture);
  const future = Date.now() + 2592000001; t.mock.method(Date, "now", () => future);
  assert.equal((await fixture.handle("order", get(payment.orderId, cookie))).status, 404);
  assert.equal((await fixture.handle("resume", post("resume", { id: payment.orderId }, cookie))).status, 404);
});

test("commerce: definitive create rejection releases voucher capacity and closes discounted retry", async (t) => {
  const fixture = setup(); fixture.voucher("SAVE10", 1); t.mock.method(globalThis, "fetch", fixture.fetcher); fixture.provider.failDefinitively = true;
  const value = body({ voucher: "SAVE10" }), response = await fixture.handle("create", post("create", value)); assert.equal(response.status, 503);
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "released");
  assert.equal((await fixture.handle("create", post("create", value))).status, 410); assert.equal(fixture.requests.length, 1);
  fixture.provider.failDefinitively = false; assert.equal((await fixture.handle("create", post("create", body({ voucher: "SAVE10" })))).status, 200);
});

test("commerce: successful sandbox payment reconciles as sandbox and never sends a real payment receipt", async (t) => {
  const fixture = setup(); fixture.env.AIRWALLEX_MODE = "sandbox"; t.mock.method(globalThis, "fetch", fixture.fetcher);
  const { payment, cookie } = await created(fixture); const intent = fixture.intents.get(payment.intentId)!; intent.status = "SUCCEEDED";
  assert.equal((await fixture.hook({ id: "evt_sandbox_paid", name: "payment_intent.succeeded", data: { object: intent } })).status, 200);
  const order = await decode(await fixture.handle("order", get(payment.orderId, cookie)));
  await Promise.all(fixture.tasks);
  assert.equal(order.status, "paid"); assert.equal(order.mode, "sandbox"); assert.equal(fixture.mail.length, 0);
});

test("commerce: configured account ID rejects signed foreign or missing-account webhooks", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher); const { payment } = await created(fixture); const intent = fixture.intents.get(payment.intentId)!; intent.status = "SUCCEEDED";
  fixture.env.AIRWALLEX_ACCOUNT_ID = "test-expected-account";
  const event = { id: "evt_account_bound", name: "payment_intent.succeeded", data: { object: intent } };
  assert.equal((await fixture.hook(event)).status, 400);
  assert.equal((await fixture.hook({ ...event, account_id: "other-account" })).status, 400);
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_orders").get()!.status, "unpaid");
  assert.equal((await fixture.hook({ ...event, account_id: "test-expected-account" })).status, 200); assert.equal(fixture.mail.length, 1);
});

test("commerce: separate endpoint/IP throttles fail closed and verified email limits creation across IPs", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher);
  delete fixture.env.CHECKOUT_RATE_LIMITER;
  assert.equal((await fixture.handle("quote", post("quote", { items: [{ slug: "midnight", quantity: 1 }] }))).status, 503);
  const seen: string[] = [];
  fixture.env.CHECKOUT_RATE_LIMITER = { limit: async ({ key }) => { seen.push(key); return { success: !key.startsWith("commerce:create:email:") }; } };
  const rejected = await fixture.handle("create", post("create", body())); assert.equal(rejected.status, 429); assert.equal(rejected.headers.get("retry-after"), "60");
  assert.equal(fixture.count("commerce_orders"), 0); assert.equal(fixture.requests.length, 0);
  assert.ok(seen.includes("commerce:create:ip:local")); assert.ok(seen.some((key) => /^commerce:create:email:[0-9a-f]{64}$/.test(key)));
  fixture.env.CHECKOUT_RATE_LIMITER = { limit: async ({ key }) => { seen.push(key); return { success: false }; } };
  assert.equal((await fixture.handle("quote", post("quote", { items: [{ slug: "midnight", quantity: 1 }] }))).status, 429);
  assert.equal((await fixture.handle("resume", post("resume", { id: crypto.randomUUID() }))).status, 429);
  assert.ok(seen.includes("commerce:quote:ip:local")); assert.ok(seen.includes("commerce:resume:ip:local"));
});

test("commerce: authenticated cancellation reconciles first, confirms provider cancellation and releases one voucher slot", async (t) => {
  const fixture = setup(); fixture.voucher("LASTONE", 1); t.mock.method(globalThis, "fetch", fixture.fetcher); const { payment } = await created(fixture, body({ voucher: "LASTONE" }));
  fixture.provider.loseCancelResponse = true;
  assert.equal((await cancelUnpaidOrder(fixture.env, payment.orderId)).status, "cancelled");
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "released");
  assert.equal((await cancelUnpaidOrder(fixture.env, payment.orderId)).status, "cancelled"); assert.equal(fixture.provider.cancelCount, 1);
  assert.equal((await fixture.handle("create", post("create", body({ voucher: "LASTONE" })))).status, 200);
});

test("commerce: paid and asynchronous pending intents refuse cancellation while preserving truthful reservation state", async (t) => {
  const fixture = setup(); fixture.voucher(); t.mock.method(globalThis, "fetch", fixture.fetcher); const { payment } = await created(fixture, body({ voucher: "SAVE10" })); const intent = fixture.intents.get(payment.intentId)!;
  for (const status of ["PENDING", "PENDING_REVIEW"]) {
    intent.status = status;
    await assert.rejects(cancelUnpaidOrder(fixture.env, payment.orderId), (error: unknown) => (error as { code: string }).code === "payment_not_cancellable");
    assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "reserved");
  }
  intent.status = "SUCCEEDED";
  await assert.rejects(cancelUnpaidOrder(fixture.env, payment.orderId), (error: unknown) => (error as { code: string }).code === "already_paid");
  assert.equal(fixture.provider.cancelCount, 0); assert.equal(fixture.db.prepare("SELECT status FROM commerce_orders").get()!.status, "paid"); assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "redeemed");
});

test("commerce: staff cancellation holds capacity while original-intent recovery or cancellation remains uncertain", async (t) => {
  const fixture = setup(); fixture.voucher(); t.mock.method(globalThis, "fetch", fixture.fetcher); fixture.provider.failAfterCreate = true;
  const response = await fixture.handle("create", post("create", body({ voucher: "SAVE10" }))); const uncertain = await decode(response);
  fixture.provider.failAfterCreate = true;
  await assert.rejects(cancelUnpaidOrder(fixture.env, uncertain.orderId));
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "reserved"); assert.equal(fixture.provider.cancelCount, 0);
  assert.equal(fixture.db.prepare("SELECT payment_intent_id FROM commerce_orders").get()!.payment_intent_id, null);
  assert.equal(fixture.intents.size, 1); assert.deepEqual(fixture.requests[1], fixture.requests[0]);
  fixture.provider.declineCancel = true;
  await assert.rejects(cancelUnpaidOrder(fixture.env, uncertain.orderId), (error: unknown) => (error as { code: string }).code === "cancellation_not_confirmed");
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "reserved");
  assert.equal(fixture.intents.size, 1); assert.deepEqual(fixture.requests[2], fixture.requests[0]);
});

test("commerce: staff cancellation recovers a lost create response using its original request and confirms cancellation before release", async (t) => {
  const fixture = setup(); fixture.voucher("LASTONE", 1); t.mock.method(globalThis, "fetch", fixture.fetcher); fixture.provider.failAfterCreate = true;
  const value = body({ voucher: "LASTONE" }), response = await fixture.handle("create", post("create", value)), uncertain = await decode(response);
  assert.equal(response.status, 503); assert.equal(fixture.db.prepare("SELECT payment_intent_id FROM commerce_orders").get()!.payment_intent_id, null);
  assert.equal((await cancelUnpaidOrder(fixture.env, uncertain.orderId)).status, "cancelled");
  assert.equal(fixture.intents.size, 1); assert.equal(fixture.requests.length, 2); assert.deepEqual(fixture.requests[1], fixture.requests[0]);
  assert.equal(fixture.requests[0].request_id, value.requestId); assert.equal(fixture.provider.cancelCount, 1); assert.equal(fixture.provider.retrieveCount, 2);
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "released");
  assert.equal((await fixture.handle("create", post("create", body({ voucher: "LASTONE" })))).status, 200);
});

test("commerce: payment racing admin cancellation wins reconciliation and never frees voucher capacity", async (t) => {
  const fixture = setup(); fixture.voucher(); t.mock.method(globalThis, "fetch", fixture.fetcher); const { payment } = await created(fixture, body({ voucher: "SAVE10" }));
  fixture.provider.paidDuringCancel = true;
  await assert.rejects(cancelUnpaidOrder(fixture.env, payment.orderId), (error: unknown) => (error as { code: string }).code === "already_paid");
  assert.equal(fixture.db.prepare("SELECT status FROM commerce_orders").get()!.status, "paid"); assert.equal(fixture.db.prepare("SELECT status FROM commerce_voucher_reservations").get()!.status, "redeemed"); assert.equal(fixture.mail.length, 1);
});

test("commerce: sold-out scents and a closed shop block new checkouts and unpaid resumes", async (t) => {
  const fixture = setup(); t.mock.method(globalThis, "fetch", fixture.fetcher);
  const stock = async () => (await fixture.handle("stock", new Request(`${ORIGIN}/api/commerce/stock`))).json();
  assert.deepEqual(await stock(), { closed: false, soldOut: [] });
  const { payment, cookie } = await created(fixture);
  fixture.db.prepare("INSERT INTO shop_inventory (slug, sold_out, updated_by, updated_at) VALUES ('midnight', 1, 'natasha', 0)").run();
  assert.deepEqual(await stock(), { closed: false, soldOut: ["midnight"] });
  const blocked = await fixture.handle("create", post("create", body()));
  assert.equal(blocked.status, 409); assert.equal((await blocked.json()).error, "sold_out");
  assert.equal((await fixture.handle("create", post("create", body({ items: [{ slug: "golden", quantity: 1 }] })))).status, 200);
  const resume = await fixture.handle("resume", post("resume", { id: payment.orderId }, cookie));
  assert.equal(resume.status, 409); assert.equal((await resume.json()).error, "sold_out");
  fixture.db.prepare("UPDATE shop_state SET closed = 1").run();
  assert.equal((await stock()).closed, true);
  const closed = await fixture.handle("create", post("create", body({ items: [{ slug: "golden", quantity: 1 }] })));
  assert.equal(closed.status, 409); assert.equal((await closed.json()).error, "shop_closed");
  assert.equal((await fixture.handle("quote", post("quote", { items: [{ slug: "golden", quantity: 1 }] }))).status, 200);
});
