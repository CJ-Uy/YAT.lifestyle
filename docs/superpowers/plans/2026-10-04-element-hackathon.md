# Element Hackathon Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/element/demo` (guided kit walkthrough with on-phone photo reading, adaptive AI survey, trained nose model, note-graph tuning, result, share and compare), the cinematic `/element` landing with Lab notes, Element-first home page, email accounts and branded error pages on yatlifestyle.com before 10:00 HKT, 4 October 2026.

**Architecture:** One vinext (Next App Router on Vite) app deployed as the existing Cloudflare Worker `yat-lifestyle-prod`. Pure TypeScript domain logic lives in `lib/element/` and is unit-tested with `node --test`. Server routes in `app/api/element/*` use D1, R2, the Workers AI binding through AI Gateway, Vectorize and Email Service. Photo reading runs in the browser with OpenCV.js, ported from a Python prototype tested on real lid photos.

**Tech Stack:** vinext 1.0 beta, React 19, TypeScript, Cloudflare Workers (D1, R2, Workers AI, AI Gateway, Vectorize, Email Service), OpenCV.js 4.x, zxing (Python prototype only), qr-code-styling 1.9, Python 3 with opencv-contrib-python-headless, numpy, scikit-learn for offline training.

**Spec:** `docs/superpowers/specs/2026-10-03-element-site-and-demo-design.md` and `docs/superpowers/specs/2026-10-04-element-ai-design.md`

## Global Constraints

- Every user-facing string exists in `en`, `zh-Hant` and `zh-Hans`, using the existing `Locale` type and `useLocale()` from `app/site-header.tsx`.
- Brand: ink `#080806`, carbon `#0d0d0b`, warm white `#f1eadc`, muted `#aaa499`, liquid gold `#d8a443`; Bodoni Moda for headings; square edges; gold used rarely (DESIGN.md).
- Copy rules: no em dashes; never "first" or "only"; "Smell mostly skips the brain's usual relay"; pH is recorded but never changes the formula; "A perfumer reviews every formula before mixing."; "Not a medical or diagnostic device."
- Demo URL `https://yatlifestyle.com/element/demo`; QR style: qr-code-styling, rounded dots, dark gold `#8a6418`, Element E in a white circle at the centre, error correction `H`.
- Order and Gift buttons open `/shop#newsletter` (the waitlist); the newsletter `source` column gains `element-order` and `element-gift`.
- Bases are shown as letters A-F, shuffled per kit; names revealed only after the pick. Sample recipes are labelled "Sample formula".
- `/element/demo` never requires an account: "Continue with demo account".
- Every AI call has a timeout and a deterministic fallback; the demo must never dead-end.
- Tests: `npm test` runs `node --test`; add new test files to the `test` script.
- Commit after every task with the attribution line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Photo with a missing or covered corner marker: the reader must return `{ ok: false, reason: "markers", missing: [ids] }` and the UI must show a retake message, not crash. Test in Task 3.
- Demo user who skips or answers nothing in the survey or smell steps: tuning must still return a valid result from the base alone. Test in Task 2.
- Workers AI timeout or invalid JSON from the survey model: engine must fall back to the next bank question. Test in Task 4.
- Shuffled kit key: the same kit code must always map letters to the same bases, and the mapping must never leak to the client before the pick. Test in Task 1.
- Language switch mid-flow: every step must render in the new language without losing answers. Covered in Task 6 manual check list.

---

## File Structure

```
migrations/0002_element.sql            Element tables (sessions, readings, answers, results, profiles, auth codes)
lib/element/types.ts                   Shared types (Family, BaseId, Formula, Traits, Result, Profile)
lib/element/bases.ts                   Six sample base formulas and families
lib/element/kit.ts                     Kit code -> shuffled letter/vial key (seeded)
lib/element/ladder.ts                  Sensitivity ladder scoring
lib/element/graph.ts                   Note nodes, harmony edges, trait effects (seed data)
lib/element/tune.ts                    Note-graph tuning
lib/element/nose.ts                    Nose-type inference from nose-model.json
lib/element/nose-model.json            Trained centroids and ridge weights (generated)
lib/element/compare.ts                 Profile compatibility
lib/element/survey-bank.ts             Question bank, 3 languages, tags
lib/element/survey.ts                  Next-question engine (AI choice validation + fallback)
lib/element/copy.ts                    UI copy for demo, landing, lab notes, auth, errors
lib/element/element.test.ts            Unit tests for all of the above
lib/element/ai.server.ts               Workers AI calls with gateway + timeouts
lib/element/store.server.ts            D1/R2 access
app/api/element/[action]/route.ts      session, photo, survey, voice, result, compare, auth-request, auth-verify, profile
app/element/page.tsx                   Landing (cinematic) + element-experience.tsx
app/element/{ai,science,research}/page.tsx   Lab notes
app/element/demo/page.tsx + demo-flow.tsx    Guided walkthrough
app/element/demo/photo-reader.ts       OpenCV.js reader (browser)
app/element/demo/styled-qr.tsx         Branded QR component
app/element/{login,me}/page.tsx        Accounts
app/element/p/[id]/page.tsx            Shared profile
app/element/compare/[a]/[b]/page.tsx   Compare result
app/not-found.tsx, app/error.tsx       Branded error pages
scripts/photo_reader.py                Python prototype of the reader
scripts/test_photo_reader.py           Prototype tests on real photos
scripts/kit-assets/test-photos/        Real lid photos (copied from session images 11, 12, 15)
scripts/train-nose-model.py            Offline training on Keller 2016
public/vendor/opencv.js                OpenCV.js build with ArUco
```

## Parallel tracks

| Track | Tasks | Owner |
| --- | --- | --- |
| A Domain logic | 1, 2 | Claude subagent |
| B Photo reader | 3 | Codex rescue |
| C Nose model | 5 | Codex rescue |
| D Survey + AI server | 4, 7 | Claude subagent |
| E Demo UI | 6 | Claude (main) after A's interfaces exist |
| F Landing, lab notes, home, errors | 8, 9 | Codex rescue |
| G Accounts + social | 10 | Claude subagent |
| H Deploy + verify | 11 | Claude (main) |

