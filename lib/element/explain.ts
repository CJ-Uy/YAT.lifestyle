import type { Locale } from "../../app/site-header.tsx";
import { BASES } from "./bases.ts";
import { NOTE_TIER, TRAIT_EFFECTS } from "./graph.ts";
import { clean } from "./survey.ts";
import type { Change } from "./tune.ts";
import type { BaseId, Family, Localised } from "./types.ts";

type L = [en: string, zhHant: string, zhHans: string];
const loc = ([en, h, s]: L): Localised => ({ en, "zh-Hant": h, "zh-Hans": s });

export const CLOSING = loc(["A perfumer reviews every formula before mixing.", "每個配方在調製前都會經調香師審核。", "每个配方在调制前都会经调香师审核。"]);

// Plain reasons per trait. pH is deliberately absent: it is recorded, never a reason.
export const REASONS: Record<string, Localised> = {
  "dry-skin": loc(["your skin reads dry, so base notes help it last", "你的皮膚偏乾，基調能讓香味更持久", "你的皮肤偏干，基调能让香味更持久"]),
  "oily-skin": loc(["your skin reads oily, which holds heavy notes longer", "你的皮膚偏油，較能留住濃重的香調", "你的皮肤偏油，较能留住浓重的香调"]),
  "post-gym": loc(["you wear scent after the gym, so it opens fresher", "你常在運動後用香，開首要更清新", "你常在运动后用香，开头要更清新"]),
  "humid-outdoor": loc(["you spend time outdoors in the humidity", "你常在潮濕的戶外", "你常在潮湿的户外"]),
  "aircon-office": loc(["you sit in air-conditioned rooms, where skin-close musk works well", "你常在冷氣房，貼膚的麝香更合適", "你常在空调房，贴肤的麝香更合适"]),
  "close-quarters": loc(["you are often in close quarters, so it stays nearer the skin", "你常與人近距離相處，香味宜貼近皮膚", "你常与人近距离相处，香味宜贴近皮肤"]),
  "musk-quiet": loc(["your nose picks up musks faintly, so other notes carry the base", "你對麝香較不敏感，改由其他香調支撐", "你对麝香较不敏感，改由其他香调支撑"]),
  "trail-memory": loc(["it echoes your trail memory", "呼應你記憶中的山徑", "呼应你记忆中的山径"]),
  rebalance: loc(["it keeps the blend balanced, so it still smells like your base", "保持整體平衡，讓它依然是你選的基調", "保持整体平衡，让它依然是你选的基调"]),
};

export const NOTE_NAMES: Record<string, Localised> = Object.fromEntries(Object.entries({
  bergamot: ["佛手柑", "佛手柑"], yuzu: ["柚子", "柚子"], mandarin: ["橘子", "橘子"], "pink pepper": ["粉紅胡椒", "粉红胡椒"],
  cypress: ["柏木", "柏木"], "green tea": ["綠茶", "绿茶"], "sea salt": ["海鹽", "海盐"], grapefruit: ["西柚", "西柚"],
  neroli: ["橙花", "橙花"], "fig leaf": ["無花果葉", "无花果叶"], "ozonic accord": ["海風調", "海风调"], osmanthus: ["桂花", "桂花"],
  jasmine: ["茉莉", "茉莉"], peony: ["牡丹", "牡丹"], cedar: ["雪松", "雪松"], benzoin: ["安息香", "安息香"],
  "white musk": ["白麝香", "白麝香"], "soft musk": ["柔和麝香", "柔和麝香"], vetiver: ["岩蘭草", "岩兰草"], driftwood: ["漂流木", "漂流木"],
  sandalwood: ["檀香", "檀香"], vanilla: ["雲呢拿", "香草"], tonka: ["零陵香豆", "零陵香豆"], ambroxan: ["龍涎香調", "龙涎香调"],
}).map(([en, [h, s]]) => [en, loc([en, h, s])]));

export const FAMILY_NAMES: Record<Family, Localised> = {
  citrus: loc(["citrus", "柑橘", "柑橘"]), green: loc(["green", "青綠", "青绿"]), water: loc(["water", "水生", "水生"]),
  floral: loc(["floral", "花香", "花香"]), woody: loc(["woody", "木質", "木质"]), amber: loc(["amber", "琥珀", "琥珀"]),
};

const PROJECTION = { close: loc(["close to the skin", "貼近皮膚", "贴近皮肤"]), moderate: loc(["at arm's length", "在一臂距離內", "在一臂距离内"]), carrying: loc(["a little further out", "稍為擴散", "稍微扩散"]) };
type Projection = keyof typeof PROJECTION;

