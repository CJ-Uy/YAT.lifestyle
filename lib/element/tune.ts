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
  const fromOf = (note: string) => start.find((s) => s.note === note)?.weight ?? 0;
  const capOf = (note: string) => Math.max(fromOf(note) * 0.2, 6);
  const lo = (note: string) => Math.max(0, fromOf(note) - capOf(note));
  const hi = (note: string) => fromOf(note) + capOf(note);
  const clamp = (note: string, w: number) => Math.max(lo(note), Math.min(hi(note), w));
  for (const [note, w] of weights) weights.set(note, clamp(note, w));
  // Absorb the residual so weights sum to 100 without fighting any trait: notes with no reasons first
  // (proportionally), else only reasoned notes already pushed the same way as the residual.
  for (let pass = 0; pass < 20; pass++) {
    const need = 100 - [...weights.values()].reduce((s, w) => s + w, 0);
    if (Math.abs(need) < 0.01) break;
    const room = ([note, w]: [string, number]) => (need > 0 ? w < hi(note) - 1e-9 : w > lo(note) + 1e-9);
    const pool = [...weights].filter((e) => !reasons.has(e[0]) && room(e));
    const poolSum = pool.reduce((s, [, w]) => s + w, 0);
    if (poolSum) { for (const [note, w] of pool) weights.set(note, clamp(note, w + (need * w) / poolSum)); continue; }
    // Untouched notes are used up: shrink (never flip) the deltas of reasoned notes pushed the same way as the excess.
    const pushed = [...weights].filter(([note, w]) => reasons.has(note) && Math.sign(w - fromOf(note)) === -Math.sign(need));
    const moved = pushed.reduce((s, [note, w]) => s + Math.abs(w - fromOf(note)), 0);
    if (!moved) break;
    const keep = Math.max(0, 1 - Math.abs(need) / moved);
    for (const [note, w] of pushed) weights.set(note, fromOf(note) + (w - fromOf(note)) * keep);
  }  // Round to 0.1 but stay inside the cap, so the cap holds on the published weights.
  const inside = (note: string, w: number) => Math.max(Math.ceil(lo(note) * 10 - 1e-9) / 10, Math.min(Math.floor(hi(note) * 10 + 1e-9) / 10, round(w)));
  const notes = [...weights].map(([note, w]) => ({ note, tier: NOTE_TIER[note] ?? "heart", weight: inside(note, w) })).filter((n) => n.weight > 0);
  const formula: Formula = { base, notes };
  const changes = notes
    .map((n) => ({ note: n.note, from: fromOf(n.note), to: n.weight, reasons: reasons.get(n.note) ?? ["rebalance"] }))
    .filter((c) => Math.abs(c.to - c.from) >= 0.5);
  const concentration = traits.sensitivity === "low" || (traits.oil ?? 0.5) < 0.35 ? "EDP" as const : "EDT" as const;
  const projection = traits.tags.includes("close-quarters") || traits.sensitivity === "high" ? "close" as const : traits.tags.includes("nightlife") ? "carrying" as const : "moderate" as const;
  return { formula, changes, concentration, projection };
}
