// One import point for the demo UI. Landed modules are re-exported; nose, photo reader and QR are
// temporary stubs with the plan's exact signatures. At merge, swap the three stubs for:
//   export { inferNose } from "../../../lib/element/nose";
//   export { loadOpenCv, readZone, type ZoneResult } from "./photo-reader";
//   export { default as StyledQr } from "../styled-qr";   (or the named export Track F uses)
import { createElement } from "react";
import type { Family, Localised } from "../../../lib/element/types";

export type { BaseId, Family, Formula, Letter, Localised, Tier, Vial, VialContent } from "../../../lib/element/types";
export { BASES } from "../../../lib/element/bases";
export { kitKey } from "../../../lib/element/kit";
export { scoreLadder, type LadderAnswer } from "../../../lib/element/ladder";
export { tune, type Change, type Traits } from "../../../lib/element/tune";
export { compare } from "../../../lib/element/compare";
export { NOTE_TIER, TRAIT_EFFECTS } from "../../../lib/element/graph";
export { nextFromBank, type SurveyState } from "../../../lib/element/survey";
export type { Question } from "../../../lib/element/survey-bank";

type Sensitivity = "high" | "medium" | "low" | "unknown";
export type ZoneResult =
  | { ok: true; warped: HTMLCanvasElement; flags: string[]; blot?: { oil: number; step: 1 | 2 | 3 | 4 | 5 | 6; clearArea: number }; ph?: { skin: number; control: number; diff: number; confidence: number } }
  | { ok: false; reason: "markers" | "blur" | "glare"; missing?: number[] };

// STUB (Task 5): nearest of four hand-made nose types; real one uses the Keller 2016 model.
const L = (en: string, hant: string, hans: string): Localised => ({ en, "zh-Hant": hant, "zh-Hans": hans });
const FAMILIES: Family[] = ["citrus", "green", "water", "floral", "woody", "amber"];
const NOSE_NAMES: Record<string, Localised> = {
  fresh: L("Fresh-leaning", "清新傾向", "清新倾向"), warm: L("Warm-leaning", "溫暖傾向", "温暖倾向"),
  floral: L("Floral-leaning", "花香傾向", "花香倾向"), balanced: L("Balanced", "均衡型", "均衡型"),
};
export function inferNose(likes: Partial<Record<Family, number>>, sensitivity: Sensitivity) {
  const known = Object.values(likes);
  const mean = known.length ? known.reduce((s, v) => s + (v ?? 3), 0) / known.length : 3;
  const filled = Object.fromEntries(FAMILIES.map((fam) => [fam, likes[fam] ?? Math.round(mean * 10) / 10])) as Record<Family, number>;
  const fresh = (filled.citrus + filled.green + filled.water) / 3, warm = (filled.woody + filled.amber) / 2;
  const type = Math.max(fresh, warm, filled.floral) - Math.min(fresh, warm, filled.floral) < 0.6 ? "balanced" : fresh >= warm && fresh >= filled.floral ? "fresh" : warm >= filled.floral ? "warm" : "floral";
  return { type, name: NOSE_NAMES[type], filled, muskQuiet: filled.amber <= 2 && sensitivity === "low" };
}

// STUB (Task 3): pretends to read; tiny images fail with a hidden marker so the retake path can be seen.
export async function loadOpenCv() { await new Promise((r) => setTimeout(r, 300)); }
export async function readZone(image: HTMLCanvasElement | ImageBitmap, zone: "blot" | "ph", _layout: unknown): Promise<ZoneResult> {
  await new Promise((r) => setTimeout(r, 1100));
  if (image.width < 200) return { ok: false, reason: "markers", missing: [2] };
  const warped = document.createElement("canvas");
  warped.width = 480; warped.height = Math.round((480 * image.height) / image.width);
  warped.getContext("2d")!.drawImage(image, 0, 0, warped.width, warped.height);
  return zone === "blot"
    ? { ok: true, warped, flags: [], blot: { oil: 0.28, step: 2, clearArea: 0.14 } }
    : { ok: true, warped, flags: [], ph: { skin: 5.3, control: 6.9, diff: -1.6, confidence: 0.72 } };
}

// STUB (Task 8 owns app/element/styled-qr.tsx): bordered box with the URL.
export function StyledQr({ value, size }: { value: string; size: number }) {
  return createElement("div", { className: "qr-stub", style: { width: size, height: size }, role: "img", "aria-label": value }, value);
}
