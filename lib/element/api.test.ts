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
  for (const file of ["0001_newsletter.sql", "0002_element.sql", "0003_newsletter_sources.sql"]) {
    db.exec(readFileSync(new URL(`../../migrations/${file}`, import.meta.url), "utf8"));
  }
  const objects = new Map<string, Uint8Array<ArrayBuffer>>();
  const background: Promise<unknown>[] = [];
  const calls: { model: string; options: unknown }[] = [];
  const deps: Deps = {
    ai: { run: async (model, input, options) => { calls.push({ model, options }); return ai(model, input, options); } },
    db: { prepare: (sql) => ({ bind: (...v) => ({
      run: async () => { db.prepare(sql).run(...v); return { success: true }; },
      first: async () => (db.prepare(sql).get(...v) ?? null) as never,
    }) }) },
    bucket: { put: async (key, value) => { objects.set(key, new Uint8Array(value as ArrayBuffer)); return {}; }, get: async (key) => (objects.has(key) ? { body: new Blob([objects.get(key)!]).stream() } : null) },
    vectorize: { query: async () => ({ matches: [] }), upsert: async () => ({}) },
    now: () => Date.parse("2026-10-04T02:00:00Z"),
    inferNose: (likes) => ({ type: "fresh", name: { en: "Fresh-leaning", "zh-Hant": "清新型", "zh-Hans": "清新型" },
      filled: { citrus: 3, green: 3, water: 3, floral: 3, woody: 3, amber: 3, ...likes }, muskQuiet: false }),
    waitUntil: (p) => { background.push(p); },
  };
  return { db, deps, objects, background, calls };
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
  assert.ok(calls.every((c) => JSON.stringify(c.options) === JSON.stringify({ gateway: { id: "yat-element" } })));
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
  const big = new Uint8Array(2 * 1024 * 1024 + 1); big.set([0xff, 0xd8, 0xff]);
  assert.equal((await handle("photo", photo(big), deps)).status, 413);
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
