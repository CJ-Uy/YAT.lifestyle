import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { handle, type Deps } from "./api.server.ts";
import { BASES } from "./bases.ts";
import { nextFromBank, type SurveyState } from "./survey.ts";
import { tune } from "./tune.ts";

const ORIGIN = "https://yat.cjuy.dev";

function setup(ai: Deps["ai"]["run"] = async () => { throw new Error("AI down"); }) {
  const db = new DatabaseSync(":memory:");
  for (const file of ["0001_newsletter.sql", "0002_element.sql", "0003_newsletter_sources.sql", "0004_element_accounts.sql", "0005_founder_nose.sql"]) {
    db.exec(readFileSync(new URL(`../../migrations/${file}`, import.meta.url), "utf8"));
  }
  const objects = new Map<string, Uint8Array<ArrayBuffer>>();
  const background: Promise<unknown>[] = [];
  const calls: { model: string; options: unknown }[] = [];
  const limits = { allowed: true, keys: [] as string[] };
  const upserts: { id: string; values: number[] }[][] = [];
  const deps: Deps = {
    limiter: { limit: async ({ key }) => { limits.keys.push(key); return { success: limits.allowed }; } },
    authLimiter: { limit: async () => ({ success: true }) },
    adminKey: "test-admin-key",
    ai: { run: async (model, input, options) => { calls.push({ model, options }); return ai(model, input, options); } },
    db: { prepare: (sql) => ({ bind: (...v) => ({
      run: async () => { db.prepare(sql).run(...v); return { success: true }; },
      first: async () => (db.prepare(sql).get(...v) ?? null) as never,
    }) }) },
    bucket: { put: async (key, value) => { objects.set(key, new Uint8Array(value as ArrayBuffer)); return {}; }, get: async (key) => (objects.has(key) ? { body: new Blob([objects.get(key)!]).stream() } : null) },
    vectorize: { query: async () => ({ matches: [] }), upsert: async (v) => { upserts.push(v); return {}; } },
    now: () => Date.parse("2026-10-04T02:00:00Z"),
    inferNose: (likes) => ({ type: "fresh", name: { en: "Fresh-leaning", "zh-Hant": "清新型", "zh-Hans": "清新型" },
      filled: { citrus: 3, green: 3, water: 3, floral: 3, woody: 3, amber: 3, ...likes }, muskQuiet: false }),
    waitUntil: (p) => { background.push(p); },
  };
  return { db, deps, objects, background, calls, limits, upserts };
}

const post = (action: string, body: unknown, headers: Record<string, string> = {}) => new Request(`${ORIGIN}/api/element/${action}`, {
  method: "POST", headers: { Origin: ORIGIN, "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body),
});
const session = async (deps: Deps) => (await (await handle("session", post("session", { mode: "demo", locale: "en", firstName: "Sam", adult: true, consent: true }), deps)).json()).sessionId as string;

test("element api: origin, size, content type and unknown actions fail fast", async () => {
  const { deps } = setup();
  assert.equal((await handle("session", post("session", {}, { Origin: "https://attacker.example" }), deps)).status, 403);
  assert.equal((await handle("session", post("session", { firstName: "x".repeat(20_000) }), deps)).status, 413);
  assert.equal((await handle("session", post("session", "{}", { "Content-Type": "text/plain" }), deps)).status, 415);
  assert.equal((await handle("nope", post("nope", {}), deps)).status, 404);
  assert.equal((await handle("session", post("session", { mode: "demo", locale: "en" }), deps)).status, 400, "consent is required");
  assert.equal((await handle("session", new Request(`${ORIGIN}/api/element/session`), deps)).status, 405);
  assert.equal((await handle("constructor", post("constructor", {}), deps)).status, 404);
  assert.equal((await handle("result", post("result", { locale: "en", base: "constructor", likes: {}, tags: [] }), deps)).status, 400);
});

test("element api: rate limited per IP right after the origin check", async () => {
  const { deps, limits } = setup();
  await handle("session", post("session", {}, { Origin: "https://attacker.example" }), deps);
  assert.equal(limits.keys.length, 0, "cross-origin requests never reach the limiter");
  limits.allowed = false;
  const res = await handle("session", post("session", { mode: "demo", locale: "en", adult: true, consent: true }, { "cf-connecting-ip": "203.0.113.9" }), deps);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("Retry-After"), "60");
  assert.deepEqual(limits.keys, ["yat-element:203.0.113.9"]);
});