Tracks A, B, C, F start immediately. D starts after Task 1. E starts after Task 1 and uses stubs for B/C/D until they land. G starts after Task 7. H last.

---

### Task 1: Types, bases, kit key, ladder

**Files:**
- Create: `lib/element/types.ts`, `lib/element/bases.ts`, `lib/element/kit.ts`, `lib/element/ladder.ts`, `lib/element/element.test.ts`
- Modify: `package.json` (`test` script adds `lib/element/element.test.ts`)

**Interfaces:**
- Produces:
  - `type Family = "citrus" | "green" | "water" | "floral" | "woody" | "amber"`
  - `type BaseId = "dawn" | "tea" | "harbour" | "noon" | "forest" | "night"`
  - `type Tier = "top" | "heart" | "base"`
  - `type Formula = { base: BaseId; notes: { note: string; tier: Tier; weight: number }[] }` (weights sum to 100)
  - `BASES: Record<BaseId, { family: Family; name: Record<Locale, string>; formula: Formula; sample: true }>`
  - `kitKey(code: string): { letters: Record<"A"|"B"|"C"|"D"|"E"|"F", BaseId>; vials: Record<1|2|3|4, "blank"|"weak"|"medium"|"strong"> }`
  - `type LadderAnswer = { vial: 1|2|3|4; smelled: boolean; strength: 0|1|2|3 }`
  - `scoreLadder(answers: LadderAnswer[], key: ReturnType<typeof kitKey>["vials"]): { sensitivity: "high"|"medium"|"low"|"unknown"; falseAlarm: boolean; missedStrong: boolean; trust: number }`

- [ ] **Step 1: Write the failing tests**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { BASES } from "./bases.ts";
import { kitKey } from "./kit.ts";
import { scoreLadder } from "./ladder.ts";

test("bases: six families, weights sum to 100", () => {
  assert.equal(Object.keys(BASES).length, 6);
  assert.equal(new Set(Object.values(BASES).map((b) => b.family)).size, 6);
  for (const b of Object.values(BASES)) assert.equal(Math.round(b.formula.notes.reduce((s, n) => s + n.weight, 0)), 100);
});

test("kit key: deterministic per code, a full permutation, differs between codes", () => {
  const a = kitKey("DEMO"), b = kitKey("DEMO"), c = kitKey("KIT-0002");
  assert.deepEqual(a, b);
  assert.equal(new Set(Object.values(a.letters)).size, 6);
  assert.deepEqual(new Set(Object.values(a.vials)), new Set(["blank", "weak", "medium", "strong"]));
  assert.notDeepEqual(a.letters, c.letters);
});

