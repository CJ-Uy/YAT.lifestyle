import assert from "node:assert/strict";
import { test } from "node:test";
import { displayPercents, tune } from "./tune.ts";
import { compare } from "./compare.ts";
import { BASES } from "./bases.ts";
import { TRAIT_EFFECTS } from "./graph.ts";
import type { BaseId } from "./types.ts";

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
  const b = "night" as const;
  assert.deepEqual(tune(b, { tags: ["ph"], oil: 0.5 }), tune(b, { tags: [], oil: 0.5 }));
  assert.equal(tune("night", t).projection, "close");
});

test("compare: identical profiles 100, opposite low", () => {
  const a = { likes: { citrus: 5, green: 4, water: 3, floral: 2, woody: 1, amber: 1 }, tags: ["post-gym"] };
  assert.equal(compare(a, a).percent, 100);
  const b = { likes: { citrus: 1, green: 1, water: 2, floral: 3, woody: 5, amber: 5 }, tags: [] };
  assert.ok(compare(a, b).percent < 40);
  assert.equal(compare({ ...a, tags: [] }, { ...a, tags: [] }).percent, 100);
  const flat = { likes: { citrus: 3, green: 3, water: 3, floral: 3, woody: 3, amber: 3 }, tags: [] };
  assert.equal(compare(flat, flat).percent, 100);
});

const CASES: [BaseId, Parameters<typeof tune>[1]][] = [
  ["dawn", { oil: 0.1, sensitivity: "low", tags: ["post-gym", "humid-outdoor"] }],
  ["night", { oil: 0.8, sensitivity: "high", tags: ["aircon-office", "close-quarters"] }],
  ["tea", { oil: 0.2, tags: ["post-gym", "trail-memory"], muskQuiet: true }],
  ["harbour", { oil: 0.9, tags: ["humid-outdoor", "aircon-office"], muskQuiet: true, trust: 0.5 }],
  ["noon", { oil: 0.1, tags: ["post-gym", "humid-outdoor", "aircon-office", "trail-memory", "close-quarters"], muskQuiet: true }],
  ["forest", { oil: 0.1, tags: ["humid-outdoor"] }],
];

test("tune: reasoned notes move the way their trait effects imply", () => {
  for (const [base, traits] of CASES) {
    const start = BASES[base].formula.notes;
    const ids = [...new Set([...traits.tags, ...(traits.oil! < 0.35 ? ["dry-skin"] : traits.oil! > 0.65 ? ["oily-skin"] : []), ...(traits.muskQuiet ? ["musk-quiet"] : [])])];
    for (const c of tune(base, traits).changes) {
      if (c.reasons.includes("rebalance")) continue;
      const n = start.find((s) => s.note === c.note);
      const implied = c.reasons.reduce((sum, id) => {
        const e = TRAIT_EFFECTS[id];
        return sum + (n ? (e.tier?.[n.tier] ?? 0) / start.filter((x) => x.tier === n.tier).length : 0) + (e.notes?.[c.note] ?? 0);
      }, 0);
      assert.ok(ids.length && Math.sign(c.to - c.from) === Math.sign(implied), `${base} ${c.note} ${c.from}->${c.to} implied ${implied}`);
    }
  }
});

test("tune: cap holds on final weights and weights sum to 100", () => {
  for (const [base, traits] of CASES) {
    const r = tune(base, traits);
    assert.ok(Math.abs(r.formula.notes.reduce((s, n) => s + n.weight, 0) - 100) <= 0.5, base);
    for (const n of r.formula.notes) {
      const from = BASES[base].formula.notes.find((s) => s.note === n.note)?.weight ?? 0;
      assert.ok(Math.abs(n.weight - from) <= Math.max(from * 0.2, 6) + 1e-9, `${base} ${n.note}`);
    }
    for (const c of r.changes) assert.ok(Math.abs(c.to - c.from) >= 0.5 && Math.abs(c.to - c.from) <= Math.max(c.from * 0.2, 6) + 1e-9);
  }
  // The reviewed example: white musk rises for dry skin, neroli shows up as a rebalance.
  const dry = tune("dawn", CASES[0][1]);
  assert.ok(dry.formula.notes.find((n) => n.note === "white musk")!.weight > 25);
  const neroli = dry.changes.find((c) => c.note === "neroli");
  assert.ok(!neroli || neroli.reasons.includes("rebalance"));
});

test("tune: display percents are whole numbers that sum to exactly 100", () => {
  // The live walkthrough's Hours · Night: 8 + 23 + 31.3 + 21.3 + 16.3 = 99.9 shown as-is.
  const live = [["pink pepper", 8], ["benzoin", 23], ["vanilla", 31.3], ["tonka", 21.3], ["soft musk", 16.3]].map(([note, weight]) => ({ note: note as string, weight: weight as number }));
  const shown = displayPercents(live);
  assert.equal(Object.values(shown).reduce((s, v) => s + v, 0), 100);
  assert.deepEqual(shown, { "pink pepper": 8, benzoin: 23, vanilla: 32, tonka: 21, "soft musk": 16 });
  for (const [base, traits] of CASES) {
    const d = displayPercents(tune(base, traits).formula.notes);
    assert.equal(Object.values(d).reduce((s, v) => s + v, 0), 100, base);
    assert.ok(Object.values(d).every(Number.isInteger));
  }
  assert.deepEqual(displayPercents(BASES.dawn.formula.notes), { bergamot: 30, yuzu: 20, neroli: 25, "white musk": 25 });
});
