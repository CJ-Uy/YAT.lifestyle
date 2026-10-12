import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { getVerifiedEmail, handleCheckoutEmail, type CheckoutEmailEnv } from "./checkout-email.server.ts";

const ORIGIN = "https://yatlifestyle.com";
function setup() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0006_checkout_email.sql", import.meta.url), "utf8"));
  const mail: Parameters<CheckoutEmailEnv["EMAIL"]["send"]>[0][] = [];
  const clock = { t: 1_790_000_000_000 }, limits = { allowed: true, keys: [] as string[] };
  const env: CheckoutEmailEnv = {
    DB: { prepare: (sql) => ({ bind: (...values) => ({
      first: async () => (db.prepare(sql).get(...values) ?? null) as never,
      run: async () => { db.prepare(sql).run(...values); return { success: true }; },
    }) }) },
    EMAIL: { send: async (message) => { mail.push(message); } },
    CHECKOUT_CODE_PEPPER: "a-test-only-secret-that-is-at-least-32-characters",
    CHECKOUT_RATE_LIMITER: { limit: async ({ key }) => { limits.keys.push(key); return { success: limits.allowed }; } },
  };
  const handle = (action: string, request: Request) => handleCheckoutEmail(action, request, env, () => clock.t);
  return { db, env, mail, clock, limits, handle };
}
const post = (action: string, body: unknown, headers: Record<string, string> = {}, origin = ORIGIN) => new Request(`${origin}/api/checkout-email/${action}`, {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json", "cf-connecting-ip": "203.0.113.5", ...headers }, body: JSON.stringify(body),
});
const status = (cookie = "") => new Request(`${ORIGIN}/api/checkout-email/status`, { headers: { Cookie: cookie, "cf-connecting-ip": "203.0.113.5" } });
const codeIn = (mail: { text: string }) => mail.text.match(/\b\d{6}\b/)![0];
const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, "0");

test("checkout email: delivery must succeed before a code can be used or claimed sent", async () => {
  const { handle, env, db, mail } = setup();
  env.EMAIL.send = async (message) => { mail.push(message); throw new Error("delivery failed"); };
  const failed = await handle("request", post("request", { email: "a@example.com", locale: "en" }));
  assert.equal(failed.status, 503);
  assert.deepEqual(await failed.json(), { ok: false, error: "send-failed" });
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM checkout_email_codes").get()!.n, 0);
  assert.equal((await handle("verify", post("verify", { email: "a@example.com", code: codeIn(mail[0]) }))).status, 400);
});

test("checkout email: simultaneous sends reserve one 60-second resend window", async () => {
  const { handle, mail, clock } = setup();
  const requests = await Promise.all(Array.from({ length: 8 }, () => handle("request", post("request", { email: "a@example.com", locale: "en" }))));
  assert.equal(requests.filter((response) => response.status === 200).length, 1);
  assert.equal(requests.filter((response) => response.status === 429).length, 7);
  assert.equal(mail.length, 1);
  assert.deepEqual(await requests.find((response) => response.status === 200)!.json(), { ok: true, resendAfter: 60 });
  clock.t += 59_000;
  const early = await handle("request", post("request", { email: "a@example.com", locale: "en" }));
  assert.equal(early.status, 429);
  assert.equal(early.headers.get("retry-after"), "1");
  clock.t += 1000;
  assert.equal((await handle("request", post("request", { email: "a@example.com", locale: "zh-Hant" }))).status, 200);
  assert.equal(mail.length, 2);
  assert.match(mail[1].subject, /驗證碼/);
});

test("checkout email: five guesses are atomic, and even the correct sixth guess is denied", async () => {
  const { handle, mail, db } = setup();
  await handle("request", post("request", { email: "a@example.com", locale: "en" }));
  const code = codeIn(mail[0]);
  const guesses = await Promise.all(Array.from({ length: 12 }, () => handle("verify", post("verify", { email: "a@example.com", code: wrong(code) }))));
  assert.ok(guesses.every((response) => response.status === 400));
  assert.equal(db.prepare("SELECT attempts FROM checkout_email_codes").get()!.attempts, 5);
  assert.equal((await handle("verify", post("verify", { email: "a@example.com", code }))).status, 400);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM checkout_email_proofs").get()!.n, 0);
});