test("element api: seed-tags needs the admin key and upserts every bank tag; voice with no matches returns no tags", async () => {
  const embedAll = async (model: string, input: Record<string, unknown>) =>
    model.includes("whisper") ? { text: "I walk by the harbour after work" } : { data: (input.text as string[]).map(() => [0.1, 0.2]) };
  const { deps, upserts } = setup(embedAll);
  const seed = (key?: string) => new Request(`${ORIGIN}/api/element/seed-tags`, { method: "POST", headers: key ? { "x-element-admin": key } : {} });
  assert.equal((await handle("seed-tags", seed(), deps)).status, 403);
  assert.equal((await handle("seed-tags", seed("wrong"), deps)).status, 403);
  assert.equal((await handle("seed-tags", seed("test-admin-key"), { ...deps, adminKey: "" })).status, 403, "no key configured means no seeding");
  const ok = await handle("seed-tags", seed("test-admin-key"), deps);
  assert.equal(ok.status, 200);
  const { seeded } = await ok.json();
  assert.ok(seeded > 10);
  assert.equal(upserts.flat().length, seeded);
  assert.ok(upserts.flat().some((v) => v.id === "close-quarters"));

  const form = new FormData();
  form.set("locale", "en");
  form.set("audio", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }), "a.webm");
  const before = upserts.length;
  const voice = await handle("voice", new Request(`${ORIGIN}/api/element/voice`, { method: "POST", headers: { Origin: ORIGIN }, body: form }), deps);
  assert.deepEqual((await voice.json()).tags, []);
  assert.equal(upserts.length, before, "voice never seeds the index");
});

test("element api: result still explains every change with templates when the AI throws", async () => {
  const { db, deps, background, calls } = setup();
  const sessionId = await session(deps);
  const input = { sessionId, locale: "en", base: "forest", oil: 0.2, sensitivity: "low", trust: 1, likes: { woody: 5, citrus: 2 }, tags: ["post-gym", "close-quarters"] };
  const res = await handle("result", post("result", input), deps);
  assert.equal(res.status, 200);
  const body = await res.json();
  const expected = tune("forest", { oil: 0.2, sensitivity: "low", tags: input.tags, muskQuiet: false, trust: 1 });
  assert.deepEqual(body.changes, expected.changes);
  assert.equal(body.explanations.source, "template");
  assert.equal(body.explanations.lines.length, expected.changes.length);
  assert.ok(expected.changes.length > 0);
  assert.equal(body.explanations.closing, "A perfumer reviews every formula before mixing.");
  assert.doesNotMatch(JSON.stringify(body.explanations), /\bph\b/i);
  assert.deepEqual(body.materials, BASES.forest.materials);
  assert.equal(body.carrier, "CW Perfume Base");
  assert.equal(body.nose.type, "fresh");
  assert.ok(body.resultId && body.shareId);
  assert.equal(db.prepare("SELECT base FROM element_results WHERE id=?").get(body.resultId)!.base, "forest");
  assert.equal(db.prepare("SELECT nose_type FROM element_profiles WHERE share_id=?").get(body.shareId)!.nose_type, "fresh");
  await Promise.all(background);
  assert.ok(calls.every((c) => JSON.stringify(c.options) === JSON.stringify({ gateway: { id: "default" } })));
  for (const locale of ["zh-Hant", "zh-Hans"]) {
    const zh = await (await handle("result", post("result", { ...input, locale }), deps)).json();
    assert.equal(zh.explanations.lines.length, expected.changes.length);
    assert.match(zh.explanations.closing, /調香師|调香师/);
  }
});

