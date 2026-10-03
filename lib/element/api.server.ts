import { Buffer } from "node:buffer";
import type { Locale } from "../../app/site-header.tsx";
import { authLogout, authRequest, authVerify, profile, profileVector, publicProfile, viewerEmail } from "./auth.server.ts";
import { BASES, CARRIER } from "./bases.ts";
import { compare, type ProfileVector } from "./compare.ts";
import { FAMILY_NAMES, REASONS, matchingReasons, templateExplanations, validateExplanations, type Explanations } from "./explain.ts";
import { BANK } from "./survey-bank.ts";
import { nextFromBank, validateAiChoice, type SurveyState } from "./survey.ts";
import { tune, type Change } from "./tune.ts";
import type { BaseId, Family, Localised } from "./types.ts";

type Stmt = { run(): Promise<{ success: boolean }>; first<T = Record<string, unknown>>(): Promise<T | null> };
export type ElementEnv = {
  DB: { prepare(sql: string): { bind(...values: (string | number | null)[]): Stmt } };
  AI: { run(model: string, input: Record<string, unknown>, options: { gateway: { id: string } }): Promise<unknown> };
  BUCKET: {
    put(key: string, value: Uint8Array | ArrayBuffer, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
    get(key: string): Promise<{ body: ReadableStream } | null>;
  };
  TAGS: {
    query(vector: number[], options: { topK: number; returnMetadata?: "all" | "indexed" | "none" }): Promise<{ matches: { id: string; score: number }[] }>;
    upsert(vectors: { id: string; values: number[] }[]): Promise<unknown>;
  };
  ELEMENT_RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
  ELEMENT_ADMIN_KEY?: string;
  EMAIL: { send(message: { to: string; from: { email: string; name: string }; subject: string; text: string; html: string }): Promise<unknown> };
  ELEMENT_CODE_PEPPER?: string;
};
export type Mail = { to: string; subject: string; text: string; html: string };
type Nose = { type: string; name: Localised; filled: Record<Family, number>; muskQuiet: boolean };
export type Deps = {
  ai: ElementEnv["AI"]; db: ElementEnv["DB"]; bucket: ElementEnv["BUCKET"]; vectorize: ElementEnv["TAGS"];
  limiter: ElementEnv["ELEMENT_RATE_LIMITER"]; adminKey?: string;
  now: () => number;
  inferNose: (likes: Partial<Record<Family, number>>, sensitivity: "high" | "medium" | "low" | "unknown") => Nose;
  waitUntil: (promise: Promise<unknown>) => void;
  sendEmail?: (mail: Mail) => Promise<unknown>; pepper?: string;
};

const MODELS = {
  text: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", vision: "@cf/meta/llama-4-scout-17b-16e-instruct",
  voice: "@cf/openai/whisper-large-v3-turbo", embed: "@cf/baai/bge-m3", art: "@cf/black-forest-labs/flux-1-schnell",
};
const BUDGET = { vision: 4000, survey: 3000, voice: 6000, explain: 6000, art: 10000, seed: 30000 };
// The phone sends the straightened zone at most 1024 px on the long side, so 1.5 MB is generous and keeps the vision call fast.
const JSON_LIMIT = 16 * 1024, PHOTO_LIMIT = 1.5 * 1024 * 1024, AUDIO_LIMIT = 2 * 1024 * 1024;
const LOCALES: Locale[] = ["en", "zh-Hant", "zh-Hans"];
const LANGUAGE: Record<Locale, string> = { en: "English", "zh-Hant": "Traditional Chinese (Hong Kong)", "zh-Hans": "Simplified Chinese" };
const FAMILIES: Family[] = ["citrus", "green", "water", "floral", "woody", "amber"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const SLUG = /^[a-z0-9-]{1,32}$/;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const fail = (status: number) => json({ ok: false }, status);
class HttpError extends Error { status: number; constructor(status: number) { super(String(status)); this.status = status; } }

function within<T>(ms: number, promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([promise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), ms); })]).finally(() => clearTimeout(timer));
}
// Every model call goes through AI Gateway and has a hard budget; callers catch and fall back.
const ai = (deps: Deps, model: string, input: Record<string, unknown>, ms: number) =>
  within(ms, Promise.resolve().then(() => deps.ai.run(model, input, { gateway: { id: "yat-element" } })));
