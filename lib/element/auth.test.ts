import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { handle, type Deps, type Mail } from "./api.server.ts";

const ORIGIN = "https://yat.cjuy.dev";

function setup(ai: Deps["ai"]["run"] = async () => { throw new Error("AI down"); }) {
  const db = new DatabaseSync(":memory:");
  for (const file of ["0001_newsletter.sql", "0002_element.sql", "0003_newsletter_sources.sql", "0004_element_accounts.sql"]) {
    db.exec(readFileSync(new URL(`../../migrations/${file}`, import.meta.url), "utf8"));
  }
  const mail: Mail[] = [];
  const clock = { t: Date.parse("2026-10-04T02:00:00Z") };
  const deps: Deps = {
    limiter: { limit: async () => ({ success: true }) },
    ai: { run: ai },
    db: { prepare: (sql) => ({ bind: (...v) => ({
      run: async () => { db.prepare(sql).run(...v); return { success: true }; },
      first: async () => (db.prepare(sql).get(...v) ?? null) as never,
    }) }) },
    bucket: { put: async () => ({}), get: async () => null },
    vectorize: { query: async () => ({ matches: [] }), upsert: async () => ({}) },
    now: () => clock.t,
    inferNose: (likes) => ({ type: "fresh", name: { en: "Fresh-leaning", "zh-Hant": "清新型", "zh-Hans": "清新型" },
      filled: { citrus: 3, green: 3, water: 3, floral: 3, woody: 3, amber: 3, ...likes }, muskQuiet: false }),
    waitUntil: () => {},
    pepper: "test-pepper",
    sendEmail: async (m) => { mail.push(m); },
  };
  return { db, deps, mail, clock };
}

const post = (action: string, body: unknown, headers: Record<string, string> = {}) => new Request(`${ORIGIN}/api/element/${action}`, {
  method: "POST", headers: { Origin: ORIGIN, "Content-Type": "application/json", ...headers }, body: JSON.stringify(body),
});
const codeIn = (m: Mail) => m.text.match(/\b\d{6}\b/)![0];
const verify = (deps: Deps, email: string, code: string, extra = {}) => handle("auth-verify", post("auth-verify", { email, code, ...extra }), deps);
const wrong = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, "0");

async function signIn(deps: Deps, mail: Mail[], email: string, extra = {}) {
  await handle("auth-request", post("auth-request", { email, locale: "en" }), deps);
  const res = await verify(deps, email, codeIn(mail.at(-1)!), extra);
  return { res, cookie: res.headers.get("set-cookie")!.split(";")[0] };
}

async function demoResult(deps: Deps) {
  const sessionId = (await (await handle("session", post("session", { mode: "demo", locale: "en", firstName: "Sam", adult: true, consent: true }), deps)).json()).sessionId;
  const res = await (await handle("result", post("result", { sessionId, locale: "en", base: "tea", oil: 0.7, sensitivity: "low", likes: { green: 5, floral: 4 }, tags: ["office"] }), deps)).json();
  return { sessionId, resultId: res.resultId as string, shareId: res.shareId as string };
}

test("element auth: a code expires after 10 minutes", async () => {
  const { deps, mail, clock, db } = setup();
  assert.equal((await handle("auth-request", post("auth-request", { email: "a@example.com", locale: "en" }), deps)).status, 200);
  const code = codeIn(mail[0]);
  assert.notEqual(db.prepare("SELECT code_hash FROM element_auth_codes").get()!.code_hash, code, "only the peppered hash is stored");
  clock.t += 10 * 60 * 1000 + 1;
  assert.equal((await verify(deps, "a@example.com", code)).status, 400);
});

test("element auth: five wrong attempts lock the code, even for the right one", async () => {
  const { deps, mail } = setup();
  await handle("auth-request", post("auth-request", { email: "b@example.com", locale: "en" }), deps);
  const code = codeIn(mail[0]);
  for (let i = 0; i < 5; i++) assert.equal((await verify(deps, "b@example.com", wrong(code))).status, 400);
  const locked = await verify(deps, "b@example.com", code);
  assert.equal(locked.status, 400);
  assert.equal(locked.headers.get("set-cookie"), null);
});

test("element auth: the right code issues a session cookie once and claims the demo profile", async () => {
  const { deps, mail, db } = setup();
  const { resultId } = await demoResult(deps);
  await handle("auth-request", post("auth-request", { email: "C@Example.com ", locale: "zh-Hant" }), deps);
  assert.match(mail[0].subject, /登入碼/);
  const code = codeIn(mail[0]);
  assert.equal((await verify(deps, "c@example.com", wrong(code))).status, 400, "one wrong try does not lock");
  const res = await verify(deps, "c@example.com", code, { resultId });
  assert.equal(res.status, 200);
  const cookie = res.headers.get("set-cookie")!;
  assert.match(cookie, /^yat_element=[A-Za-z0-9_-]{43}; Path=\/; Max-Age=\d+; HttpOnly; Secure; SameSite=Lax$/);
  const raw = cookie.split(";")[0].split("=")[1];
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM element_logins WHERE id_hash = ?").get(raw)!.n, 0, "the cookie value is stored hashed");
  assert.equal((await verify(deps, "c@example.com", code)).status, 400, "a used code cannot be reused");

  const me = await (await handle("profile", post("profile", {}, { Cookie: cookie.split(";")[0] }), deps)).json();
  assert.equal(me.email, "c@example.com");
  assert.equal(me.profile.shared, false, "private by default");
  assert.equal((await handle("profile", post("profile", {}), deps)).status, 401);
  assert.equal((await handle("profile", post("profile", {}, { Cookie: "yat_element=" + "x".repeat(43) }), deps)).status, 401);

  const out = await handle("auth-logout", post("auth-logout", {}, { Cookie: cookie.split(";")[0] }), deps);
  assert.match(out.headers.get("set-cookie")!, /Max-Age=0/);
  assert.equal((await handle("profile", post("profile", {}, { Cookie: cookie.split(";")[0] }), deps)).status, 401);
});