test("element api: explainer output is used only when it sticks to the change list", async () => {
  const input = { locale: "en", base: "tea", oil: 0.8, sensitivity: "medium", likes: {}, tags: ["post-gym"] };
  const { changes } = tune("tea", { oil: 0.8, sensitivity: "medium", tags: ["post-gym"], muskQuiet: false, trust: 1 });
  const good = changes.map((c) => `${c.note} moves to ${c.to}% for a fresher start.`);
  const ok = setup(async () => ({ response: { lines: good, summary: "A fresher tea." } }));
  const used = await (await handle("result", post("result", input), ok.deps)).json();
  assert.equal(used.explanations.source, "ai");
  assert.deepEqual(used.explanations.lines, good);
  assert.equal(used.resultId, null, "no session, nothing stored");
  for (const bad of [
    { lines: good.map((l, i) => (i ? l : `${l} Vanilla also rises.`)), summary: "x" },
    { lines: good.map((l, i) => (i ? l : "Your skin pH is 5.5 so this changes.")), summary: "x" },
    { lines: good.slice(1), summary: "x" },
    { lines: good.map((l, i) => (i ? l : `${changes[0].note} rises to 99%.`)), summary: "x" },
  ]) {
    const { deps } = setup(async () => ({ response: JSON.stringify(bad) }));
    assert.equal((await (await handle("result", post("result", input), deps)).json()).explanations.source, "template");
  }
});

test("element api: survey falls back to the bank when the AI writes banned or invalid text", async () => {
  const state: SurveyState = { answered: [{ id: "weekday", text: "What does your typical weekday look like?", chips: ["office"], tags: ["office"], source: "bank" }], aiFollowUps: 0 };
  for (const reply of [
    { response: { followup: { text: "Do you have any health conditions?", chips: [{ id: "yes", label: "Yes", tags: [] }, { id: "no", label: "No", tags: [] }] } } },
    { response: "not json" },
    { response: { questionId: "does-not-exist" } },
  ]) {
    const { deps, calls } = setup(async () => reply);
    const res = await handle("survey", post("survey", { locale: "en", state }), deps);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(calls.length, 1);
    assert.equal(body.by, "bank");
    assert.equal(body.question.id, nextFromBank(state)!.id);
  }
  const { deps } = setup(async () => ({ response: { followup: { text: "Where do you walk after work?", chips: [{ id: "harbour", label: "By the harbour", tags: ["harbour-walk"] }, { id: "park", label: "In a park", tags: ["trail-memory"] }] } } }));
  const ai = await (await handle("survey", post("survey", { locale: "en", state }), deps)).json();
  assert.equal(ai.by, "ai");
  assert.equal(ai.question.text.en, "Where do you walk after work?");
  assert.equal((await handle("survey", post("survey", { locale: "en", state: { answered: "x" } }), deps)).status, 400);

  // The follow-up must be in the user's script: English text for zh users, or Chinese for en users, falls back.
  const zhFollowup = { response: { followup: { text: "你下班後喜歡去哪裡散步？", chips: [{ id: "harbour", label: "海旁", tags: ["harbour-walk"] }, { id: "park", label: "公園", tags: ["trail-memory"] }] } } };
  for (const [locale, reply, by] of [["zh-Hant", zhFollowup, "ai"], ["zh-Hans", zhFollowup, "ai"], ["en", zhFollowup, "bank"]] as const) {
    const res = await (await handle("survey", post("survey", { locale, state }), setup(async () => reply).deps)).json();
    assert.equal(res.by, by, `${locale} follow-up in Chinese`);
  }
  for (const locale of ["zh-Hant", "zh-Hans"]) {
    const res = await (await handle("survey", post("survey", { locale, state }), deps)).json();
    assert.equal(res.by, "bank", `${locale} follow-up in English`);
    assert.equal(res.question.id, nextFromBank(state)!.id);
  }
});

test("element api: typed survey replies reach the next-question context with bounded input", async () => {
  let prompt: Record<string, unknown> = {};
  const { deps } = setup(async (_model, input) => { prompt = input; return { response: { questionId: "unknown" } }; });
  const answer = { id: "routine", text: "What does your day look like?", answerText: "I cycle to the office, then walk by the sea.", chips: [], tags: [], source: "bank" as const };
  const state = { answered: [answer], aiFollowUps: 0 };
  assert.equal((await handle("survey", post("survey", { locale: "en", state }), deps)).status, 200);
  const context = JSON.parse((prompt.messages as { content: string }[])[1].content);
  assert.equal(context.lastAnswer.answerText, answer.answerText);
  assert.equal(context.asked[0].question, answer.text, "question history stays distinct from the person's reply");
  assert.deepEqual(context.lastAnswer.picked, []);
  for (const answerText of [42, "a".repeat(501)]) {
    assert.equal((await handle("survey", post("survey", { locale: "en", state: { ...state, answered: [{ ...answer, answerText }] } }), deps)).status, 400);
  }
});

