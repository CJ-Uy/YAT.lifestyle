import assert from "node:assert/strict";
import { test } from "node:test";
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