const noteName = (note: string, locale: Locale) => NOTE_NAMES[note]?.[locale] ?? note;
/** Reasons whose trait effect on this note (the note itself plus its tier) pushed it the way it moved.
 *  A trait can touch a note in the opposite direction (dry skin lowers top notes) and still be listed by tune(); those are
 *  dropped here so a sentence never says "because your skin reads dry" about a top note that went up. Nothing left means rebalance. */
export function matchingReasons(c: Change): string[] {
  const dir = Math.sign(c.to - c.from), tier = NOTE_TIER[c.note] ?? "heart";
  const kept = c.reasons.filter((id) => id !== "rebalance" && dir * ((TRAIT_EFFECTS[id]?.notes?.[c.note] ?? 0) + (TRAIT_EFFECTS[id]?.tier?.[tier] ?? 0)) > 0);
  return kept.length ? kept : ["rebalance"];
}

const reasonText = (c: Change, locale: Locale) => {
  const parts = matchingReasons(c).map((r) => (REASONS[r] ?? REASONS.rebalance)[locale]);
  return locale === "en" ? parts.join(" and ") : parts.join("，而且");
};

export function changeLine(c: Change, locale: Locale) {
  const name = noteName(c.note, locale), why = reasonText(c, locale), up = c.to > c.from;
  if (locale === "en") {
    const Name = name[0].toUpperCase() + name.slice(1);
    return c.from === 0 ? `${Name} is added at ${c.to}% because ${why}.` : `${Name} goes ${up ? "up" : "down"} from ${c.from}% to ${c.to}% because ${why}.`;
  }
  const hant = locale === "zh-Hant";
  if (c.from === 0) return `加入${name} ${c.to}%，${hant ? "因為" : "因为"}${why}。`;
  return `${name}由 ${c.from}% ${up ? (hant ? "調高" : "调高") : (hant ? "調低" : "调低")}至 ${c.to}%，${hant ? "因為" : "因为"}${why}。`;
}

export function summaryLine(base: BaseId, n: number, concentration: "EDT" | "EDP", projection: Projection, locale: Locale) {
  const name = BASES[base].name[locale], proj = PROJECTION[projection][locale];
  if (locale === "en") return n ? `${name} keeps its character with ${n} small ${n === 1 ? "change" : "changes"}, made as an ${concentration} that sits ${proj}.` : `${name} suits you as it is, made as an ${concentration} that sits ${proj}.`;
  if (locale === "zh-Hant") return n ? `${name}保留原有個性，只作 ${n} 項細微調整，製成 ${concentration}，香氣${proj}。` : `${name}原本就適合你，製成 ${concentration}，香氣${proj}。`;
  return n ? `${name}保留原有个性，只作 ${n} 项细微调整，制成 ${concentration}，香气${proj}。` : `${name}原本就适合你，制成 ${concentration}，香气${proj}。`;
}

export type Explanations = { lines: string[]; summary: string; closing: string; source: "ai" | "template" };

export function templateExplanations(base: BaseId, changes: Change[], concentration: "EDT" | "EDP", projection: Projection, locale: Locale): Explanations {
  return { lines: changes.map((c) => changeLine(c, locale)), summary: summaryLine(base, changes.length, concentration, projection, locale), closing: CLOSING[locale], source: "template" };
}

const PH = /\bph\b|酸鹼|酸碱/i;
const numbersIn = (s: string) => (s.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
// Every note we know by any of its names, so a sentence cannot slip in a change that was not computed.
const mentions = (s: string, note: string) => [note, NOTE_NAMES[note]?.["zh-Hant"], NOTE_NAMES[note]?.["zh-Hans"]].some((n) => n && s.toLowerCase().includes(n));
const ALL_NOTES = [...new Set([...Object.keys(NOTE_TIER), ...Object.keys(NOTE_NAMES)])];
const sticksTo = (s: string, allowedNotes: string[], allowedNumbers: number[], max: number) =>
  typeof s === "string" && s.trim().length > 0 && s.length <= max && clean(s) && !PH.test(s)
  && numbersIn(s).every((n) => allowedNumbers.includes(n))
  && ALL_NOTES.every((n) => allowedNotes.includes(n) || !mentions(s, n));

/** The model may only reword the computed changes: one line per change, in order, no other notes, numbers or pH. */
export function validateExplanations(raw: unknown, changes: Change[], locale: Locale): Explanations | null {
  if (typeof raw === "string") { try { raw = JSON.parse(raw); } catch { return null; } }
  const { lines, summary } = (raw ?? {}) as { lines?: unknown; summary?: unknown };
  if (!Array.isArray(lines) || lines.length !== changes.length) return null;
  if (!lines.every((l, i) => sticksTo(l, [changes[i].note], [changes[i].from, changes[i].to], 200))) return null;
  if (typeof summary !== "string" || !sticksTo(summary, changes.map((c) => c.note), [changes.length], 240)) return null;
  return { lines: lines as string[], summary, closing: CLOSING[locale], source: "ai" };
}
