import assert from "node:assert/strict";
import { test } from "node:test";
import { references, techCopy } from "./tech-content.ts";

// Sorted: Chinese word order can put the same citations in a different sequence.
const cites = (s: string) => [...s.matchAll(/\[(\d+(?:, \d+)*)\]/g)].flatMap((m) => m[1].split(", ").map(Number)).sort((a, b) => a - b);
function localised(v: unknown, out: Record<string, string>[] = []) {
  if (v && typeof v === "object") {
    if ("en" in v && "zh-Hant" in v && "zh-Hans" in v) out.push(v as Record<string, string>);
    else for (const x of Object.values(v)) localised(x, out);
  }
  return out;
}

test("tech page: same citations in every locale, all resolve, every reference used, no em dashes", () => {
  const known = new Set(references.map((r) => r.n));
  assert.deepEqual([...known], references.map((_, i) => i + 1));
  const used = new Set<number>();
  for (const l of localised(techCopy)) {
    for (const s of Object.values(l)) assert.ok(!s.includes("—"), s);
    assert.deepEqual(cites(l["zh-Hant"]), cites(l.en), l.en);
    assert.deepEqual(cites(l["zh-Hans"]), cites(l.en), l.en);
    for (const n of cites(l.en)) { assert.ok(known.has(n), `[${n}] in ${l.en}`); used.add(n); }
  }
  for (const r of references) { assert.ok(used.has(r.n), `reference ${r.n} is never cited`); assert.ok(!r.text.includes("—")); }
});