test("ladder: blank smelled is a false alarm, missed strong flags, weakest detected sets sensitivity", () => {
  const vials = { 1: "medium", 2: "blank", 3: "strong", 4: "weak" } as const;
  const ans = (v: 1|2|3|4, smelled: boolean) => ({ vial: v, smelled, strength: smelled ? 2 : 0 } as const);
  assert.deepEqual(scoreLadder([ans(1, true), ans(2, false), ans(3, true), ans(4, true)], vials), { sensitivity: "high", falseAlarm: false, missedStrong: false, trust: 1 });
  assert.equal(scoreLadder([ans(1, true), ans(2, true), ans(3, true), ans(4, false)], vials).falseAlarm, true);
  assert.equal(scoreLadder([ans(1, false), ans(2, false), ans(3, false), ans(4, false)], vials).missedStrong, true);
  assert.equal(scoreLadder([], vials).sensitivity, "unknown");
});
```

- [ ] **Step 2: Run `npm test`; expect failures "Cannot find module ./bases.ts".**

- [ ] **Step 3: Implement**

`lib/element/types.ts`
```ts
import type { Locale } from "../../app/site-header";
export type Family = "citrus" | "green" | "water" | "floral" | "woody" | "amber";
export type BaseId = "dawn" | "tea" | "harbour" | "noon" | "forest" | "night";
export type Tier = "top" | "heart" | "base";
export type NoteWeight = { note: string; tier: Tier; weight: number };
export type Formula = { base: BaseId; notes: NoteWeight[] };
export type Letter = "A" | "B" | "C" | "D" | "E" | "F";
export type Vial = 1 | 2 | 3 | 4;
export type VialContent = "blank" | "weak" | "medium" | "strong";
export type Localised = Record<Locale, string>;
```

`lib/element/bases.ts`
```ts
import type { BaseId, Family, Formula, Localised } from "./types.ts";
const f = (base: BaseId, notes: [string, "top" | "heart" | "base", number][]): Formula => ({ base, notes: notes.map(([note, tier, weight]) => ({ note, tier, weight })) });
// Sample formulas until the founder supplies real ones. Weights are percent of the accord.
export const BASES: Record<BaseId, { family: Family; name: Localised; formula: Formula; sample: true }> = {
  dawn: { family: "citrus", sample: true, name: { en: "Hours · Dawn", "zh-Hant": "Hours · 晨光", "zh-Hans": "Hours · 晨光" },
    formula: f("dawn", [["bergamot", "top", 30], ["yuzu", "top", 20], ["neroli", "heart", 25], ["white musk", "base", 25]]) },
  tea: { family: "green", sample: true, name: { en: "Afterimage · Tea", "zh-Hant": "Afterimage · 茶", "zh-Hans": "Afterimage · 茶" },
    formula: f("tea", [["green tea", "top", 30], ["fig leaf", "heart", 30], ["vetiver", "base", 25], ["white musk", "base", 15]]) },
  harbour: { family: "water", sample: true, name: { en: "Afterimage · Harbour", "zh-Hant": "Afterimage · 海港", "zh-Hans": "Afterimage · 海港" },
    formula: f("harbour", [["sea salt", "top", 30], ["ozonic accord", "heart", 30], ["driftwood", "base", 15], ["white musk", "base", 25]]) },
  noon: { family: "floral", sample: true, name: { en: "Hours · Noon", "zh-Hant": "Hours · 正午", "zh-Hans": "Hours · 正午" },
    formula: f("noon", [["mandarin", "top", 15], ["osmanthus", "heart", 30], ["jasmine", "heart", 25], ["peony", "heart", 15], ["white musk", "base", 15]]) },
  forest: { family: "woody", sample: true, name: { en: "Afterimage · Forest", "zh-Hant": "Afterimage · 森林", "zh-Hans": "Afterimage · 森林" },
    formula: f("forest", [["cypress", "top", 20], ["cedar", "heart", 30], ["sandalwood", "base", 35], ["vetiver", "base", 15]]) },
  night: { family: "amber", sample: true, name: { en: "Hours · Night", "zh-Hant": "Hours · 夜", "zh-Hans": "Hours · 夜" },
    formula: f("night", [["pink pepper", "top", 10], ["benzoin", "heart", 25], ["vanilla", "base", 30], ["tonka", "base", 20], ["soft musk", "base", 15]]) },
};
```

`lib/element/kit.ts`
```ts
import type { BaseId, Letter, Vial, VialContent } from "./types.ts";
const LETTERS: Letter[] = ["A", "B", "C", "D", "E", "F"];
const BASE_IDS: BaseId[] = ["dawn", "tea", "harbour", "noon", "forest", "night"];
const CONTENTS: VialContent[] = ["blank", "weak", "medium", "strong"];
// Seeded so the server can rebuild the key from the printed kit code. Not secret-grade; the
// key only needs to stop people sharing answers between kits.
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 2 ** 32;
}
function shuffle<T>(items: T[], next: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
export function kitKey(code: string) {
  const next = rng(`element:${code.trim().toUpperCase()}`);
  const bases = shuffle(BASE_IDS, next), vials = shuffle(CONTENTS, next);
  return {
    letters: Object.fromEntries(LETTERS.map((l, i) => [l, bases[i]])) as Record<Letter, BaseId>,
    vials: Object.fromEntries(([1, 2, 3, 4] as Vial[]).map((v, i) => [v, vials[i]])) as Record<Vial, VialContent>,
  };
}
```

`lib/element/ladder.ts`
```ts
import type { Vial, VialContent } from "./types.ts";
export type LadderAnswer = { vial: Vial; smelled: boolean; strength: 0 | 1 | 2 | 3 };
export function scoreLadder(answers: LadderAnswer[], vials: Record<Vial, VialContent>) {
  const said = (c: VialContent) => answers.find((a) => vials[a.vial] === c)?.smelled;
  if (!answers.length) return { sensitivity: "unknown" as const, falseAlarm: false, missedStrong: false, trust: 0.5 };
  const falseAlarm = said("blank") === true, missedStrong = said("strong") === false;
  const sensitivity = said("weak") ? "high" as const : said("medium") ? "medium" as const : said("strong") ? "low" as const : "unknown" as const;
  return { sensitivity, falseAlarm, missedStrong, trust: falseAlarm || missedStrong ? 0.5 : 1 };
}
```

- [ ] **Step 4: Run `npm test`; expect PASS for the three tests.**
- [ ] **Step 5: Commit** `feat(element): bases, kit key and sensitivity ladder`

### Task 2: Note graph, tuning, compare

**Files:**
- Create: `lib/element/graph.ts`, `lib/element/tune.ts`, `lib/element/compare.ts`
- Test: `lib/element/element.test.ts` (append)

**Interfaces:**
- Consumes: `BASES`, `Formula`, `Tier`, `Family` from Task 1.
- Produces:
  - `type Traits = { oil?: number /*0-1*/; sensitivity?: "high"|"medium"|"low"|"unknown"; tags: string[]; muskQuiet?: boolean; trust?: number }`
  - `type Change = { note: string; from: number; to: number; reasons: string[] }` (reasons are trait ids, e.g. `"dry-skin"`)
  - `tune(base: BaseId, traits: Traits): { formula: Formula; changes: Change[]; concentration: "EDT" | "EDP"; projection: "close" | "moderate" | "carrying" }`
  - `type ProfileVector = { likes: Record<Family, number> /*1-5*/; tags: string[] }`
  - `compare(a: ProfileVector, b: ProfileVector): { percent: number; shared: Family; differ: Family }`
  - `NOTE_TIER: Record<string, Tier>`, `TRAIT_EFFECTS: Record<string, { tier?: Partial<Record<Tier, number>>; notes?: Record<string, number> }>`, `HARMONY: Record<string, string[]>`

- [ ] **Step 1: Failing tests**

```ts
import { tune } from "./tune.ts";
import { compare } from "./compare.ts";

test("tune: no traits keeps the base; changes are capped; weights sum to 100", () => {
  const plain = tune("forest", { tags: [] });
  assert.equal(plain.changes.length, 0);
  const dry = tune("dawn", { oil: 0.1, sensitivity: "low", tags: ["post-gym", "humid-outdoor"] });
  assert.equal(Math.round(dry.formula.notes.reduce((s, n) => s + n.weight, 0)), 100);
  for (const c of dry.changes) assert.ok(Math.abs(c.to - c.from) <= Math.max(c.from * 0.2, 6) + 1e-9, c.note);
  assert.ok(dry.changes.some((c) => c.reasons.includes("dry-skin")));
  assert.equal(dry.concentration, "EDP");
});

test("tune: deterministic and pH never appears as a reason", () => {
  const t = { oil: 0.8, sensitivity: "high" as const, tags: ["aircon-office", "close-quarters"] };
  assert.deepEqual(tune("night", t), tune("night", t));
  assert.ok(tune("night", t).changes.every((c) => !c.reasons.includes("ph")));
  assert.equal(tune("night", t).projection, "close");
});

test("compare: identical profiles 100, opposite low", () => {
  const a = { likes: { citrus: 5, green: 4, water: 3, floral: 2, woody: 1, amber: 1 }, tags: ["post-gym"] };
  assert.equal(compare(a, a).percent, 100);
  const b = { likes: { citrus: 1, green: 1, water: 2, floral: 3, woody: 5, amber: 5 }, tags: [] };
  assert.ok(compare(a, b).percent < 40);
});
```

- [ ] **Step 2: Run `npm test`; expect module-not-found failures.**

- [ ] **Step 3: Implement**

`lib/element/graph.ts`
```ts
import type { Tier } from "./types.ts";
export const NOTE_TIER: Record<string, Tier> = {
  bergamot: "top", yuzu: "top", mandarin: "top", "pink pepper": "top", cypress: "top", "green tea": "top", "sea salt": "top", grapefruit: "top",
  neroli: "heart", "fig leaf": "heart", "ozonic accord": "heart", osmanthus: "heart", jasmine: "heart", peony: "heart", cedar: "heart", benzoin: "heart",
  "white musk": "base", "soft musk": "base", vetiver: "base", driftwood: "base", sandalwood: "base", vanilla: "base", tonka: "base", ambroxan: "base",
};
// Curated pairs that sit well together; accents are only added along these edges.
export const HARMONY: Record<string, string[]> = {
  bergamot: ["grapefruit", "neroli", "green tea"], yuzu: ["grapefruit", "green tea"], "green tea": ["bergamot", "fig leaf", "grapefruit"],
  "sea salt": ["grapefruit", "ambroxan"], osmanthus: ["green tea", "sandalwood"], jasmine: ["sandalwood", "neroli"],
  cedar: ["vetiver", "ambroxan"], sandalwood: ["ambroxan", "vanilla"], vanilla: ["sandalwood", "tonka"], "white musk": ["ambroxan"],
};
// Trait effects in percentage points per tier or per note. Perfumer-editable; pH is deliberately absent.
export const TRAIT_EFFECTS: Record<string, { tier?: Partial<Record<Tier, number>>; notes?: Record<string, number> }> = {
  "dry-skin": { tier: { base: 4, top: -2 } },
  "oily-skin": { tier: { base: -3, top: 2 } },
  "post-gym": { notes: { grapefruit: 4, "green tea": 3 }, tier: { top: 2 } },
  "humid-outdoor": { tier: { top: 3, base: -2 } },
  "aircon-office": { tier: { base: 1 }, notes: { "white musk": 2 } },
  "close-quarters": { tier: { top: -1 } },
  "musk-quiet": { notes: { "white musk": -5, "soft musk": -5, ambroxan: 4 } },
  "trail-memory": { notes: { "green tea": 2, vetiver: 2, cypress: 2 } },
};
```

`lib/element/tune.ts`
```ts
import { BASES } from "./bases.ts";
import { HARMONY, NOTE_TIER, TRAIT_EFFECTS } from "./graph.ts";
import type { BaseId, Formula } from "./types.ts";
export type Traits = { oil?: number; sensitivity?: "high" | "medium" | "low" | "unknown"; tags: string[]; muskQuiet?: boolean; trust?: number };
export type Change = { note: string; from: number; to: number; reasons: string[] };
const round = (n: number) => Math.round(n * 10) / 10;
export function activeTraits(t: Traits) {
  const out = [...t.tags.filter((tag) => tag in TRAIT_EFFECTS)];
  if (t.oil !== undefined && t.oil < 0.35) out.push("dry-skin");
  if (t.oil !== undefined && t.oil > 0.65) out.push("oily-skin");
  if (t.muskQuiet) out.push("musk-quiet");
  return [...new Set(out)].sort();
}
export function tune(base: BaseId, traits: Traits) {
  const start = BASES[base].formula.notes;
  const weights = new Map(start.map((n) => [n.note, n.weight]));
  const reasons = new Map<string, string[]>();
  const scale = traits.trust ?? 1;
  for (const id of activeTraits(traits)) {
    const effect = TRAIT_EFFECTS[id];
    for (const n of start) {
      const delta = (effect.tier?.[n.tier] ?? 0) / start.filter((x) => x.tier === n.tier).length + (effect.notes?.[n.note] ?? 0);
      if (!delta) continue;
      weights.set(n.note, weights.get(n.note)! + delta * scale);
      reasons.set(n.note, [...(reasons.get(n.note) ?? []), id]);
    }
    // At most two accents, only along harmony edges from notes already in the base.
    for (const [note, delta] of Object.entries(effect.notes ?? {})) {
      if (weights.has(note) || delta <= 0 || [...weights.keys()].filter((k) => !start.some((s) => s.note === k)).length >= 2) continue;
      if (!start.some((s) => HARMONY[s.note]?.includes(note))) continue;
      weights.set(note, delta * scale);
      reasons.set(note, [id]);
    }
  }
  // Cap each change at 20% of the original (accents at 6 points) so it stays the same base.
  for (const [note, w] of weights) {
    const from = start.find((s) => s.note === note)?.weight ?? 0;
    const cap = Math.max(from * 0.2, 6);
    weights.set(note, Math.max(0, Math.min(from + cap, Math.max(from - cap, w))));
  }
  const total = [...weights.values()].reduce((s, w) => s + w, 0);
  const notes = [...weights].filter(([, w]) => w > 0).map(([note, w]) => ({ note, tier: NOTE_TIER[note] ?? "heart", weight: round((w / total) * 100) }));
  const formula: Formula = { base, notes };
  const changes = notes
    .map((n) => ({ note: n.note, from: start.find((s) => s.note === n.note)?.weight ?? 0, to: n.weight, reasons: reasons.get(n.note) ?? [] }))
    .filter((c) => c.reasons.length && Math.abs(c.to - c.from) >= 0.5);
  const concentration = traits.sensitivity === "low" || (traits.oil ?? 0.5) < 0.35 ? "EDP" as const : "EDT" as const;
  const projection = traits.tags.includes("close-quarters") || traits.sensitivity === "high" ? "close" as const : traits.tags.includes("nightlife") ? "carrying" as const : "moderate" as const;
  return { formula, changes, concentration, projection };
}
```

`lib/element/compare.ts`
```ts
import type { Family } from "./types.ts";
export type ProfileVector = { likes: Record<Family, number>; tags: string[] };
const FAMILIES: Family[] = ["citrus", "green", "water", "floral", "woody", "amber"];
export function compare(a: ProfileVector, b: ProfileVector) {
  const va = FAMILIES.map((f) => a.likes[f] - 3), vb = FAMILIES.map((f) => b.likes[f] - 3);
  const dot = va.reduce((s, x, i) => s + x * vb[i], 0);
  const norm = Math.hypot(...va) * Math.hypot(...vb) || 1;
  const cosine = dot / norm;
  const tagOverlap = a.tags.length && b.tags.length ? a.tags.filter((t) => b.tags.includes(t)).length / new Set([...a.tags, ...b.tags]).size : 0;
  // 85% from family likes, 15% from shared lifestyle tags.
  const percent = Math.round(Math.max(0, Math.min(100, ((cosine + 1) / 2) * 85 + tagOverlap * 15)));
  const shared = [...FAMILIES].sort((x, y) => a.likes[y] + b.likes[y] - (a.likes[x] + b.likes[x]))[0];
  const differ = [...FAMILIES].sort((x, y) => Math.abs(a.likes[y] - b.likes[y]) - Math.abs(a.likes[x] - b.likes[x]))[0];
  return { percent, shared, differ };
}
```

- [ ] **Step 4: Run `npm test`; expect PASS. If the cap test fails for accents, check the `Math.max(from * 0.2, 6)` cap matches the test.**
- [ ] **Step 5: Commit** `feat(element): note graph tuning and profile compare`

### Task 3: Photo reader (Python prototype, then OpenCV.js)

**Files:**
- Create: `scripts/photo_reader.py`, `scripts/test_photo_reader.py`, `scripts/kit-assets/test-photos/{blot-old-layout.webp,daylight-old-layout.webp,blot-dark.webp}` (copy from the session images 11, 12, 15), `public/vendor/opencv.js`, `app/element/demo/photo-reader.ts`
- Consumes: `public/kit/lid-board.json` (zones, marker positions, slots, neutrals, blue_scale, chart)

**Interfaces:**
- Produces (browser): `loadOpenCv(): Promise<void>`; `readZone(image: HTMLCanvasElement | ImageBitmap, zone: "blot" | "ph", layout: LidLayout): Promise<ZoneResult>` where
  `type ZoneResult = { ok: true; warped: HTMLCanvasElement; flags: string[]; blot?: { oil: number; step: 1|2|3|4|5|6; clearArea: number }; ph?: { skin: number; control: number; diff: number; confidence: number } } | { ok: false; reason: "markers" | "blur" | "glare"; missing?: number[] }`
- The real photos use the earlier ChatGPT layout (rotated); the prototype must also accept the current `lid-board.json`. For the earlier layout, only marker detection is asserted.

- [ ] **Step 1: Prototype test (pytest-free, plain asserts)**

```python
# scripts/test_photo_reader.py
from pathlib import Path
import cv2
from photo_reader import detect_markers, read_zone, LAYOUT

HERE = Path(__file__).parent / "kit-assets" / "test-photos"

def test_markers_on_real_photos():
    for name in ["blot-old-layout.webp", "daylight-old-layout.webp", "blot-dark.webp"]:
        ids = detect_markers(cv2.imread(str(HERE / name)))
        assert {4, 5, 6, 7} <= set(ids), (name, ids)

def test_missing_markers_reported():
    img = cv2.imread(str(HERE / "blot-old-layout.webp"))
    result = read_zone(img, "blot", LAYOUT)
    assert result["ok"] is False and result["reason"] == "markers" and set(result["missing"]) <= {0, 1, 2, 3}

def test_blot_reading_on_rendered_board():
    board = cv2.imread(str(Path(__file__).parent.parent / "public" / "kit" / "rendered-board-test.png"))
    if board is None: return
    r = read_zone(board, "blot", LAYOUT)
    assert r["ok"] and 0 <= r["blot"]["oil"] <= 1

if __name__ == "__main__":
    test_markers_on_real_photos(); test_missing_markers_reported(); test_blot_reading_on_rendered_board(); print("ok")
```

- [ ] **Step 2: Run `python scripts/test_photo_reader.py`; expect ImportError.**

- [ ] **Step 3: Implement `scripts/photo_reader.py`**: `LAYOUT = json.load(public/kit/lid-board.json)`; `detect_markers(img)` with `cv2.aruco.ArucoDetector(DICT_4X4_50)`; `read_zone(img, zone, layout)`: required ids `[0,1,2,3]` for blot, `[4,5,6,7]` for pH, return missing ids if any; homography from marker outer corners (mm positions from layout) to a 10 px/mm canvas; colour-correct per channel with the zone's white and black patch medians (`(x - black) / (white - black) * 255`); blot: median colour of the 3 mm dry border vs each pixel inside the sheet guide, oil = mean of `clip((dry_luma - luma) / (dry_luma - clear_luma), 0, 1)` with `clear_luma` from `blue_scale[5]`, `clearArea` = share of pixels above 0.7, `step` = nearest blue scale step to the 90th-percentile pixel; pH: sample 3 pads per strip at slot pad rects, convert to Lab, ΔE to each chart row (3 pads summed), pH = weighted mean of the two closest rows, confidence = `1 - best/second` clipped; flags `glare` if white patch has >2% pixels at 255, `shadow` if left and right neutrals differ by >25 in luma.
- [ ] **Step 4: Run the test; expect `ok`.**
- [ ] **Step 5: Download OpenCV.js** (`https://docs.opencv.org/4.10.0/opencv.js`) to `public/vendor/opencv.js`; verify `cv.aruco_ArucoDetector` or `cv.ArucoDetector` exists by loading it in the built-in browser. If ArUco is missing from the official build, use `js-aruco2` (`npm i js-aruco2`, dictionary `ARUCO_4X4_1000`, IDs 0-7 are the same as DICT_4X4_50) for detection and keep OpenCV.js for `getPerspectiveTransform`, `warpPerspective` and colour maths.
- [ ] **Step 6: Port to `app/element/demo/photo-reader.ts`** with the same steps and thresholds; add a dev page check by running it on `scripts/kit-assets/test-photos/blot-dark.webp` served from `/kit/test-photos/` and asserting markers 4-7 in the browser console.
- [ ] **Step 7: Commit** `feat(element): lid photo reader (Python prototype and OpenCV.js port)`

### Task 4: Survey bank and engine

**Files:**
- Create: `lib/element/survey-bank.ts`, `lib/element/survey.ts`
- Test: append to `lib/element/element.test.ts`

**Interfaces:**
- Produces:
  - `type Question = { id: string; topic: "routine"|"climate"|"activity"|"social"|"memory"|"dislikes"; text: Localised; chips: { id: string; label: Localised; tags: string[] }[]; followsFrom?: { question: string; chip: string } }`
  - `BANK: Question[]` (at least 24 questions, 4 per topic; must include `weekday` with chip `office`, `aircon` following `weekday/office`, `gym` with chips and a `gym-time` follow-up, `weekend` with chip `hiking` and `trail` follow-up)
  - `type SurveyState = { answered: { id: string; text: string; chips: string[]; tags: string[]; source: "bank" | "ai" }[]; aiFollowUps: number }`
  - `nextFromBank(state: SurveyState): Question | null` (follow-ups first, then the least-covered topic, stops at 12 answers)
  - `validateAiChoice(raw: unknown, state: SurveyState, locale: Locale): { kind: "bank"; question: Question } | { kind: "followup"; text: string; chips: { id: string; label: string; tags: string[] }[] } | null`
  - `BANNED = ["health","illness","medic","religio","sexual","income","salary","weight"]`

- [ ] **Step 1: Failing tests**

```ts
import { BANK } from "./survey-bank.ts";
import { nextFromBank, validateAiChoice } from "./survey.ts";

test("survey: bank covers all topics in all languages", () => {
  for (const q of BANK) for (const l of ["en", "zh-Hant", "zh-Hans"] as const) assert.ok(q.text[l] && q.chips.every((c) => c.label[l]), q.id);
  assert.equal(new Set(BANK.map((q) => q.topic)).size, 6);
});

test("survey: follow-up comes next, then least-covered topic, stops at 12", () => {
  const state = { answered: [{ id: "weekday", text: "", chips: ["office"], tags: ["office"], source: "bank" as const }], aiFollowUps: 0 };
  assert.equal(nextFromBank(state)?.id, "aircon");
  const full = { answered: Array.from({ length: 12 }, (_, i) => ({ id: `q${i}`, text: "", chips: [], tags: [], source: "bank" as const })), aiFollowUps: 0 };
  assert.equal(nextFromBank(full), null);
});

test("survey: AI output is validated; bad output returns null so the bank is used", () => {
  const state = { answered: [], aiFollowUps: 0 };
  assert.equal(validateAiChoice("not json", state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "Do you have any health conditions?", chips: [] } }, state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "x".repeat(200), chips: [] } }, state, "en"), null);
  assert.equal(validateAiChoice({ followup: { text: "Morning or evening runs?", chips: [{ id: "m", label: "Morning", tags: ["morning"] }] } }, { answered: [], aiFollowUps: 3 }, "en"), null);
  assert.equal(validateAiChoice({ questionId: "gym" }, state, "en")?.kind, "bank");
});
```

- [ ] **Step 2: Run; expect failure.**
- [ ] **Step 3: Implement** the bank (24+ questions, specific wording such as "Do you go to the gym?", Hong Kong context: MTR commute, air-conditioned office, hiking trails like Dragon's Back and Lion Rock, dim sum, beach, bars; tags from the spec) and the engine: `nextFromBank` picks unanswered `followsFrom` matches first, then the topic with the fewest answers, in bank order; `validateAiChoice` accepts `{ questionId }` naming an unanswered bank question, or `{ followup: { text, chips } }` when `aiFollowUps < 3`, `text.length <= 120`, no `BANNED` substring (case-insensitive) in text or chip labels, 2-5 chips; otherwise null.
- [ ] **Step 4: Run; expect PASS.**
- [ ] **Step 5: Commit** `feat(element): adaptive survey bank and engine`

### Task 5: Nose model training and inference

**Files:**
- Create: `scripts/train-nose-model.py`, `lib/element/nose-model.json`, `lib/element/nose.ts`, `docs/element-nose-model.md` (evaluation numbers)
- Test: append to `lib/element/element.test.ts`

**Interfaces:**
- Consumes: `Family`.
- Produces: `inferNose(likes: Partial<Record<Family, number>>, sensitivity: "high"|"medium"|"low"|"unknown"): { type: string; name: Localised; filled: Record<Family, number>; muskQuiet: boolean }`; `nose-model.json` shape `{ families: Family[]; mean: number[]; std: number[]; centroids: { id: string; name: Localised; center: number[] }[]; ridge: Record<Family, { intercept: number; coef: number[] }>; eval: { looMae: number; baselineMae: number } }`

- [ ] **Step 1: Training script**: download Keller 2016 from Pyrfume (`https://raw.githubusercontent.com/pyrfume/pyrfume-data/main/keller_2016/behavior.csv`, `molecules.csv`, `stimuli.csv`); map each molecule to a family by its mean descriptor ratings (flower → floral; wood → woody; fruit + sour → citrus; grass → green; cold → water; warm + sweet + spices + musky → amber; drop molecules whose top descriptor score is below the 60th percentile); per subject, mean pleasantness per family at the high concentration; standardise; k-means for k in 3..6, pick best silhouette; name each centroid by its top and bottom family ("Fresh-leaning", "Warm-leaning", "Floral-leaning", "Balanced"; with zh-Hant/zh-Hans names); ridge regression (alpha 1.0) per family predicting it from the other five; leave-one-subject-out MAE vs predicting the training mean; write JSON and `docs/element-nose-model.md` with the numbers and the dataset citation (Keller & Vosshall 2016, BMC Neuroscience, CC BY 4.0, PMC4977894).
- [ ] **Step 2: Run** `python scripts/train-nose-model.py`; expect JSON written and printed `looMae` and `baselineMae`.
- [ ] **Step 3: Failing test**

```ts
import { inferNose } from "./nose.ts";
test("nose: fills missing families, returns a named type, flags musk-quiet only from low amber with low sensitivity", () => {
  const r = inferNose({ citrus: 5, green: 4, floral: 2 }, "medium");
  assert.equal(Object.keys(r.filled).length, 6);
  assert.ok(r.name.en.length > 0);
  for (const v of Object.values(r.filled)) assert.ok(v >= 1 && v <= 5);
  assert.equal(inferNose({}, "unknown").filled.citrus >= 1, true);
});
```

- [ ] **Step 4: Implement `lib/element/nose.ts`**: import JSON; fill missing families with the ridge prediction from known ones (missing inputs use the mean); clamp 1-5; standardise; nearest centroid by Euclidean distance; `muskQuiet = filled.amber <= 2 && sensitivity === "low"`.
- [ ] **Step 5: Run `npm test`; PASS. Commit** `feat(element): nose model trained on Keller 2016`

### Task 6: `/element/demo` walkthrough UI

**Files:**
- Create: `app/element/demo/page.tsx`, `app/element/demo/demo-flow.tsx`, `app/element/demo/styled-qr.tsx`, `lib/element/copy.ts`, `public/kit/sample/{blot.jpg,ph.jpg}` (sample lid photos), CSS appended to `app/globals.css` under `/* Element demo */`
- Modify: `package.json` (add `qr-code-styling`)

**Interfaces:**
- Consumes: `kitKey`, `scoreLadder`, `tune`, `inferNose`, `compare`, `nextFromBank`, `readZone`, API routes from Task 7 (`POST /api/element/session`, `POST /api/element/photo`, `POST /api/element/survey`, `POST /api/element/voice`, `POST /api/element/result`).
- Produces: `<StyledQr value={string} size={number} />` rendering qr-code-styling with `{ dotsOptions: { type: "rounded", color: "#8a6418" }, cornersSquareOptions: { type: "extra-rounded", color: "#8a6418" }, cornersDotOptions: { type: "dot", color: "#8a6418" }, image: "/kit/element-e.png", imageOptions: { margin: 6, hideBackgroundDots: true, imageSize: 0.32 }, qrOptions: { errorCorrectionLevel: "H" } }`.

Screens in order, one per state of a `step` index, progress bar on top, back button, bottom action (copy in all three languages in `lib/element/copy.ts`):
0 Welcome (mode toggle: "Try with sample photos" default / "I have a kit"; preload OpenCV.js) · 1 You (first name, email field with "Continue with demo account", 18+ and consent checkboxes) · 2 Set up checklist · 3 Blot instructions → camera (`<input type="file" accept="image/*" capture="environment">` plus live preview frame overlay) → reading chip, or "Use sample photo" · 4 pH instructions → 60 s timer (both strips together) → camera → reading · 5 Survey (one question per screen, chips, mic button for voice) · 6 Smell: ladder (4 vials, "smell anything? 0-3"), timed pause screen (30 s, "breathe, smell your inner elbow"), blind rating A-F (liking and strength sliders), pick top 2, final pick · 7 Building your formula (four progress bars: Skin, pH, Nose, Lifestyle; each fills when its result is ready) · 8 Your formula (revealed base name, note graph SVG animating from base weights to tuned weights, one-line reason per change, concentration, perfumer note, Order HK$988 and Gift buttons to `/shop?source=element-order#newsletter`) · 9 Share (card with nose type, top families, label art; share link and StyledQr; "Compare with the founder" and "Scan a friend's code").

- [ ] **Step 1:** Build screens 0-2 and 9 with static data; open `/element/demo` in the built-in browser at mobile width (375 x 812); check text in all three languages and 44 px targets.
- [ ] **Step 2:** Wire screens 3-4 to `readZone`; "Use sample photo" loads `/kit/sample/*.jpg`; show retake messages for `{ ok: false }`.
- [ ] **Step 3:** Wire screens 5-6 to the survey API and local ladder/nose logic; smell answers are taps (judges pretend).
- [ ] **Step 4:** Wire 7-8 to `POST /api/element/result`; if it fails within 8 s, compute `tune()` locally and show template reasons.
- [ ] **Step 5:** Manual check list in the browser: language switch on every step keeps answers; skipping every optional step still reaches a result; reduced motion shows the final graph without animation; back button never loses a photo reading.
- [ ] **Step 6: Commit** `feat(element): guided demo walkthrough`

### Task 7: Element API and AI server

**Files:**
- Create: `migrations/0002_element.sql`, `lib/element/store.server.ts`, `lib/element/ai.server.ts`, `app/api/element/[action]/route.ts`
- Modify: `wrangler.jsonc` (add `"ai": { "binding": "AI" }`, Vectorize index `element-tags`, `send_email` binding for `codes@yatlifestyle.com`), `cloudflare-env.d.ts`, `migrations/0001_newsletter.sql` stays; add `0003_newsletter_sources.sql` relaxing `source` to `('shop','element-order','element-gift')` via table copy.
- Test: `lib/element/api.test.ts` with `node:sqlite` like `lib/newsletter.test.ts`

**Interfaces:**
- Consumes: Tasks 1, 2, 4, 5.
- Produces routes (JSON in, JSON out, same-origin check, 16 KB body limit except photo 2 MB):
  - `session` → `{ sessionId }` (mode `demo` | `kit`, kit code, first name, locale)
  - `photo` → stores straightened JPEG in R2 at `element/{session}/{zone}-{n}.jpg`, readings in D1; runs the vision check with `@cf/meta/llama-4-scout-17b-16e-instruct` (4 s timeout) and returns `{ flags }`
  - `survey` → `{ question }` using `nextFromBank` and, within 3 s, `@cf/meta/llama-3.3-70b-instruct-fp8-fast` in JSON mode validated by `validateAiChoice`
  - `voice` → `@cf/openai/whisper-large-v3-turbo` then `@cf/baai/bge-m3` + Vectorize top 3 tags (6 s timeout; on failure `{ tags: [] }`)
  - `result` → `tune()` + `inferNose()`; explainer with the 70B model limited to the change list (6 s; on failure template sentences); label art with `@cf/black-forest-labs/flux-1-schnell` async to R2; returns `{ resultId, shareId, base, formula, changes, explanations, concentration, projection, nose }`
  - `compare` → `{ percent, shared, differ, sentence }`
  - every `env.AI.run` passes `{ gateway: { id: "yat-element" } }`
- [ ] **Step 1:** Write `api.test.ts` covering: bad origin 403, oversize 413, `result` with an AI stub that throws still returns template explanations, `survey` with an AI stub returning banned text returns a bank question.
- [ ] **Step 2:** Run; expect failure. **Step 3:** Implement. **Step 4:** PASS. **Step 5:** `npx wrangler d1 migrations apply yat-lifestyle-prod-db --local`, then commit `feat(element): API, storage and Workers AI calls`.

### Task 8: `/element` cinematic landing and Lab notes

**Files:**
- Create: `app/element/page.tsx`, `app/element/element-experience.tsx`, `app/element/ai/page.tsx`, `app/element/science/page.tsx`, `app/element/research/page.tsx`, `lib/element/research.ts` (claims list from `research_notes/claims-review.md` with verdict, safe wording, source URL)
- Reuse: `lib/story-motion.ts`, the drop sequence in `public/media/drop-sequence/`, `SiteHeader`.
- Story (scroll-driven, reduced motion = stills): drop falls into the lid → zone 1 lights, blot darkens → zone 2, strips change colour → survey chips branch → note graph assembles → drop settles into the Element E. Then sections from the spec (problem, science, how it works, kit, AI, honest science, pricing, FAQ, CTA with StyledQr) and a Lab notes tab strip linking `/element/ai`, `/element/science`, `/element/research`; every claim on the AI and science pages links to its `#claim-id` on the research page.
- [ ] **Step 1:** Build static sections and Lab notes pages from `lib/element/research.ts`; check in the browser at 375 and 1440 widths.
- [ ] **Step 2:** Add the scroll story using `storyMotion`; verify reduced motion.
- [ ] **Step 3: Commit** `feat(element): cinematic landing and lab notes`

### Task 9: Home page, navigation, error pages

**Files:**
- Modify: `app/home-experience.tsx` (hero copy to Element with "Try the demo" and "How it works"; Element first and longest chapter; Hours and Afterimage become "Regular lines" section after the story; all three languages), `app/site-header.tsx` (Element first link, gold "Try the demo" action replacing Shop on Element pages)
- Create: `app/not-found.tsx`, `app/error.tsx` (brand style, "This scent trail went cold." / localised, links home and to `/element/demo`)
- [ ] **Step 1:** Edit copy and order; run `npm test` (story-motion test must still pass); check home at 375 and 1440 in the browser.
- [ ] **Step 2:** Add error pages; visit `/does-not-exist` in the browser.
- [ ] **Step 3: Commit** `feat(home): lead with Element; branded error pages`

### Task 10: Accounts, profiles, compare, gift

**Files:**
- Create: `app/element/login/page.tsx`, `app/element/me/page.tsx`, `app/element/p/[id]/page.tsx`, `app/element/compare/[a]/[b]/page.tsx`, `lib/element/auth.server.ts`
- Modify: `app/api/element/[action]/route.ts` (actions `auth-request`, `auth-verify`, `profile`)
- Behaviour: email + 6-digit code (10 min expiry, 5 attempts, hashed with SHA-256 and a pepper secret, rate-limited with the existing limiter pattern), session cookie `HttpOnly; Secure; SameSite=Lax`; profile private by default, share creates unlisted id; shared page shows nose type, top families, tags, StyledQr, "Compare with me", "Gift this", "Try this formula"; skin and pH never rendered; founder profile seeded with id `founder`.
- [ ] **Step 1:** Tests in `lib/element/api.test.ts`: code expires, wrong code 5 times locks, shared profile JSON never contains `oil` or `ph` keys.
- [ ] **Step 2:** Implement; PASS; browser check of login with a real email to the owner's address.
- [ ] **Step 3: Commit** `feat(element): email-code accounts, shared profiles, compare and gift`

### Task 11: Deploy and verify

- [ ] `npm test` passes.
- [ ] `npx wrangler d1 migrations apply yat-lifestyle-prod-db --remote`.
- [ ] Create AI Gateway `yat-element`, Vectorize index `element-tags` (bge-m3, 1024 dims) and upload tag descriptions; verify Email Service sender on yatlifestyle.com.
- [ ] `npm run build && npm run deploy`.
- [ ] On a phone: scan the printed lid QR, complete the demo with sample photos and with real photos, share, compare with founder, open Order (waitlist). Check `/element`, `/element/ai`, `/element/research`, `/`, a 404.
- [ ] AI Gateway dashboard shows logged requests.
- [ ] Commit any fixes; `graphify update .`.
