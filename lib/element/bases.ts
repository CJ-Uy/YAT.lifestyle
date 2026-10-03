import type { BaseId, Family, Formula, Localised } from "./types.ts";
const f = (base: BaseId, notes: [string, "top" | "heart" | "base", number][]): Formula => ({ base, notes: notes.map(([note, tier, weight]) => ({ note, tier, weight })) });
// Sample formulas until the founder supplies real ones. Weights are percent of the accord.
export const BASES: Record<BaseId, { family: Family; name: Localised; formula: Formula; sample: true }> = {
  dawn: { family: "citrus", sample: true, name: { en: "Hours · Dawn", "zh-Hant": "Hours · 晨光", "zh-Hans": "Hours · 晨光" },
    formula: f("dawn", [["bergamot", "top", 30], ["yuzu", "top", 20], ["neroli", "heart", 25], ["white musk", "base", 25]]) },
  tea: { family: "green", sample: true, name: { en: "Afterimage · Tea", "zh-Hant": "Afterimage · 茶", "zh-Hans": "Afterimage · 茶" },
    formula: f("tea", [["green tea", "top", 30], ["fig leaf", "heart", 30], ["vetiver", "base", 25], ["white musk", "base", 15]]) },
  harbour: { family: "water", sample: true, name: { en: "Afterimage · Harbour", "zh-Hant": "Afterimage · 海港", "zh-Hans": "Afterimage · 海港" },
    formula: f("harbour", [["sea salt", "top", 30], ["ozonic accord", "heart", 30], ["driftwood", "base", 15], ["white musk", "base", 25]]) },
  noon: { family: "floral", sample: true, name: { en: "Hours · Noon", "zh-Hant": "Hours · 正午", "zh-Hans": "Hours · 正午" },
    formula: f("noon", [["mandarin", "top", 15], ["osmanthus", "heart", 30], ["jasmine", "heart", 25], ["peony", "heart", 15], ["white musk", "base", 15]]) },
  forest: { family: "woody", sample: true, name: { en: "Afterimage · Forest", "zh-Hant": "Afterimage · 森林", "zh-Hans": "Afterimage · 森林" },
    formula: f("forest", [["cypress", "top", 20], ["cedar", "heart", 30], ["sandalwood", "base", 35], ["vetiver", "base", 15]]) },
  night: { family: "amber", sample: true, name: { en: "Hours · Night", "zh-Hant": "Hours · 夜", "zh-Hans": "Hours · 夜" },
    formula: f("night", [["pink pepper", "top", 10], ["benzoin", "heart", 25], ["vanilla", "base", 30], ["tonka", "base", 20], ["soft musk", "base", 15]]) },
};
