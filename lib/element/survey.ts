import type { Locale } from "../../app/site-header.tsx";
import { BANK, BANNED, BANNED_ZH, type Question } from "./survey-bank.ts";

export { BANNED, BANNED_ZH };

export type SurveyState = {
  // options: every chip label shown, in the person's language; picked: the labels they chose. Optional for older clients.
  answered: { id: string; text: string; chips: string[]; tags: string[]; source: "bank" | "ai"; options?: string[]; picked?: string[] }[];
  aiFollowUps: number;
};

export const MAX_ANSWERS = 12;
const MAX_AI_FOLLOWUPS = 3;

const triggered = (q: Question, state: SurveyState) =>
  !!q.followsFrom && state.answered.some((a) => a.id === q.followsFrom!.question && a.chips.some((id) => [q.followsFrom!.chip].flat().includes(id)));

const available = (state: SurveyState) => BANK.filter((q) => !state.answered.some((a) => a.id === q.id));

/** Follow-ups first, then the least-covered topic (ties by bank order). Null once 12 are answered. */
export function nextFromBank(state: SurveyState): Question | null {
  if (state.answered.length >= MAX_ANSWERS) return null;
  const open = available(state);
  const followUp = open.find((q) => triggered(q, state));
  if (followUp) return followUp;
  const roots = open.filter((q) => !q.followsFrom);
  const covered = (topic: string) => state.answered.filter((a) => BANK.find((q) => q.id === a.id)?.topic === topic).length;
  return roots.reduce<Question | null>((best, q) => (!best || covered(q.topic) < covered(best.topic) ? q : best), null);
}

const SLUG = /^[a-z0-9-]{1,32}$/;
// Applies to every locale: English and Chinese ban lists, plus no em dashes in copy.
export const clean = (s: string) => !s.includes("—") && !BANNED.some((b) => s.toLowerCase().includes(b)) && !BANNED_ZH.some((b) => s.includes(b));

export type AiChoice =
  | { kind: "bank"; question: Question }
  | { kind: "followup"; text: string; chips: { id: string; label: string; tags: string[] }[] };

const norm = (s: string) => s.toLowerCase().replace(/[\s?？!！.。,，、]+/g, " ").trim();
const labelSet = (labels: string[]) => [...new Set(labels.map(norm))].sort().join("|");
/** The chip labels a person already saw for an answered question: sent by the client, else rebuilt from the bank. */
export const optionsOf = (a: SurveyState["answered"][number], locale: Locale) =>
  a.options ?? BANK.find((q) => q.id === a.id)?.chips.map((c) => c.label[locale]) ?? [];

/** Validates the model's pick. Anything off returns null so the caller falls back to nextFromBank. */
export function validateAiChoice(raw: unknown, state: SurveyState, locale: Locale): AiChoice | null {
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { return null; }
  }
  if (state.answered.length >= MAX_ANSWERS || !raw || typeof raw !== "object") return null;
  const { questionId, followup } = raw as { questionId?: unknown; followup?: { text?: unknown; chips?: unknown } };

  if (typeof questionId === "string") {
    const question = available(state).find((q) => q.id === questionId && (!q.followsFrom || triggered(q, state)));
    return question ? { kind: "bank", question } : null;
  }

  if (!followup || state.aiFollowUps >= MAX_AI_FOLLOWUPS) return null;
  const { text, chips } = followup;
  if (typeof text !== "string" || !text.trim() || text.length > 120 || !clean(text)) return null;
  if (!Array.isArray(chips) || chips.length < 2 || chips.length > 5) return null;
  const out: { id: string; label: string; tags: string[] }[] = [];
  for (const chip of chips) {
    const { id, label, tags } = (chip ?? {}) as { id?: unknown; label?: unknown; tags?: unknown };
    if (typeof id !== "string" || !SLUG.test(id) || out.some((o) => o.id === id)) return null;
    if (typeof label !== "string" || !label.trim() || label.length > 40 || !clean(label)) return null;
    if (!Array.isArray(tags) || tags.length > 4 || !tags.every((t) => typeof t === "string" && SLUG.test(t) && clean(t))) return null;
    out.push({ id, label, tags });
  }
  // Never repeat a question, its set of answers, or any answer already offered (near-duplicates read as a broken survey).
  const set = labelSet(out.map((c) => c.label));
  const seen = new Set(state.answered.flatMap((a) => optionsOf(a, locale).map(norm)));
  if (state.answered.some((a) => norm(a.text) === norm(text) || labelSet(optionsOf(a, locale)) === set) || out.some((c) => seen.has(norm(c.label)))) return null;
  return { kind: "followup", text, chips: out };
}
