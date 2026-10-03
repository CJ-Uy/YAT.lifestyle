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
