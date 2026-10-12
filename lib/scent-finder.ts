import { PRODUCTS, type Product } from "./shop.ts";
import { SCENT_NOTES } from "./scent-notes.ts";

export const SCENT_FAMILIES = ["tea", "floral", "woody", "fruity", "musky"] as const;
export type ScentFamily = typeof SCENT_FAMILIES[number] | "any";

// Editorial positions from the published scent notes, not measured fragrance properties.
const warmth: Record<string, number> = {
  midnight: 3, golden: 2, forest: 4, dark: 4, sunday: 2, freshly: 0,
  ocean: 0, quiet: 0, pure: 1, white: 1, "high-tea": 2, "6am": 1,
};

export function recommendScents(family: ScentFamily, feel: number): Product[] {
  const matches = (product: Product) => family === "any" || product.families.includes(family)
    || (family === "musky" && SCENT_NOTES[product.slug].en.dryDown.toLowerCase().includes("musk"));
  return [...PRODUCTS].sort((a, b) => {
    const aMatches = matches(a), bMatches = matches(b);
    if (aMatches !== bMatches) return aMatches ? -1 : 1;
    return Math.abs(warmth[a.slug] - feel) - Math.abs(warmth[b.slug] - feel);
  }).slice(0, 3);
}
