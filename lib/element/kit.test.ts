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
  const partial = scoreLadder([ans(2, false)], vials);
  assert.deepEqual([partial.sensitivity, partial.trust], ["unknown", 0.5]);
});
