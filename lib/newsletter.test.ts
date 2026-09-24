import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { subscribe, type NewsletterEnv } from "./newsletter.server.ts";
import { NEWSLETTER_POLICY_VERSION, newsletterCopy } from "./newsletter.ts";

test("newsletter: bounded input, consent, SQL storage, duplicates, withdrawal and safe failures", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0001_newsletter.sql", import.meta.url), "utf8"));
  let allowed = true;
  const env: NewsletterEnv = {
    DB: { prepare: (sql) => ({ bind: (...values) => ({ run: async () => { db.prepare(sql).run(...values); return { success: true }; } }) }) },
    NEWSLETTER_RATE_LIMITER: { limit: async () => ({ success: allowed }) },
  };
  const payload = { email: " Test@Example.com ", locale: "en", marketingConsent: true, privacyAcknowledged: true, policyVersion: NEWSLETTER_POLICY_VERSION, website: "" };
  const request = (changes = {}, headers = {}) => new Request("https://yat.cjuy.dev/api/newsletter", {
    method: "POST", headers: { Origin: "https://yat.cjuy.dev", "Content-Type": "application/json", ...headers }, body: JSON.stringify({ ...payload, ...changes }),
  });
  const count = () => db.prepare("SELECT count(*) AS n FROM newsletter_subscribers").get()!.n;
  try {
    for (const changes of [{ email: "bad" }, { email: ".test@example.com" }, { email: "t..est@example.com" }, { email: "x\n@example.com" }, { email: "x".repeat(65) + "@example.com" }, { locale: "xx" }, { marketingConsent: false }, { marketingConsent: "true" }, { privacyAcknowledged: false }, { policyVersion: "old" }]) {
      assert.equal((await subscribe(request(changes), env)).status, 400);
    }
    assert.equal((await subscribe(request({}, { Origin: "https://attacker.example" }), env)).status, 403);
    assert.equal((await subscribe(request({}, { "Content-Type": "text/plain" }), env)).status, 415);
    assert.equal((await subscribe(request({ email: "a".repeat(5000) }), env)).status, 413);
    const malformed = request();
    assert.equal((await subscribe(new Request(malformed.url, { method: "POST", headers: malformed.headers, body: "{" }), env)).status, 400);
    assert.equal((await subscribe(new Request(malformed.url, { method: "POST", headers: malformed.headers, body: "null" }), env)).status, 400);
    assert.equal((await subscribe(new Request(malformed.url), env)).status, 405);
    assert.equal((await subscribe(request({ website: "spam" }), env)).status, 200);
    assert.equal(count(), 0);
    allowed = false;
    const limited = await subscribe(request(), env);
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("Retry-After"), "60");
    allowed = true;
    const first = await subscribe(request(), env);
    assert.equal(first.status, 200);
    assert.equal(first.headers.get("Cache-Control"), "no-store");
    const record = db.prepare("SELECT * FROM newsletter_subscribers").get()!;
    assert.equal(record.email, "test@example.com");
    assert.equal(record.marketing_consent, newsletterCopy.en.consent);
    assert.equal(record.policy_version, NEWSLETTER_POLICY_VERSION);
    assert.equal(record.privacy_acknowledged, 1);
    assert.equal(record.status, "unverified");
    assert.ok(Number.isFinite(Date.parse(String(record.consented_at))));
    const duplicate = await subscribe(request({ email: "TEST@example.com", locale: "zh-Hant" }), env);
    assert.deepEqual(await first.json(), await duplicate.json());
    assert.equal(count(), 1);
    assert.deepEqual(db.prepare("SELECT * FROM newsletter_subscribers").get(), record);
    db.prepare("UPDATE newsletter_subscribers SET status='unsubscribed' WHERE email=?").run("test@example.com");
    await subscribe(request(), env);
    assert.equal(db.prepare("SELECT status FROM newsletter_subscribers").get()!.status, "unsubscribed");
    for (const locale of ["zh-Hant", "zh-Hans"] as const) {
      assert.equal((await subscribe(request({ locale, email: `${locale}@example.com` }), env)).status, 200);
      assert.equal(db.prepare("SELECT marketing_consent FROM newsletter_subscribers WHERE locale=?").get(locale)!.marketing_consent, newsletterCopy[locale].consent);
    }
    const failed = await subscribe(request(), { ...env, DB: { prepare() { throw new Error("Private database error"); } } });
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { ok: false });
  } finally { db.close(); }
});