test("element api: photo route rejects non-JPEG and oversize files, stores good ones, survives a failed vision check", async () => {
  const { db, deps, objects } = setup();
  const sessionId = await session(deps);
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
  const photo = (bytes: Uint8Array<ArrayBuffer>, fields: Record<string, string> = {}) => {
    const form = new FormData();
    for (const [k, v] of Object.entries({ sessionId, zone: "blot", n: "1", readings: JSON.stringify({ oil: 0.4 }), ...fields })) form.set(k, v);
    form.set("photo", new Blob([bytes], { type: "image/jpeg" }), "p.jpg");
    return new Request(`${ORIGIN}/api/element/photo`, { method: "POST", headers: { Origin: ORIGIN }, body: form });
  };
  assert.equal((await handle("photo", photo(new Uint8Array([0x89, 0x50, 0x4e, 0x47])), deps)).status, 415);
  const big = new Uint8Array(1.5 * 1024 * 1024 + 1); big.set([0xff, 0xd8, 0xff]);
  assert.equal((await handle("photo", photo(big), deps)).status, 413, "zone images are at most 1024 px, so over 1.5 MB is rejected");
  for (const readings of ['{"oil": "0.4"}', '[0.4]', '{"oil": {"x": 1}}', '{"oil": 1e999}', JSON.stringify(Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`k${i}`, i]))), "{", `{"oil": ${"1".repeat(5000)}}`]) {
    assert.equal((await handle("photo", photo(jpeg, { readings }), deps)).status, 400, readings.slice(0, 40));
  }
  assert.equal((await handle("photo", photo(jpeg, { sessionId: crypto.randomUUID() }), deps)).status, 404);
  assert.equal((await handle("photo", photo(jpeg, { zone: "face" }), deps)).status, 400);
  const res = await handle("photo", photo(jpeg), deps);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { flags: [], checked: false });
  assert.deepEqual(objects.get(`element/${sessionId}/blot-1.jpg`), jpeg);
  assert.equal(JSON.parse(String(db.prepare("SELECT readings FROM element_readings").get()!.readings)).oil, 0.4);

  const glare = setup(async () => ({ response: '{"sheetPresent": true, "insideGuide": false, "padsWet": true, "glare": true}' }));
  const id = await session(glare.deps);
  const flagged = await handle("photo", (() => { const r = photo(jpeg, { sessionId: id }); return r; })(), glare.deps);
  assert.deepEqual(await flagged.json(), { flags: ["outside-guide", "glare"], checked: true });
});

test("element api: voice returns no tags when the AI fails, compare works on inline profiles", async () => {
  const { deps } = setup();
  const form = new FormData();
  form.set("locale", "en");
  form.set("audio", new Blob([new Uint8Array([1, 2, 3])], { type: "audio/webm" }), "a.webm");
  const voice = await handle("voice", new Request(`${ORIGIN}/api/element/voice`, { method: "POST", headers: { Origin: ORIGIN }, body: form }), deps);
  assert.deepEqual(await voice.json(), { tags: [] });

  const a = { likes: { citrus: 5, green: 4, water: 3, floral: 2, woody: 5, amber: 1 }, tags: ["office"] };
  const b = { likes: { citrus: 4, green: 4, water: 3, floral: 1, woody: 5, amber: 5 }, tags: ["office"] };
  const res = await (await handle("compare", post("compare", { a, b, locale: "en" }), deps)).json();
  assert.equal(res.shared, "woody");
  assert.equal(res.differ, "amber");
  assert.ok(res.percent > 0 && res.percent <= 100);
  assert.match(res.sentence, /woody/i);
  assert.equal((await handle("compare", post("compare", { a: "missing", b, locale: "en" }), deps)).status, 404);
});