test("element auth: shared profile JSON never carries oil, pH or any reading", async () => {
  const { deps, db, mail } = setup();
  const { sessionId, resultId, shareId } = await demoResult(deps);
  db.prepare("INSERT INTO element_readings (session_id, zone, n, photo_key, readings, created_at) VALUES (?, 'ph', 1, 'k', ?, 'now')").run(sessionId, JSON.stringify({ ph: 5.3, oil: 0.7 }));
  const get = (id: string) => handle("profile", new Request(`${ORIGIN}/api/element/profile?share=${id}`), deps);
  assert.equal((await get(shareId)).status, 404, "private until shared");
  assert.equal((await handle("compare", post("compare", { a: shareId, b: "founder", locale: "en" }), deps)).status, 404, "private profiles cannot be compared by others");

  const shared = await (await handle("profile", post("profile", { resultId, shared: true }), deps)).json();
  assert.equal(shared.shareId, shareId);
  const keys = (v: unknown): string[] => v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => [k, ...keys(x)]) : [];
  for (const body of [shared, await (await get(shareId)).json(), await (await get("founder")).json()]) {
    assert.ok(!keys(body).some((k) => /^(oil|ph|readings?|skin|email|sensitivity)$/i.test(k)), JSON.stringify(body));
    assert.doesNotMatch(JSON.stringify(body), /5\.3|0\.7/);
  }
  const founder = await (await get("founder")).json();
  assert.equal(founder.noseType, "floral");
  assert.equal(founder.likes.floral, 5);

  const match = await (await handle("compare", post("compare", { a: shareId, b: "founder", locale: "en" }), deps)).json();
  assert.ok(match.percent >= 0 && match.percent <= 100);
  assert.equal(match.by, "template");

  // The owner can turn sharing off again from their account.
  const { cookie } = await signIn(deps, mail, "d@example.com", { resultId });
  const off = await (await handle("profile", post("profile", { shared: false }, { Cookie: cookie }), deps)).json();
  assert.equal(off.profile.shared, false);
  assert.equal((await get(shareId)).status, 404);
  assert.equal((await handle("compare", post("compare", { a: shareId, b: "founder", locale: "en" }, { Cookie: cookie }), deps)).status, 200, "the owner can still compare their own");
});

test("element auth: auth-request answers identically for known, unknown and failed-send addresses", async () => {
  const { deps, mail } = setup();
  const { resultId } = await demoResult(deps);
  await signIn(deps, mail, "known@example.com", { resultId });
  const shape = async (res: Response) => ({ status: res.status, body: await res.text(), cookie: res.headers.get("set-cookie"), cache: res.headers.get("cache-control") });
  const known = await shape(await handle("auth-request", post("auth-request", { email: "known@example.com", locale: "en" }), deps));
  const unknown = await shape(await handle("auth-request", post("auth-request", { email: "nobody@example.com", locale: "en" }), deps));
  const broken = await shape(await handle("auth-request", post("auth-request", { email: "x@example.com", locale: "en" }), { ...deps, sendEmail: async () => { throw new Error("domain not verified"); } }));
  const again = await shape(await handle("auth-request", post("auth-request", { email: "nobody@example.com", locale: "en" }), deps));
  assert.deepEqual(known, unknown);
  assert.deepEqual(broken, unknown);
  assert.deepEqual(again, unknown, "a resend inside a minute looks the same but sends nothing");
  assert.equal(mail.filter((m) => m.to === "nobody@example.com").length, 1);
  assert.doesNotMatch(known.body, /\d{6}/);
  assert.equal((await handle("auth-request", post("auth-request", { email: "not-an-email" }), deps)).status, 400);
});

test("element compare: AI sentence is used only when grounded in the two families", async () => {
  const a = { likes: { citrus: 5, green: 4, water: 3, floral: 2, woody: 5, amber: 1 }, tags: [] };
  const b = { likes: { citrus: 4, green: 4, water: 3, floral: 1, woody: 5, amber: 5 }, tags: [] };
  const ask = async (sentence: string) => (await (await handle("compare", post("compare", { a, b, locale: "en" }), setup(async () => ({ response: { sentence } })).deps)).json());
  assert.equal((await ask("You both reach for woody warmth, but amber is where you part ways.")).by, "ai");
  for (const bad of ["You both love woody and citrus.", "You are 80% alike in woody.", "Nothing in common."]) assert.equal((await ask(bad)).by, "template", bad);
});
