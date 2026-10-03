import assert from "node:assert/strict";
import { test } from "node:test";
import { REASONS, changeLine, matchingReasons, templateExplanations } from "./explain.ts";
import { tune } from "./tune.ts";
import { CITES, noseDataset, researchClaims } from "./research.ts";

test("explain: every citation marker points at a reviewed research entry; skin longevity is hedged", () => {
  const ids = new Set([...researchClaims, noseDataset].map((c) => c.id));
  for (const id of Object.values(CITES)) assert.ok(ids.has(id), id);
  for (const r of ["dry-skin", "oily-skin"]) assert.match(REASONS[r].en, /\bmay\b/);
});

test("explain: reasons are kept only when their effect has the same sign as the change", () => {
  // dry-skin lowers top notes and raises base notes; humid-outdoor does the opposite.
  assert.deepEqual(matchingReasons({ note: "green tea", from: 30, to: 32.5, reasons: ["dry-skin", "humid-outdoor", "post-gym"] }), ["humid-outdoor", "post-gym"]);
  assert.deepEqual(matchingReasons({ note: "vetiver", from: 25, to: 26.1, reasons: ["dry-skin", "humid-outdoor"] }), ["dry-skin"]);
  assert.deepEqual(matchingReasons({ note: "fig leaf", from: 30, to: 24, reasons: ["aircon-office"] }), ["rebalance"]);
  assert.deepEqual(matchingReasons({ note: "fig leaf", from: 30, to: 24, reasons: ["rebalance"] }), ["rebalance"]);
  const line = changeLine({ note: "green tea", from: 30, to: 32.5, reasons: ["dry-skin", "post-gym"] }, "en");
  assert.ok(line.includes("after the gym") && !line.includes("skin reads dry"), line);
});

test("explain: template sentences from a real tune never cite a trait that pulled the other way", () => {
  const traits = { oil: 0.2, sensitivity: "medium" as const, tags: ["post-gym", "humid-outdoor", "trail-memory", "aircon-office"] };
  for (const base of ["dawn", "tea", "harbour", "noon", "forest", "night"] as const) {
    const t = tune(base, traits);
    const { lines } = templateExplanations(base, t.changes, t.concentration, t.projection, "en");
    t.changes.forEach((c, i) => {
      const kept = matchingReasons(c);
      for (const id of c.reasons.filter((r) => !kept.includes(r))) assert.ok(!lines[i].includes(REASONS[id].en), `${base}: ${lines[i]} cites ${id}`);
    });
  }
});
