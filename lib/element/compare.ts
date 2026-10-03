import type { Family } from "./types.ts";
export type ProfileVector = { likes: Record<Family, number>; tags: string[] };
const FAMILIES: Family[] = ["citrus", "green", "water", "floral", "woody", "amber"];
export function compare(a: ProfileVector, b: ProfileVector) {
  const va = FAMILIES.map((f) => a.likes[f] - 3), vb = FAMILIES.map((f) => b.likes[f] - 3);
  const dot = va.reduce((s, x, i) => s + x * vb[i], 0);
  const na = Math.hypot(...va), nb = Math.hypot(...vb);
  const cosine = na && nb ? dot / (na * nb) : na || nb ? 0 : 1;
  const tagOverlap = a.tags.length && b.tags.length ? a.tags.filter((t) => b.tags.includes(t)).length / new Set([...a.tags, ...b.tags]).size : 0;
  // 85% from family likes, 15% from shared lifestyle tags; with no tags on either side, likes alone.
  const noTags = !a.tags.length && !b.tags.length;
  const percent = Math.round(Math.max(0, Math.min(100, noTags ? ((cosine + 1) / 2) * 100 : ((cosine + 1) / 2) * 85 + tagOverlap * 15)));
  const shared = [...FAMILIES].sort((x, y) => a.likes[y] + b.likes[y] - (a.likes[x] + b.likes[x]))[0];
  const differ = [...FAMILIES].sort((x, y) => Math.abs(a.likes[y] - b.likes[y]) - Math.abs(a.likes[x] - b.likes[x]))[0];
  return { percent, shared, differ };
}
