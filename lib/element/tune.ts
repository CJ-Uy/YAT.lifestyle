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