const responseOf = (out: unknown) => (out as { response?: unknown } | null)?.response;
const jsonFrom = (raw: unknown) => {
  if (typeof raw !== "string") return raw;
  try { return JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? ""); } catch { return null; }
};

async function readBody(request: Request, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(request.headers.get("content-length")) > limit) throw new HttpError(413);
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); throw new HttpError(413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

async function readJson(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new HttpError(415);
  const bytes = await readBody(request, JSON_LIMIT);
  let body: unknown;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new HttpError(400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400);
  return body as Record<string, unknown>;
}

async function readForm(request: Request, fileField: string, limit: number) {
  const type = request.headers.get("content-type") ?? "";
  if (type.split(";")[0].trim() !== "multipart/form-data") throw new HttpError(415);
  const bytes = await readBody(request, limit + JSON_LIMIT);
  let form: FormData;
  try { form = await new Response(bytes, { headers: { "content-type": type } }).formData(); } catch { throw new HttpError(400); }
  const file = form.get(fileField);
  if (!file || typeof file === "string") throw new HttpError(400);
  if (file.size > limit) throw new HttpError(413);
  const text = (k: string) => { const v = form.get(k); return typeof v === "string" ? v : ""; };
  return { text, file: new Uint8Array(await file.arrayBuffer()) };
}

const localeOf = (v: unknown) => { if (!LOCALES.includes(v as Locale)) throw new HttpError(400); return v as Locale; };
const stamp = (deps: Deps) => new Date(deps.now()).toISOString();
const sessionExists = async (deps: Deps, id: string) =>
  UUID.test(id) && !!(await deps.db.prepare("SELECT 1 AS ok FROM element_sessions WHERE id = ?").bind(id).first());

async function session(body: Record<string, unknown>, deps: Deps) {
  const locale = localeOf(body.locale);
  const mode = body.mode;
  const kitCode = typeof body.kitCode === "string" ? body.kitCode.trim().toUpperCase() : null;
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  if ((mode !== "demo" && mode !== "kit") || (mode === "kit" && !/^[A-Z0-9-]{3,20}$/.test(kitCode ?? ""))
    || firstName.length > 40 || /[\p{Cc}<>]/u.test(firstName) || body.adult !== true || body.consent !== true) throw new HttpError(400);
  const id = crypto.randomUUID(), now = stamp(deps);
  await deps.db.prepare("INSERT INTO element_sessions (id, mode, kit_code, first_name, locale, consented_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, mode, mode === "kit" ? kitCode : null, firstName || null, locale, now, now).run();
  return json({ sessionId: id });
}

const VISION_PROMPT = {
  blot: "This is a straightened photo of the oil-blot zone of a perfume kit lid. A translucent blotting sheet should lie inside the printed guide rectangle.",
  ph: "This is a straightened photo of the pH zone of a perfume kit lid. Two pH test strips should lie in the printed slots, with wet coloured pads.",
};
async function visionCheck(deps: Deps, zone: "blot" | "ph", photo: Uint8Array) {
  try {
    const out = await ai(deps, MODELS.vision, {
      messages: [{ role: "user", content: [
        { type: "text", text: `${VISION_PROMPT[zone]} Answer only with JSON: {"sheetPresent": boolean, "insideGuide": boolean, "padsWet": boolean, "glare": boolean}. Do not estimate any measurement.` },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${Buffer.from(photo).toString("base64")}` } },
      ] }],
      max_tokens: 80,
    }, BUDGET.vision);
    const a = jsonFrom(responseOf(out)) as Record<string, unknown> | null;
    if (!a || typeof a !== "object") return { flags: [], checked: false };
    const flags = [a.sheetPresent === false && "no-sheet", a.insideGuide === false && "outside-guide", zone === "ph" && a.padsWet === false && "dry-pads", a.glare === true && "glare"];
    return { flags: flags.filter((f): f is string => !!f), checked: true };
  } catch { return { flags: [] as string[], checked: false }; }
}

async function photo(request: Request, deps: Deps) {
  const { text, file } = await readForm(request, "photo", PHOTO_LIMIT);
  if (file.length < 3 || file[0] !== 0xff || file[1] !== 0xd8 || file[2] !== 0xff) throw new HttpError(415);
  const sessionId = text("sessionId"), zone = text("zone"), n = Number(text("n"));
  const raw = text("readings") || "{}";
  if (raw.length > 4096) throw new HttpError(400);
  let readings: unknown;
  try { readings = JSON.parse(raw); } catch { throw new HttpError(400); }
  // Readings are a flat map of measured numbers (oil, ph, confidence...): nothing nested, no free text.
  const flat = !!readings && typeof readings === "object" && !Array.isArray(readings) && Object.keys(readings).length <= 20
    && Object.values(readings).every((v) => typeof v === "number" && Number.isFinite(v));
  if ((zone !== "blot" && zone !== "ph") || !Number.isInteger(n) || n < 1 || n > 9 || !flat) throw new HttpError(400);
  if (!(await sessionExists(deps, sessionId))) throw new HttpError(404);
  const key = `element/${sessionId}/${zone}-${n}.jpg`;
  const [, check] = await Promise.all([deps.bucket.put(key, file, { httpMetadata: { contentType: "image/jpeg" } }), visionCheck(deps, zone, file)]);
  await deps.db.prepare(`INSERT INTO element_readings (session_id, zone, n, photo_key, readings, flags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id, zone, n) DO UPDATE SET readings = excluded.readings, flags = excluded.flags, created_at = excluded.created_at`)
    .bind(sessionId, zone, n, key, JSON.stringify(readings), JSON.stringify(check.flags), stamp(deps)).run();
  return json(check);
}

const strings = (v: unknown, max: number, len: number) => Array.isArray(v) && v.length <= max && v.every((s) => typeof s === "string" && s.length <= len);
function surveyState(raw: unknown): SurveyState {
  const s = raw as SurveyState | null;
  if (!s || !Array.isArray(s.answered) || s.answered.length > 15 || !Number.isInteger(s.aiFollowUps) || s.aiFollowUps < 0 || s.aiFollowUps > 3
    || !s.answered.every((a) => a && typeof a.id === "string" && a.id.length <= 40 && typeof a.text === "string" && a.text.length <= 200
      && strings(a.chips, 5, 32) && strings(a.tags, 8, 32) && (a.source === "bank" || a.source === "ai"))) throw new HttpError(400);
  return { answered: s.answered.map(({ id, text, chips, tags, source }) => ({ id, text, chips, tags, source })), aiFollowUps: s.aiFollowUps };
}
const SURVEY_SCHEMA = {
  type: "object",
  properties: {
    questionId: { type: "string" },
    followup: { type: "object", required: ["text", "chips"], properties: {
      text: { type: "string" },
      chips: { type: "array", items: { type: "object", required: ["id", "label", "tags"], properties: { id: { type: "string" }, label: { type: "string" }, tags: { type: "array", items: { type: "string" } } } } },
    } },
  },
};

async function survey(body: Record<string, unknown>, deps: Deps) {
  const locale = localeOf(body.locale), state = surveyState(body.state);
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const last = state.answered.at(-1);
  if (last && UUID.test(sessionId)) {
    // Best effort: the question is stored exactly as it was shown. A storage error never blocks the next question.
    deps.waitUntil(deps.db.prepare(`INSERT INTO element_answers (session_id, question_id, question_text, source, chips, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id, question_id) DO UPDATE SET chips = excluded.chips, tags = excluded.tags`)
      .bind(sessionId, last.id, last.text, last.source, JSON.stringify(last.chips), JSON.stringify(last.tags), stamp(deps)).run().catch(() => undefined));
  }
  const fallback = nextFromBank(state);
  if (!fallback) return json({ question: null, by: "bank" });
  if (!state.answered.length) return json({ question: { ...fallback, source: "bank" }, by: "bank" });
  const candidates = BANK.filter((q) => validateAiChoice({ questionId: q.id }, state, locale)).map((q) => ({ id: q.id, topic: q.topic, text: q.text[locale] }));
  try {
    const out = await ai(deps, MODELS.text, {
      messages: [
        { role: "system", content: `You pick the next question in a short, friendly perfume survey. Reply with JSON only: either {"questionId": "<a candidate id>"} or, when one short personal follow-up would tell a perfumer more, {"followup": {"text": "...", "chips": [{"id": "slug", "label": "...", "tags": ["slug"]}]}}. A follow-up is one question of at most 120 characters in ${LANGUAGE[locale]}, with 2 to 5 short answer chips, about daily routine, places, climate, activities, social settings or scent memories. Never ask about health, religion, sexuality, income or body weight. Never use em dashes.` },
        { role: "user", content: JSON.stringify({ followUpsLeft: 3 - state.aiFollowUps, answered: state.answered.map((a) => ({ question: a.text, tags: a.tags })), candidates }) },
      ],
      response_format: { type: "json_schema", json_schema: SURVEY_SCHEMA },
      max_tokens: 300,
    }, BUDGET.survey);
    const choice = validateAiChoice(responseOf(out), state, locale);
    if (choice?.kind === "bank") return json({ question: { ...choice.question, source: "bank" }, by: "ai" });
    // A follow-up must be in the user's script: some CJK for zh-Hant/zh-Hans, none for English.
    const script = (s: string) => /[㐀-鿿豈-﫿]/.test(s) === (locale !== "en");
    if (choice?.kind === "followup" && script(choice.text) && choice.chips.every((c) => script(c.label))) {
      const same = (s: string): Localised => ({ en: s, "zh-Hant": s, "zh-Hans": s });
      const topic = BANK.find((q) => q.id === last?.id)?.topic ?? "memory";
      return json({ question: { id: `ai-${state.aiFollowUps + 1}`, topic, text: same(choice.text), chips: choice.chips.map((c) => ({ ...c, label: same(c.label) })), source: "ai" }, by: "ai" });
    }
  } catch { /* slow or failed model: use the bank */ }
  return json({ question: { ...fallback, source: "bank" }, by: "bank" });
}

// Tag descriptions for voice matching, built from the bank so a new chip is searchable without a separate list.
function tagDescriptions() {
  const out = new Map<string, string[]>();
  for (const q of BANK) for (const c of q.chips) for (const tag of c.tags) out.set(tag, [...(out.get(tag) ?? []), `${q.text.en} ${c.label.en} / ${c.label["zh-Hant"]}`]);
  return [...out].map(([tag, texts]) => ({ tag, text: texts.join(" | ") }));
}
const embed = async (deps: Deps, text: string[], ms = BUDGET.voice) =>
  ((await ai(deps, MODELS.embed, { text }, ms)) as { data: number[][] }).data;

// Run once before the demo (and after the bank changes):
// curl -X POST https://<host>/api/element/seed-tags -H "x-element-admin: $ELEMENT_ADMIN_KEY"
async function seedTags(request: Request, deps: Deps) {
  if (!deps.adminKey || request.headers.get("x-element-admin") !== deps.adminKey) return fail(403);
  const tags = tagDescriptions();
  const vectors = await embed(deps, tags.map((t) => t.text), BUDGET.seed);
  await deps.vectorize.upsert(tags.map((t, i) => ({ id: t.tag, values: vectors[i] })));
  return json({ seeded: tags.length });
}

async function voice(request: Request, deps: Deps) {
  const { text, file } = await readForm(request, "audio", AUDIO_LIMIT);
  const locale = localeOf(text("locale"));
  try {
    return json(await within(BUDGET.voice, (async () => {
      const heard = ((await ai(deps, MODELS.voice, { audio: Buffer.from(file).toString("base64"), language: locale === "en" ? "en" : "zh" }, BUDGET.voice)) as { text?: string }).text?.trim() ?? "";
      if (!heard) return { tags: [] };
      const [vector] = await embed(deps, [heard]);
      const { matches } = await deps.vectorize.query(vector, { topK: 3 });
      return { text: heard.slice(0, 500), tags: matches.map((m) => m.id) };
    })()));
  } catch { return json({ tags: [] }); }
}

const SENSITIVITY = ["high", "medium", "low", "unknown"] as const;
function resultInput(body: Record<string, unknown>) {
  const locale = localeOf(body.locale);
  const base = body.base as BaseId;
  const likes = (body.likes ?? {}) as Record<string, unknown>;
  const sensitivity = (body.sensitivity ?? "unknown") as (typeof SENSITIVITY)[number];
  const oil = body.oil, trust = body.trust ?? 1;
  if (typeof base !== "string" || !Object.hasOwn(BASES, base) || !SENSITIVITY.includes(sensitivity) || typeof likes !== "object" || Array.isArray(likes)
    || !Object.entries(likes).every(([k, v]) => FAMILIES.includes(k as Family) && typeof v === "number" && v >= 1 && v <= 5)
    || (oil !== undefined && (typeof oil !== "number" || oil < 0 || oil > 1)) || typeof trust !== "number" || trust < 0 || trust > 1
    || !strings(body.tags ?? [], 40, 32) || !((body.tags ?? []) as string[]).every((t) => SLUG.test(t))) throw new HttpError(400);
  return { locale, base, likes: likes as Partial<Record<Family, number>>, sensitivity, oil: oil as number | undefined, trust, tags: (body.tags ?? []) as string[], sessionId: typeof body.sessionId === "string" ? body.sessionId : "" };
}

async function explain(deps: Deps, base: BaseId, changes: Change[], concentration: "EDT" | "EDP", projection: "close" | "moderate" | "carrying", locale: Locale): Promise<Explanations> {
  const template = templateExplanations(base, changes, concentration, projection, locale);
  if (!changes.length) return template;
  try {
    const out = await ai(deps, MODELS.text, {
      messages: [
        { role: "system", content: `You explain a perfumer's computed formula changes to a customer in ${LANGUAGE[locale]}. Write exactly one plain, warm sentence per change, in the given order, plus a one-sentence summary. Only describe the given change and its reasons. Never mention any other note, any number except that change's from and to percentages, skin pH, health or medical effects. Never use em dashes. Reply with JSON only: {"lines": ["..."], "summary": "..."}.` },
        { role: "user", content: JSON.stringify({ perfume: BASES[base].name.en, concentration, changes: changes.map((c) => ({ note: c.note, from: c.from, to: c.to, reasons: matchingReasons(c).map((r) => (REASONS[r] ?? REASONS.rebalance).en) })) }) },
      ],
      response_format: { type: "json_schema", json_schema: { type: "object", required: ["lines", "summary"], properties: { lines: { type: "array", items: { type: "string" } }, summary: { type: "string" } } } },
      max_tokens: 600,
    }, BUDGET.explain);
    return validateExplanations(responseOf(out), changes, locale) ?? template;
  } catch { return template; }
}

async function labelArt(deps: Deps, sessionId: string, resultId: string, base: BaseId, likes: Record<Family, number>) {
  try {
    const top = [...FAMILIES].sort((a, b) => likes[b] - likes[a]).slice(0, 2).join(" and ");
    const notes = BASES[base].formula.notes.map((n) => n.note).join(", ");
    const out = (await ai(deps, MODELS.art, {
      prompt: `Abstract label artwork for a niche perfume: ${top} mood, notes of ${notes}. Soft layered gradients of antique gold, warm cream and deep ink, fine paper grain, calm and elegant, minimal. No text, no letters, no logo, no people.`,
      steps: 4,
    }, BUDGET.art)) as { image?: string };
    if (!out?.image) return;
    const key = `element/${sessionId}/label-${resultId}.jpg`;
    await deps.bucket.put(key, Buffer.from(out.image, "base64"), { httpMetadata: { contentType: "image/jpeg" } });
    await deps.db.prepare("UPDATE element_results SET label_key = ? WHERE id = ?").bind(key, resultId).run();
  } catch { /* the share card shows the brand pattern instead */ }
}

async function result(body: Record<string, unknown>, deps: Deps) {
  const input = resultInput(body);
  const nose = deps.inferNose(input.likes, input.sensitivity);
  const { formula, changes, concentration, projection } = tune(input.base, { oil: input.oil, sensitivity: input.sensitivity, tags: input.tags, muskQuiet: nose.muskQuiet, trust: input.trust });
  const explanations = await explain(deps, input.base, changes, concentration, projection, input.locale);
  let resultId: string | null = crypto.randomUUID(), shareId: string | null = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  try {
    if (!(await sessionExists(deps, input.sessionId))) throw new Error("no session");
    const now = stamp(deps);
    await deps.db.prepare(`INSERT INTO element_results (id, session_id, base, formula, changes, explanations, concentration, projection, nose, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(resultId, input.sessionId, input.base, JSON.stringify(formula), JSON.stringify(changes), JSON.stringify(explanations), concentration, projection, JSON.stringify(nose), now).run();
    const name = await deps.db.prepare("SELECT first_name FROM element_sessions WHERE id = ?").bind(input.sessionId).first<{ first_name: string | null }>();
    await deps.db.prepare(`INSERT INTO element_profiles (id, share_id, result_id, first_name, likes, nose_type, nose_name, tags, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(crypto.randomUUID(), shareId, resultId, name?.first_name ?? null, JSON.stringify(nose.filled), nose.type, JSON.stringify(nose.name), JSON.stringify(input.tags), now).run();
    deps.waitUntil(labelArt(deps, input.sessionId, resultId, input.base, nose.filled));
  } catch { resultId = null; shareId = null; }
  return json({ resultId, shareId, base: input.base, formula, changes, explanations, concentration, projection, nose, materials: BASES[input.base].materials, carrier: CARRIER, sample: true });
}

async function profileOf(deps: Deps, v: unknown, viewer: string | null): Promise<ProfileVector> {
  if (typeof v === "string") {
    const p = await profileVector(deps, v, viewer);
    if (!p) throw new HttpError(404);
    return p;
  }
  const p = v as ProfileVector | null;
  if (!p || typeof p.likes !== "object" || !FAMILIES.every((f) => typeof p.likes[f] === "number" && p.likes[f] >= 1 && p.likes[f] <= 5) || !strings(p.tags, 40, 32)) throw new HttpError(400);
  return { likes: Object.fromEntries(FAMILIES.map((f) => [f, p.likes[f]])) as Record<Family, number>, tags: p.tags };
}

async function compareProfiles(body: Record<string, unknown>, deps: Deps, request: Request) {
  const locale = localeOf(body.locale);
  const viewer = typeof body.a === "string" || typeof body.b === "string" ? await viewerEmail(request, deps) : null;
  const r = compare(await profileOf(deps, body.a, viewer), await profileOf(deps, body.b, viewer));
  const s = FAMILY_NAMES[r.shared][locale], d = FAMILY_NAMES[r.differ][locale];
  const template = locale === "en" ? (r.shared === r.differ ? `You both lean ${s}, though not equally.` : `You both love ${s}; you differ most on ${d}.`)
    : locale === "zh-Hant" ? (r.shared === r.differ ? `你們都偏愛${s}，但程度不同。` : `你們都喜歡${s}；最大分歧在${d}。`)
      : (r.shared === r.differ ? `你们都偏爱${s}，但程度不同。` : `你们都喜欢${s}；最大分歧在${d}。`);
  try {
    const out = await ai(deps, MODELS.text, {
      messages: [
        { role: "system", content: `Write exactly one warm, plain sentence in ${LANGUAGE[locale]} telling two friends how their scent profiles compare. Mention the family they share and the family where they differ most, and nothing else: no other scent families, no numbers, no health or skin claims. Never use em dashes. Reply with JSON only: {"sentence": "..."}.` },
        { role: "user", content: JSON.stringify({ match: r.percent >= 70 ? "close" : r.percent >= 45 ? "partial" : "different", shared: s, differMost: d }) },
      ],
      response_format: { type: "json_schema", json_schema: { type: "object", required: ["sentence"], properties: { sentence: { type: "string" } } } },
      max_tokens: 120,
    }, BUDGET.survey);
    const sentence = (jsonFrom(responseOf(out)) as { sentence?: unknown } | null)?.sentence;
    const others = FAMILIES.filter((f) => f !== r.shared && f !== r.differ).map((f) => FAMILY_NAMES[f][locale]);
    // Grounded or nothing: names the shared family, no other family, no digits, right script, one short sentence.
    if (typeof sentence === "string" && sentence.length <= 200 && sentence.includes(s) && !others.some((o) => sentence.toLowerCase().includes(o.toLowerCase()))
      && !/[0-9—]/.test(sentence) && /[㐀-鿿]/.test(sentence) === (locale !== "en")) return json({ ...r, sentence, by: "ai" });
  } catch { /* slow or failed model: template */ }
  return json({ ...r, sentence: template, by: "template" });
}

async function label(request: Request, deps: Deps) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const row = UUID.test(id) ? await deps.db.prepare("SELECT label_key FROM element_results WHERE id = ?").bind(id).first<{ label_key: string | null }>() : null;
  const object = row?.label_key ? await deps.bucket.get(row.label_key) : null;
  if (!object) return fail(404);
  return new Response(object.body, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" } });
}

const JSON_ROUTES: Record<string, (body: Record<string, unknown>, deps: Deps, request: Request) => Promise<Response>> = {
  session, survey, result, compare: compareProfiles, profile, "auth-request": authRequest, "auth-verify": authVerify, "auth-logout": authLogout,
};
const FORM_ROUTES: Record<string, (request: Request, deps: Deps) => Promise<Response>> = { photo, voice };

export async function handle(action: string, request: Request, deps: Deps): Promise<Response> {
  try {
    if (action === "label") return request.method === "GET" ? await label(request, deps) : fail(405);
    if (action === "profile" && request.method === "GET") {
      const shared = await publicProfile(deps, new URL(request.url).searchParams.get("share") ?? "");
      return shared ? json(shared) : fail(404);
    }
    const form = Object.hasOwn(FORM_ROUTES, action);
    if (!form && !Object.hasOwn(JSON_ROUTES, action) && action !== "seed-tags") return fail(404);
    if (request.method !== "POST") return fail(405);
    if (action === "seed-tags") return await seedTags(request, deps);
    if (request.headers.get("origin") !== new URL(request.url).origin) return fail(403);
    // ponytail: a per-IP key can catch a whole event Wi-Fi; raise the limit if the demo room trips it.
    const ip = request.headers.get("cf-connecting-ip") || "local";
    if (!(await deps.limiter.limit({ key: `yat-element:${ip}` })).success) {
      return Response.json({ ok: false }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
    }
    return form ? await FORM_ROUTES[action](request, deps) : await JSON_ROUTES[action](await readJson(request), deps, request);
  } catch (error) {
    // Never log bodies, photos or readings. The demo falls back to local logic on any non-200.
    return fail(error instanceof HttpError ? error.status : 503);
  }
}
