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