test("checkout email: a correct code can issue only one proof under concurrent verification and replay", async () => {
  const { handle, mail, db, env, clock } = setup();
  await handle("request", post("request", { email: " A@Example.com ", locale: "en" }));
  const code = codeIn(mail[0]);
  assert.equal(mail[0].to, "a@example.com");
  const stored = db.prepare("SELECT code_hash FROM checkout_email_codes").get()!.code_hash;
  assert.match(stored as string, /^[a-f0-9]{64}$/);
  assert.notEqual(stored, code);
  const verified = await Promise.all(Array.from({ length: 8 }, () => handle("verify", post("verify", { email: "a@example.com", code }))));
  assert.equal(verified.filter((response) => response.status === 200).length, 1);
  assert.equal(verified.filter((response) => response.status === 400).length, 7);
  const winner = verified.find((response) => response.status === 200)!;
  assert.deepEqual(await winner.json(), { ok: true, email: "a@example.com", expiresIn: 1800 });
  const setCookie = winner.headers.get("set-cookie")!;
  assert.match(setCookie, /^yat_checkout_email=[A-Za-z0-9_-]{43}; Path=\/; Max-Age=1800; HttpOnly; Secure; SameSite=Lax$/);
  const cookie = setCookie.split(";")[0], raw = cookie.split("=")[1];
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM checkout_email_proofs").get()!.n, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM checkout_email_proofs WHERE id_hash = ?").get(raw)!.n, 0);
  assert.equal(await getVerifiedEmail(status(cookie), env, () => clock.t), "a@example.com");
  assert.deepEqual(await (await handle("status", status(cookie))).json(), { ok: true, email: "a@example.com", expiresIn: 1800 });
  assert.equal((await handle("verify", post("verify", { email: "a@example.com", code }))).status, 400);
  assert.equal(await getVerifiedEmail(status("yat_checkout_email=" + "x".repeat(43)), env, () => clock.t), null);
});

test("checkout email: codes are bound to normalized email, and expire at ten minutes", async () => {
  const { handle, mail, db, clock } = setup();
  await handle("request", post("request", { email: "a@example.com", locale: "en" }));
  const code = codeIn(mail[0]);
  const row = db.prepare("SELECT * FROM checkout_email_codes WHERE email = ?").get("a@example.com")!;
  db.prepare("INSERT INTO checkout_email_codes (email, code_hash, expires_at, requested_at, delivered_at) VALUES (?, ?, ?, ?, ?)")
    .run("b@example.com", row.code_hash!, row.expires_at!, row.requested_at!, row.delivered_at!);
  assert.equal((await handle("verify", post("verify", { email: "b@example.com", code }))).status, 400, "copying a hash to another address does not make the code valid there");
  clock.t += 10 * 60_000;
  assert.equal((await handle("verify", post("verify", { email: "a@example.com", code }))).status, 400);
});

test("checkout email: proofs last thirty minutes, and a new code does not revoke an existing proof", async () => {
  const { handle, mail, env, clock } = setup();
  await handle("request", post("request", { email: "a@example.com", locale: "en" }));
  const verified = await handle("verify", post("verify", { email: "a@example.com", code: codeIn(mail[0]) }));
  const cookie = verified.headers.get("set-cookie")!.split(";")[0];
  clock.t += 60_000;
  await handle("request", post("request", { email: "a@example.com", locale: "en" }));
  assert.equal(await getVerifiedEmail(status(cookie), env, () => clock.t), "a@example.com");
  assert.deepEqual(await (await handle("status", status(cookie))).json(), { ok: true, email: "a@example.com", expiresIn: 1740 });
  clock.t += 29 * 60_000;
  assert.equal(await getVerifiedEmail(status(cookie), env, () => clock.t), null);
  assert.deepEqual(await (await handle("status", status(cookie))).json(), { ok: true, email: null, expiresIn: 0 });
});

test("checkout email: trust boundaries fail closed, with IP and hashed-email throttles", async () => {
  const { handle, env, limits, mail } = setup();
  const body = { email: "a@example.com", locale: "en" };
  assert.equal((await handle("request", post("request", body, { Origin: "https://evil.example" }))).status, 403);
  assert.equal((await handle("request", post("request", body, { "Content-Type": "text/plain" }))).status, 415);
  assert.equal((await handle("request", post("request", { ...body, extra: "x".repeat(5000) }))).status, 413);
  assert.equal((await handle("request", post("request", { ...body, email: ".a@example.com" }))).status, 400);
  assert.equal((await handle("status", new Request(`${ORIGIN}/api/checkout-email/status`, { headers: { Origin: "https://evil.example" } }))).status, 403);
  limits.keys = [];
  await handle("request", post("request", body));
  assert.equal(limits.keys[0], "yat-checkout-email:request:ip:203.0.113.5");
  assert.match(limits.keys[1], /^yat-checkout-email:request:email:[a-f0-9]{64}$/);
  assert.ok(limits.keys.every((key) => !key.includes(body.email)));
  limits.allowed = false;
  assert.equal((await handle("request", post("request", { ...body, email: "other@example.com" }))).status, 429);
  assert.equal(mail.length, 1);
  env.CHECKOUT_CODE_PEPPER = undefined;
  assert.equal((await handle("request", post("request", body))).status, 503);
});

test("checkout email: HTTP localhost can retain its HttpOnly proof, while deployment cookies remain Secure", async () => {
  const { handle, mail } = setup();
  await handle("request", post("request", { email: "a@example.com", locale: "en" }, {}, "http://localhost:3000"));
  const verified = await handle("verify", post("verify", { email: "a@example.com", code: codeIn(mail[0]) }, {}, "http://localhost:3000"));
  assert.equal(verified.status, 200);
  assert.match(verified.headers.get("set-cookie")!, /HttpOnly; SameSite=Lax$/);
  assert.doesNotMatch(verified.headers.get("set-cookie")!, /Secure/);
});
