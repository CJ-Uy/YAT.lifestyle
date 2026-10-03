"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import SiteHeader, { useLocale, type Locale } from "../../site-header";
import { demoCopy, tagLabel } from "../../../lib/element/copy";
import { labCopy } from "./lab-copy";
import { ladderAnswerComplete, ladderComplete, pairComplete, ratingComplete, ratingsComplete } from "./completion";
import { FormulaProcessing, InlineProcessing, LabStudy, PhotoProcessing } from "./lab-motion";
import { motionCopy } from "./lab-motion-copy";
import { DemoVial } from "./demo-vial";
import { ElementSignature } from "../element-signature";
import { sequentialCopy } from "./sequential-copy";
import ShareExperience from "./share-experience";
import DeliveryPreview, { deliveryCopy } from "./delivery-preview";
import { emptyDelivery, normaliseDelivery, type DeliveryState } from "./delivery-state";
import { advanceSequence, BASE_PAUSE_SECONDS, canAdvanceSequence, gapSeconds, INTENSITY_PAUSE_SECONDS, normaliseSequence, previousInSequence, skipDemoGap, type SmellSequence } from "./sequential-smell";
import { changeLine, matchingReasons, NOTE_NAMES } from "../../../lib/element/explain";
import { CITES } from "../../../lib/element/research";
import { callApi } from "./api";
import {
  BASES, NOTE_TIER, displayPercents, inferNose, kitKey, loadOpenCv, nextFromBank, readZone, scoreLadder, tune,
  type BaseId, type Change, type Family, type Formula, type LadderAnswer, type Letter, type Localised, type Question, type Vial, type ZoneResult,
} from "./stubs";
import "./demo-bench.css";
import "./lab-theme.css";

export type Copy = (typeof demoCopy)["en"];
type Action = { label: string; onClick?: () => void; href?: string; disabled?: boolean };
type Zone = "blot" | "ph";
type Reading = {
  sample: boolean; estimated: boolean; image?: string; flags: string[];
  blot?: { oil: number; step: number; clearArea: number }; ph?: { skin: number; control: number; diff: number; confidence: number };
};
type Answer = { id: string; text: string; answerText?: string; chips: string[]; tags: string[]; source: "bank" | "ai"; q: AskedQuestion };
type AskedQuestion = Question & { source: "bank" | "ai" };
type Rating = { like?: number; strength?: number };
type Nose = { type: string; name: Localised; filled: Record<Family, number> };
export type Result = {
  base: BaseId; formula: Formula; changes: Change[]; explanations?: string[]; explLocale?: Locale;
  concentration: "EDT" | "EDP"; projection: "close" | "moderate" | "carrying"; nose: Nose; shareId?: string; resultId?: string; source: "api" | "local";
};
export type State = {
  step: number; sub: number; mode: "sample" | "kit"; name: string; email: string; demoAccount: boolean; kitCode: string; adult: boolean; consent: boolean;
  setup: boolean[]; prepared: Record<Zone, boolean[]>; blot?: Reading; ph?: Reading; answers: Answer[]; current?: AskedQuestion | null;
  ladder: Partial<Record<Vial, 0 | 1 | 2 | 3>>; ratings: Partial<Record<Letter, Rating>>; top2: Letter[]; pick?: Letter; sessionId?: string; result?: Result;
  smell: { intensity: SmellSequence; bases: SmellSequence }; surveyText: string;
  delivery: DeliveryState;
};

const STORAGE = "element-demo-v2";
const LETTERS: Letter[] = ["A", "B", "C", "D", "E", "F"];
const FAMILIES: Family[] = ["citrus", "green", "water", "floral", "woody", "amber"];
const LAST_SUB: Record<number, number> = { 3: 1, 4: 2, 6: 3 };
const SAMPLE_BLOT = { oil: 0.28, step: 2, clearArea: 0.14 };
const SAMPLE_PH = { skin: 5.3, control: 6.9, diff: -1.6, confidence: 0.72 };
const initial: State = { step: 0, sub: 0, mode: "sample", name: "", email: "", demoAccount: false, kitCode: "DEMO", adult: false, consent: false, setup: [false, false, false, false], prepared: { blot: [false, false, false], ph: [false, false] }, answers: [], ladder: {}, ratings: {}, top2: [], smell: { intensity: { index: 0 }, bases: { index: 0 } }, surveyText: "", delivery: emptyDelivery };
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// A sample reading stands in for the sample photo; an estimate substituted for a person's own failed photo is not theirs, so it never drives tuning or claims.
const usable = (r?: Reading) => (r && (r.sample || !r.estimated) ? r : undefined);

// Everything the tuning needs, derived from answers so a skipped step simply contributes nothing.
function derive(s: State) {
  const key = kitKey(s.kitCode || "DEMO");
  const ladderAnswers: LadderAnswer[] = (Object.entries(s.ladder) as [string, 0 | 1 | 2 | 3][]).map(([vial, strength]) => ({ vial: Number(vial) as Vial, smelled: strength > 0, strength }));
  const ladder = scoreLadder(ladderAnswers, key.vials);
  const likes: Partial<Record<Family, number>> = {};
  for (const letter of LETTERS) { const r = s.ratings[letter]; if (r?.like !== undefined) likes[BASES[key.letters[letter]].family] = r.like; }
  const nose = inferNose(likes, ladder.sensitivity);
  const tags = [...new Set(s.answers.flatMap((a) => a.tags))];
  const byLike = [...LETTERS].sort((a, b) => (s.ratings[b]?.like ?? 0) - (s.ratings[a]?.like ?? 0));
  const pick = s.pick ?? s.top2[0] ?? byLike[0];
  const base = key.letters[pick];
  const traits = { oil: usable(s.blot)?.blot?.oil, sensitivity: ladder.sensitivity, tags, muskQuiet: nose.muskQuiet, trust: ladder.trust };
  return { key, ladderAnswers, ladder, likes, nose, tags, pick, base, traits, byLike };
}

function localResult(s: State): Result {
  const d = derive(s);
  return { ...tune(d.base, d.traits), base: d.base, nose: d.nose, source: "local" };
}

// The chip label (already in the person's language) behind each tag they picked, so AI tags never show as bare slugs.
function chipLabels(answers: Answer[], locale: Locale) {
  const out: Record<string, string> = {};
  for (const a of answers) for (const c of a.q?.chips ?? []) if (a.chips.includes(c.id)) for (const tag of c.tags) out[tag] ??= c.label[locale];
  return out;
}

const RESULT_TIMEOUT = 8000;
let pendingResult: { key: string; promise: Promise<Result> } | null = null;
// Starts (or reuses) the result request for this exact state, so it can run while the building screen plays.
function requestResult(s: State, locale: Locale): Promise<Result> {
  const d = derive(s);
  const names = chipLabels(s.answers, locale);
  const tags = d.tags.filter((tag) => /^[a-z0-9-]{1,32}$/.test(tag)).slice(0, 40);
  const tagLabels = Object.fromEntries(tags.filter((tag) => names[tag] && !/[\p{Cc}<>]/u.test(names[tag])).map((tag) => [tag, names[tag].slice(0, 40)]));
  // pH is deliberately not sent: it is recorded with the photo, never a tuning input.
  const body = { sessionId: s.sessionId, locale, base: d.base, likes: d.likes, sensitivity: d.ladder.sensitivity, oil: d.traits.oil, trust: d.ladder.trust, tags, tagLabels };
  const key = JSON.stringify(body);
  if (pendingResult?.key !== key) pendingResult = { key, promise: callApi("result", body, RESULT_TIMEOUT).then((raw) => fromApi(raw, s, locale) ?? localResult(s)) };
  return pendingResult.promise;
}

// Accept the API result only when it has the shape we render; anything else falls back to local tuning.
function fromApi(raw: unknown, s: State, locale: Locale): Result | null {
  const r = raw as Partial<Result> & { explanations?: unknown; nose?: Partial<Nose> };
  if (!r || !r.base || !(r.base in BASES) || !Array.isArray(r.formula?.notes) || !Array.isArray(r.changes)) return null;
  const local = localResult(s);
  // Server shape: { lines: string[] (one per change), summary, closing, source: "ai" | "template" }. Only AI lines add
  // anything over our own templates, so templates are rebuilt locally (they then follow a language switch).
  const ex = (raw as { explanations?: { lines?: unknown; source?: unknown } }).explanations;
  const lines = ex?.source === "ai" && Array.isArray(ex.lines) && ex.lines.length === r.changes.length && ex.lines.every((x) => typeof x === "string") ? ex.lines as string[] : undefined;
  return {
    base: r.base, formula: r.formula as Formula, changes: r.changes, explanations: lines, explLocale: locale,
    concentration: r.concentration === "EDP" ? "EDP" : r.concentration === "EDT" ? "EDT" : local.concentration,
    projection: r.projection && ["close", "moderate", "carrying"].includes(r.projection) ? r.projection : local.projection,
    nose: r.nose?.name?.en && r.nose.filled ? r.nose as Nose : local.nose, shareId: typeof r.shareId === "string" ? r.shareId : undefined, resultId: typeof r.resultId === "string" ? r.resultId : undefined, source: "api",
  };
}

function normaliseQuestion(raw: unknown, n: number): AskedQuestion | null {
  const loc = (v: unknown): Localised | null => typeof v === "string" ? { en: v, "zh-Hant": v, "zh-Hans": v } : v && typeof (v as Localised).en === "string" ? v as Localised : null;
  const q = (raw as { question?: Record<string, unknown> } | null)?.question;
  if (!q) return null;
  const text = loc(q.text);
  const chips = Array.isArray(q.chips) ? q.chips.map((c: Record<string, unknown>, i: number) => ({ id: String(c.id ?? i), label: loc(c.label), tags: Array.isArray(c.tags) ? c.tags.filter((t): t is string => typeof t === "string") : [] })) : [];
  if (!text || chips.length < 2 || chips.some((c) => !c.label)) return null;
  return { id: typeof q.id === "string" ? q.id : `ai-${n}`, topic: (typeof q.topic === "string" ? q.topic : "memory") as Question["topic"], text, chips: chips as Question["chips"], source: q.source === "ai" || (raw as { kind?: string }).kind === "followup" ? "ai" : "bank" };
}

let layoutPromise: Promise<unknown> | null = null;
const lidLayout = () => (layoutPromise ??= fetch("/kit/lid-board.json").then((r) => r.json()).catch(() => null));

async function toCanvas(src: string) {
  const img = new Image();
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = src; });
  const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale); canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function useCountdown(seconds: number, running: boolean) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (!running) { setLeft(seconds); return; }
    const end = Date.now() + seconds * 1000;
    const id = setInterval(() => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000))), 250);
    return () => clearInterval(id);
  }, [seconds, running]);
  return left;
}

function useWallClock(deadline?: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    if (deadline === undefined || deadline <= Date.now()) return;
    const timer = window.setInterval(() => {
      update();
      if (Date.now() >= deadline) window.clearInterval(timer);
    }, 250);
    document.addEventListener("visibilitychange", update);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", update); };
  }, [deadline]);
  return now;
}

export default function DemoFlow() {
  const [locale, setLocale] = useLocale();
  const t = demoCopy[locale];
  const lab = labCopy[locale];
  const stepLabels = [...t.stepLabels, deliveryCopy[locale].step];
  const totalSteps = stepLabels.length;
  const [s, setS] = useState<State>(initial);
  const patch = (p: Partial<State> | ((prev: State) => Partial<State>)) => setS((prev) => ({ ...prev, ...(typeof p === "function" ? p(prev) : p) }));
  const [restored, setRestored] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [buildReady, setBuildReady] = useState([false, false, false, false]);
  const phTimerLeft = useCountdown(60, s.step === 4 && s.sub === 1);
  const smellNow = useWallClock(s.step === 6 ? (s.sub === 0 ? s.smell.intensity.deadline : s.sub === 1 ? s.smell.bases.deadline : undefined) : undefined);

  // iOS may reload the page after the camera closes, so the walkthrough survives a reload.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<State>;
        setS({ ...initial, ...saved, step: typeof saved.step === "number" && Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= 10 ? saved.step : 0, delivery: normaliseDelivery(saved.delivery), smell: { intensity: normaliseSequence(saved.smell?.intensity, 4), bases: normaliseSequence(saved.smell?.bases, 6) }, surveyText: typeof saved.surveyText === "string" ? saved.surveyText.slice(0, 500) : "", prepared: { blot: saved.prepared?.blot?.slice(0, 3) ?? initial.prepared.blot, ph: saved.prepared?.ph?.slice(0, 2) ?? initial.prepared.ph } });
      }
    } catch { /* start fresh */ }
    setRestored(true);
    loadOpenCv().catch(() => { /* readZone falls back to estimated readings */ });
    lidLayout();
  }, []);
  // A state gate keeps initial-render effects from overwriting the saved session before restoration renders.
  useEffect(() => { if (restored) try { sessionStorage.setItem(STORAGE, JSON.stringify(s)); } catch { /* storage full or blocked */ } }, [s, restored]);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) { moved.current = true; return; }
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [s.step, s.sub, s.smell.intensity.index, s.smell.bases.index]);

  const go = (step: number, sub = 0) => patch({ step, sub });
  const back = () => {
    if (s.step === 5 && s.answers.length && (s.sub === 0)) {
      const last = s.answers[s.answers.length - 1];
      setPicked(last.chips);
      return patch({ answers: s.answers.slice(0, -1), current: last.q, surveyText: last.answerText ?? "" });
    }
    if (s.step === 6 && s.sub <= 1) {
      const kind = s.sub === 0 ? "intensity" : "bases";
      if (s.smell[kind].index > 0) return patch({ smell: { ...s.smell, [kind]: previousInSequence(s.smell[kind]) } });
    }
    if (s.sub > 0) return go(s.step, s.sub - 1);
    if (s.step === 8) return go(6, LAST_SUB[6]);
    if (s.step > 0) go(s.step - 1, LAST_SUB[s.step - 1] ?? 0);
  };

  // Survey: ask the API for the next question (AI follow-ups), fall back to the local bank.
  const surveyCap = s.mode === "sample" ? 6 : 12;
  useEffect(() => {
    if (s.step !== 5 || s.current !== undefined) return;
    let alive = true;
    (async () => {
      // Server limits: 5 chips, 5 options and 8 tags per answer, 200 characters of text, 40 per label.
      // options and picked are the exact chip labels shown and chosen, so the AI can build on them and never repeat them.
      const labels = (chips: AskedQuestion["chips"]) => chips.slice(0, 5).map((c) => c.label[locale].slice(0, 40));
      const answered = s.answers.map(({ id, text, answerText, chips, tags, source, q }) => ({ id, text: text.slice(0, 200), answerText: answerText?.slice(0, 500), chips: chips.slice(0, 5), tags: tags.slice(0, 8), source,
        options: labels(q?.chips ?? []), picked: labels((q?.chips ?? []).filter((c) => chips.includes(c.id))) }));
      const state = { answered, aiFollowUps: answered.filter((a) => a.source === "ai").length };
      let next: AskedQuestion | null = null;
      if (answered.length < surveyCap) {
        next = normaliseQuestion(await callApi("survey", { sessionId: s.sessionId, locale, state }, 5500), answered.length);
        if (next && answered.some((a) => a.id === next!.id)) next = null;
        if (!next) { const bank = nextFromBank(state); next = bank ? { ...bank, source: "bank" } : null; }
      }
      if (alive) { setPicked([]); patch({ current: next }); }
    })();
    return () => { alive = false; };
  }, [s.step, s.current]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (q: AskedQuestion, chips: string[], extraTags: string[] = [], spokenText?: string) => {
    const tags = [...new Set([...q.chips.filter((c) => chips.includes(c.id)).flatMap((c) => c.tags), ...extraTags])];
    const answerText = [s.surveyText.trim(), spokenText?.trim()].filter(Boolean).join("\n").slice(0, 500);
    patch((prev) => ({ answers: [...prev.answers, { id: q.id, text: q.text[locale], ...(answerText ? { answerText } : {}), chips, tags, source: q.source, q }], current: undefined, surveyText: "" }));
  };

  const startSession = () => {
    callApi<{ sessionId?: string }>("session", { mode: s.mode === "kit" ? "kit" : "demo", kitCode: s.kitCode, firstName: s.name.trim(), locale, adult: s.adult, consent: s.consent }, 4000)
      .then((r) => { if (r?.sessionId) patch({ sessionId: r.sessionId }); });
  };


  let body: ReactNode, primary: Action | undefined, secondary: Action | undefined, note: string | undefined;
  const h1 = (text: string) => <h1 ref={heading} tabIndex={-1}>{text}</h1>;

  switch (s.step) {
    case 0:
      body = <>
        {h1(lab.title)}
        <p className="demo-lead">{lab.lead}</p>
        <LabStudy locale={locale} className="lab-welcome-study" />
        <fieldset className="demo-modes"><legend className="demo-label">{t.welcome.modeLabel}</legend>
          {(["sample", "kit"] as const).map((mode) => <label key={mode} className="demo-option">
            <input type="radio" name="mode" checked={s.mode === mode} onChange={() => patch({ mode, setup: [...initial.setup], prepared: { blot: [...initial.prepared.blot], ph: [...initial.prepared.ph] }, blot: undefined, ph: undefined, ladder: {}, ratings: {}, top2: [], pick: undefined, smell: { intensity: { index: 0 }, bases: { index: 0 } }, result: undefined })} />
            <span><strong>{mode === "sample" ? t.welcome.modeSample : t.welcome.modeKit}</strong><small>{mode === "sample" ? t.welcome.modeSampleHint : t.welcome.modeKitHint}</small></span>
          </label>)}
        </fieldset>
        {s.mode === "sample" && <p className="demo-context-note">{lab.sampleNote}</p>}
        <h2 className="demo-label">{t.welcome.measureTitle}</h2>
        <ol className="demo-measures">{t.welcome.measures.map(([name, text], i) => <li key={name}><span>{String(i + 1).padStart(2, "0")}</span><strong>{name}</strong><p>{text}</p></li>)}</ol>
      </>;
      primary = { label: t.welcome.start, onClick: () => go(1) };
      note = t.medical;
      break;
    case 1:
      body = <>
        {h1(t.you.title)}
        <label className="demo-field"><span>{t.you.name}</span><input value={s.name} onChange={(e) => patch({ name: e.target.value })} placeholder={t.you.namePlaceholder} autoComplete="given-name" maxLength={40} /></label>
        <div className="demo-field">
          <label htmlFor="demo-email">{t.you.email}</label>
          {s.demoAccount ? <p className="demo-chip demo-chip-on">{t.you.demoAccountOn}</p>
            : <input id="demo-email" type="email" inputMode="email" autoComplete="email" value={s.email} onChange={(e) => patch({ email: e.target.value })} aria-describedby="demo-email-hint" />}
          {!s.demoAccount && <small id="demo-email-hint">{t.you.emailHint}</small>}
          <button type="button" className="demo-link-button" aria-pressed={s.demoAccount} onClick={() => patch({ demoAccount: !s.demoAccount })}>{t.you.demoAccount}</button>
        </div>
        {s.mode === "kit" && <label className="demo-field"><span>{t.you.kitCode}</span><input value={s.kitCode} onChange={(e) => patch({ kitCode: e.target.value.toUpperCase() })} autoCapitalize="characters" maxLength={16} /></label>}
        <label className="demo-check"><input type="checkbox" checked={s.adult} onChange={(e) => patch({ adult: e.target.checked })} /><span>{t.you.adult}</span></label>
        <label className="demo-check"><input type="checkbox" checked={s.consent} onChange={(e) => patch({ consent: e.target.checked })} /><span>{t.you.consent} <a href="/privacy" target="_blank" rel="noopener">{t.you.privacy}</a></span></label>
      </>;
      primary = { label: t.continue, disabled: !s.adult || !s.consent, onClick: () => { startSession(); go(2); } };
      if (!s.adult || !s.consent) note = t.you.needConsent;
      break;
    case 2:
      body = <>
        {h1(t.setup.title)}
        <p className="demo-lead">{s.mode === "sample" ? lab.setupNote : t.setup.lead}</p>
        <CompletionNote count={s.setup.filter(Boolean).length} total={4} locale={locale} />
        <ul className="demo-checklist">{t.setup.items.map((item, i) => <li key={i}><label className="demo-check demo-check-row">
          <input type="checkbox" checked={s.setup[i]} onChange={(e) => patch({ setup: s.setup.map((v, j) => (j === i ? e.target.checked : v)) })} /><span>{item}</span>
        </label></li>)}</ul>
      </>;
      primary = { label: t.continue, disabled: !s.setup.every(Boolean), onClick: () => go(3) };
      if (!s.setup.every(Boolean)) note = lab.setupGate;
      break;
    case 3:
      if (s.sub === 0) {
        body = <>{h1(t.blot.title)}<Tutorial kind="blot" locale={locale} /><Steps items={t.blot.steps} checked={s.mode === "kit" ? s.prepared.blot : undefined} onChange={(checked) => patch({ prepared: { ...s.prepared, blot: checked } })} /><BoardReference zone="blot" locale={locale} /></>;
        primary = { label: s.mode === "sample" ? lab.sampleContinue : t.blot.ready, disabled: s.mode === "kit" && !s.prepared.blot.every(Boolean), onClick: () => go(3, 1) };
        note = s.mode === "sample" ? lab.sampleNote : !s.prepared.blot.every(Boolean) ? lab.preparationGate : undefined;
      } else {
        body = <>{h1(t.blot.title)}<Capture zone="blot" t={t} locale={locale} mode={s.mode} reading={s.blot} sessionId={s.sessionId} onReading={(r) => patch((prev) => ({ blot: r && prev.blot && r.image === prev.blot.image ? { ...prev.blot, ...r } : r }))} hint={t.blot.frameHint} /></>;
        primary = { label: t.continue, disabled: !usable(s.blot)?.blot, onClick: () => go(4) };
        if (!usable(s.blot)?.blot) { secondary = { label: t.skipStep, onClick: () => go(4) }; note = lab.photoGate; }
      }
      break;
    case 4:
      if (s.sub === 0) {
        body = <>{h1(t.ph.title)}<Tutorial kind="ph" locale={locale} /><Steps items={t.ph.steps} checked={s.mode === "kit" ? s.prepared.ph : undefined} onChange={(checked) => patch({ prepared: { ...s.prepared, ph: checked } })} /><BoardReference zone="ph" locale={locale} /></>;
        primary = s.mode === "sample" ? { label: lab.sampleContinue, onClick: () => go(4, 2) } : { label: t.ph.startTimer, disabled: !s.prepared.ph.every(Boolean), onClick: () => go(4, 1) };
        if (s.mode === "kit") secondary = { label: t.ph.skipTimer, disabled: !s.prepared.ph.every(Boolean), onClick: () => go(4, 2) };
        note = s.mode === "sample" ? lab.sampleNote : !s.prepared.ph.every(Boolean) ? lab.preparationGate : undefined;
      } else if (s.sub === 1) {
        body = <Timer seconds={60} left={phTimerLeft} unit={t.seconds} title={t.ph.timerTitle} hint={t.ph.timerHint} done={t.ph.timerDone} heading={heading} />;
        primary = { label: t.continue, disabled: phTimerLeft > 0, onClick: () => go(4, 2) };
        if (phTimerLeft > 0) note = lab.timerGate;
      } else {
        body = <>{h1(t.ph.photoTitle)}<Capture zone="ph" t={t} locale={locale} mode={s.mode} reading={s.ph} sessionId={s.sessionId} onReading={(r) => patch((prev) => ({ ph: r && prev.ph && r.image === prev.ph.image ? { ...prev.ph, ...r } : r }))} hint={t.ph.frameHint} /></>;
        primary = { label: t.continue, disabled: !usable(s.ph)?.ph, onClick: () => go(5) };
        if (!usable(s.ph)?.ph) { secondary = { label: t.skipStep, onClick: () => go(5) }; note = lab.photoGate; }
      }
      break;
    case 5: {
      const q = s.current;
      if (q === undefined) {
        body = <>{h1(t.survey.title)}<InlineProcessing locale={locale} kind="question" /></>;
      } else if (q === null) {
        const tags = [...new Set(s.answers.flatMap((a) => a.tags))];
        const typed = s.answers.map((a) => a.answerText?.trim()).filter((x): x is string => !!x);
        body = <>{h1(t.survey.title)}<p className="demo-label">{t.survey.tags}</p><TagList tags={tags} locale={locale} names={chipLabels(s.answers, locale)} />
          {typed.length > 0 && <><p className="demo-label">{t.survey.typed}</p><ul className="demo-tags">{typed.map((x, i) => <li key={i}>{x}</li>)}</ul></>}</>;
        primary = { label: t.continue, onClick: () => go(6) };
      } else {
        body = <Survey key={q.id} q={q} n={s.answers.length + 1} t={t} locale={locale} picked={picked} setPicked={setPicked} answerText={s.surveyText} onText={(surveyText) => patch({ surveyText })} heading={heading} sessionId={s.sessionId}
          onVoice={(tags, text) => answer(q, picked, tags, text)} />;
        primary = { label: picked.length || s.surveyText.trim() ? t.survey.next : t.survey.skipQuestion, onClick: () => answer(q, picked) };
        secondary = { label: t.survey.skipRest, onClick: () => patch({ current: null }) };
      }
      break;
    }
    case 6:
      ({ body, primary, secondary, note } = smellStep(s, t, locale, patch, go, heading, smellNow));
      break;
    case 7:
      body = <Building s={s} t={t} locale={locale} heading={heading} onResult={(result) => patch({ result })} onProgress={setBuildReady} />;
      primary = { label: t.building.see, disabled: !s.result, onClick: () => go(8) };
      break;
    case 8: {
      const r = s.result ?? localResult(s);
      const d = derive(s);
      body = <ResultView r={r} t={t} locale={locale} mode={s.mode} pick={d.pick} ph={usable(s.ph)} blot={usable(s.blot)} sensitivity={d.ladder.sensitivity} heading={heading} />;
      primary = { label: t.result.shareCard, onClick: () => go(9) };
      break;
    }
    case 10: {
      const r = s.result ?? localResult(s);
      body = <DeliveryPreview locale={locale} baseName={BASES[r.base].name[locale]} concentration={r.concentration} value={s.delivery} onChange={delivery => patch({ delivery })} heading={heading} />;
      secondary = { label: t.back, onClick: () => go(9) };
      break;
    }
    default: {
      const r = s.result ?? localResult(s);
      body = <ShareExperience r={r} s={s} t={t} locale={locale} heading={heading} />;
      primary = { label: deliveryCopy[locale].continueDelivery, onClick: () => go(10) };
      secondary = { label: t.share.restart, onClick: () => { setPicked([]); setS({ ...initial, mode: s.mode }); } };
    }
  }

  return <div className="demo-shell">
    <a className="skip-link" href="#demo-content">{t.skip}</a>
    <SiteHeader locale={locale} onLocaleChange={setLocale} subpage brand="element" />
    <main className="demo" id="demo-content">
      <ol className="demo-rail" aria-label={t.stepOf(s.step + 1, totalSteps)}>{stepLabels.map((label, i) => <li key={i} aria-current={i === s.step ? "step" : undefined} className={i === s.step ? "is-current" : i < s.step ? "is-done" : ""}><span>{i < s.step ? <Tick /> : String(i + 1).padStart(2, "0")}</span>{label}</li>)}</ol>
      <div className="demo-column">
        <div className="demo-bar">
          <button type="button" className="demo-back" onClick={back} disabled={s.step === 0 && s.sub === 0} aria-label={t.back}>
            <svg aria-hidden="true" width="18" height="14" viewBox="0 0 18 14"><path d="M7 1 1 7l6 6M1 7h16" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
          </button>
          <p><span>{stepLabels[s.step]}</span><span className="demo-count">{t.stepOf(s.step + 1, totalSteps)}</span></p>
          <div className="demo-progress" role="progressbar" aria-label={t.stepOf(s.step + 1, totalSteps)} aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={s.step + 1}><span style={{ transform: `scaleX(${(s.step + 1) / totalSteps})` }} /></div>
        </div>
        <section className="demo-screen" key={`${s.step}-${s.sub}`}>{body}</section>
        <div className="demo-actions">
          {note && <p className="demo-note" id="demo-action-hint" role="status">{note}</p>}
          {primary && (primary.href ? <a className="demo-primary" href={primary.href}>{primary.label}</a>
            : <button type="button" className="demo-primary" onClick={primary.onClick} disabled={primary.disabled} aria-describedby={note ? "demo-action-hint" : undefined}>{primary.label}</button>)}
          {secondary && <button type="button" className="demo-secondary" onClick={secondary.onClick} disabled={secondary.disabled}>{secondary.label}</button>}
        </div>
      </div>
      <Bench s={s} t={t} locale={locale} picked={picked} buildReady={buildReady} />
    </main>
  </div>;
}

function Steps({ items, checked, onChange }: { items: string[]; checked?: boolean[]; onChange?: (checked: boolean[]) => void }) {
  return <ol className="demo-steps">{items.map((item, i) => <li key={i}><span>{i + 1}</span>{checked && i < checked.length && onChange ? <label className="demo-check"><input type="checkbox" checked={checked[i]} onChange={(e) => onChange(checked.map((v, j) => j === i ? e.target.checked : v))} />{item}</label> : <p>{item}</p>}</li>)}</ol>;
}

function CompletionNote({ count, total, locale }: { count: number; total: number; locale: Locale }) {
  return <p className={`demo-completion ${count === total ? "is-complete" : ""}`} role="status">{count === total && <Tick />}{labCopy[locale].selection(count, total)}</p>;
}

function Tutorial({ kind, locale }: { kind: "blot" | "ph" | "scent"; locale: Locale }) {
  const lab = labCopy[locale];
  const caption = kind === "blot" ? lab.blotTutorial : kind === "ph" ? lab.phTutorial : lab.scentTutorial;
  return <details className="demo-tutorial"><summary>{lab.tutorial}<span>{caption}</span></summary><div>
    <video controls playsInline preload="none" poster={`/media/demo-tutorial-${kind}.webp`} aria-label={caption}>
      <source src={`/media/demo-tutorial-${kind}.mp4`} type="video/mp4" />
      <track kind="captions" src={`/media/demo-tutorial-${kind}-${locale}.vtt`} srcLang={locale} label={locale === "en" ? "English" : locale === "zh-Hant" ? "繁體中文" : "简体中文"} default />
    </video><p>{lab.tutorialNote}</p>
  </div></details>;
}

function BoardReference({ zone, locale }: { zone: Zone; locale: Locale }) {
  const lab = labCopy[locale];
  return <figure className={`demo-board-reference demo-board-reference-${zone}`}>
    <img src="/media/element-final-board.webp" width="1543" height="1254" alt={lab.referenceAlt} loading="lazy" />
    <figcaption><strong>{lab.reference}</strong><span>{lab.referenceNote}</span></figcaption>
  </figure>;
}

// Schematic of the lid zone so people know what to aim at before the camera opens.
// The server takes the straightened zone as a JPEG of at most 1024 px on the long side and under 1.5 MB.
const shots: Record<Zone, number> = { blot: 0, ph: 0 };
async function uploadZone(warped: HTMLCanvasElement, sessionId: string, zone: Zone, readings: Record<string, number>) {
  const scale = Math.min(1, 1024 / Math.max(warped.width, warped.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(warped.width * scale); canvas.height = Math.round(warped.height * scale);
  canvas.getContext("2d")!.drawImage(warped, 0, 0, canvas.width, canvas.height);
  let blob: Blob | null = null;
  for (const quality of [0.85, 0.7, 0.5]) {
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size < 1.5 * 1024 * 1024) break;
  }
  if (!blob || blob.size >= 1.5 * 1024 * 1024) return null;
  const form = new FormData();
  form.append("photo", blob, `${zone}.jpg`);
  form.append("sessionId", sessionId);
  form.append("zone", zone);
  form.append("n", String((shots[zone] = Math.min(9, shots[zone] + 1))));
  form.append("readings", JSON.stringify(readings));
  return callApi<{ flags?: string[] }>("photo", form, 6000);
}

function DemoPhoto({ src, className = "" }: { src: string; className?: string }) {
  return <div className={`demo-photo-landscape ${className}`}>
    <img src={src} className={src === "/kit/sample/blot.webp" ? "is-portrait-original" : undefined} alt="" loading="lazy" />
  </div>;
}

function Capture({ zone, t, locale, mode, reading, onReading, hint, sessionId }: { zone: Zone; t: Copy; locale: Locale; mode: State["mode"]; reading?: Reading; onReading: (r: Reading | undefined) => void; hint: string; sessionId?: string }) {
  const [status, setStatus] = useState<"idle" | "reading" | "retake">("idle");
  const [problem, setProblem] = useState<string>();
  const [preview, setPreview] = useState<string>();
  const [phase, setPhase] = useState(0);
  const [readSample, setReadSample] = useState(mode === "sample");
  const input = useRef<HTMLInputElement>(null);
  const photoUrl = useRef<string | undefined>(undefined);
  const readGeneration = useRef(0);
  useEffect(() => () => {
    readGeneration.current += 1;
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
  }, []);

  async function read(src: string, sample: boolean) {
    const generation = ++readGeneration.current;
    onReading(undefined);
    setStatus("reading"); setProblem(undefined); setPreview(src); setPhase(0); setReadSample(sample);
    let result: ZoneResult | null = null;
    try {
      const canvas = await toCanvas(src);
      if (generation !== readGeneration.current) return;
      setPhase(1);
      // ponytail: a fixed 6 s budget for OpenCV load + read; tune if real phones need longer.
      result = await Promise.race([loadOpenCv().then(async () => {
        if (generation !== readGeneration.current) return null;
        setPhase(2);
        return readZone(canvas, zone, await lidLayout());
      }), wait(6000).then(() => null)]);
    } catch { result = null; }
    if (generation !== readGeneration.current) return;
    if (!result && !sample) {
      setStatus("retake"); setProblem(t.retake.timeout);
      return;
    }
    // A judge's own photo gets a retake message; the sample photo always continues (with estimated values if unread).
    if (result && !result.ok && !sample) {
      setStatus("retake"); setProblem(t.retake[result.reason]);
      return;
    }
    if (result && !result.ok) result = null;
    const image = result?.ok ? result.warped.toDataURL("image/jpeg", 0.82) : src.startsWith("blob:") ? undefined : src;
    // The sample photo always shows a clear pH; a low-confidence read of it falls back to the known sample values.
    const weakSamplePh = sample && zone === "ph" && result?.ok && (result.ph?.confidence ?? 0) < 0.4;
    const next: Reading = result?.ok
      ? weakSamplePh ? { sample, estimated: true, image, flags: result.flags, ph: SAMPLE_PH } : { sample, estimated: false, image, flags: result.flags, blot: result.blot, ph: result.ph }
      : { sample, estimated: true, image, flags: [], ...(zone === "blot" ? { blot: SAMPLE_BLOT } : { ph: SAMPLE_PH }) };
    setStatus("idle");
    onReading(next);
    // Store the straightened photo and run the server vision check; extra flags arrive later if the API answers.
    if (result?.ok && sessionId) uploadZone(result.warped, sessionId, zone, next.blot ?? next.ph ?? {})
      .then((r) => { if (generation === readGeneration.current && r?.flags?.length) onReading({ ...next, flags: [...new Set([...next.flags, ...r.flags])] }); });
  }

  const shown = status === "idle" && reading ? reading.image : preview;
  const sampleFirst = mode === "sample";
  const quiet = !!reading;
  const take = <label className={sampleFirst || quiet ? "demo-secondary" : "demo-primary demo-inline"} aria-disabled={status === "reading"}>
    <input ref={input} disabled={status === "reading"} className="demo-hidden-input" type="file" accept="image/*" capture="environment" onChange={(e) => {
      const file = e.target.files?.[0]; e.target.value = "";
      if (file) {
        if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
        photoUrl.current = URL.createObjectURL(file);
        read(photoUrl.current, false);
      }
    }} />{reading || status === "retake" ? t.blot.retakePhoto : t.blot.takePhoto}
  </label>;
  const useSample = <button type="button" disabled={status === "reading"} className={sampleFirst && !quiet ? "demo-primary demo-inline" : "demo-secondary"} onClick={() => read(`/kit/sample/${zone}.webp`, true)}>{t.blot.useSample}</button>;

  return <div className="demo-capture">
    <div className={`demo-frame demo-frame-${zone} ${status === "reading" ? "is-reading" : ""}`}>
      {shown ? <DemoPhoto src={shown} /> : <div className="demo-photo-empty"><svg aria-hidden="true" width="48" height="40" viewBox="0 0 48 40"><path d="M4 9h10l4-6h12l4 6h10v28H4Z" fill="none" stroke="currentColor" strokeWidth="1.5" /><circle cx="24" cy="23" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg><p>{labCopy[locale].photoGate}</p></div>}
      <span className="demo-frame-corners" aria-hidden="true" />
    </div>
    <p className="demo-hint">{hint}</p>
    {(reading?.sample || (status === "reading" && readSample)) && <p className="demo-muted">{sequentialCopy[locale].olderPhoto}</p>}
    <div role="status" aria-live="polite">
      {status === "reading" && <PhotoProcessing locale={locale} phase={phase} sample={readSample} />}
      {status === "retake" && <p className="demo-problem">{problem}</p>}
      {status === "idle" && reading && <ReadingChip zone={zone} r={reading} t={t} locale={locale} problem={problem} />}
    </div>
    <div className="demo-capture-actions">{sampleFirst ? <>{useSample}{take}</> : <>{take}{useSample}</>}</div>
  </div>;
}

function ReadingChip({ zone, r, t, locale, problem }: { zone: Zone; r: Reading; t: Copy; locale: Locale; problem?: string }) {
  // The sample photo's stand-in values (e.g. its faint pH strips) are labelled Sample, never as an error or estimate.
  const badge = r.sample ? t.sample : r.estimated ? t.estimated : null;
  return <div className="demo-reading">
    {problem && <p className="demo-problem">{problem}</p>}
    <p className="demo-reading-head">{!r.estimated && <><Tick />{t.blot.corners}</>}{badge && <span className="demo-badge">{badge}</span>}</p>
    {zone === "blot" && r.blot && <>
      <p className="demo-reading-value">{t.blot.oil(r.blot.step)}</p>
      <div className="demo-scale" aria-hidden="true">{[1, 2, 3, 4, 5, 6].map((i) => <span key={i} className={i <= r.blot!.step ? "on" : ""} />)}</div>
      <p>{t.blot.clear(Math.round(r.blot.clearArea * 100))}</p>
      <p className="demo-muted">{r.blot.oil < 0.35 ? t.blot.oilMeaning.low : r.blot.oil > 0.65 ? t.blot.oilMeaning.high : t.blot.oilMeaning.mid}</p>
    </>}
    {zone === "ph" && r.ph && <>
      <dl className="demo-ph">
        <div><dt>{t.ph.skin}</dt><dd>{r.ph.skin.toFixed(1)}</dd></div>
        <div><dt>{t.ph.control}</dt><dd>{r.ph.control.toFixed(1)}</dd></div>
        <div><dt>{t.ph.diff}</dt><dd>{r.ph.diff > 0 ? "+" : ""}{r.ph.diff.toFixed(1)}</dd></div>
      </dl>
      {/* A stand-in value was not read from this photo, so it carries no read confidence. */}
      {!r.estimated && <p>{t.ph.confidence(Math.round(r.ph.confidence * 100))}</p>}
      <p className="demo-muted">{t.ph.note}</p>
    </>}
    {/* Quality chips are about the person's own photo; the built-in sample is known good, so it never shows them. */}
    {!r.sample && r.flags.length > 0 && <TagList tags={r.flags} locale={locale} />}
  </div>;
}

// Numbered source markers. Numbers follow first appearance on the screen; one source keeps one number.
type CiteId = (typeof CITES)[keyof typeof CITES];
function citer(t: Copy) {
  const order: CiteId[] = [];
  return (id: CiteId) => {
    if (!order.includes(id)) order.push(id);
    const n = order.indexOf(id) + 1;
    return <a className="demo-cite" href={`/element/research#${id}`} target="_blank" rel="noopener" aria-label={t.cite(n)}>{n}</a>;
  };
}

const Tick = () => <svg aria-hidden="true" width="14" height="12" viewBox="0 0 14 12"><path d="m2 6 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>;
const TagList = ({ tags, locale, names }: { tags: string[]; locale: Locale; names?: Record<string, string> }) =>
  <ul className="demo-tags">{tags.map((tag) => <li key={tag}>{tagLabel(tag, locale, names?.[tag])}</li>)}</ul>;

function Timer({ seconds, left, unit, title, hint, done, heading }: { seconds: number; left: number; unit: string; title: string; hint: string; done: string; heading: RefObject<HTMLHeadingElement | null> }) {
  const r = 88, c = 2 * Math.PI * r;
  return <div className="demo-timer">
    <h1 ref={heading} tabIndex={-1}>{title}</h1>
    <div className="demo-ring">
      <svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r={r} className="demo-ring-track" /><circle cx="100" cy="100" r={r} className="demo-ring-fill" strokeDasharray={c} strokeDashoffset={c * (left / seconds)} /></svg>
      <p className="demo-ring-time" role="timer" aria-live="off">{left}<small>{unit}</small></p>
    </div>
    <p className="demo-lead" role="status">{left === 0 ? done : hint}</p>
  </div>;
}

function Survey({ q, n, t, locale, picked, setPicked, answerText, onText, heading, onVoice, sessionId }: { q: AskedQuestion; n: number; t: Copy; locale: Locale; picked: string[]; setPicked: (p: string[]) => void; answerText: string; onText: (text: string) => void; heading: RefObject<HTMLHeadingElement | null>; onVoice: (tags: string[], text?: string) => void; sessionId?: string }) {
  const words = sequentialCopy[locale];
  const chosen = q.chips.filter((c) => picked.includes(c.id));
  const tags = [...new Set(chosen.flatMap((c) => c.tags))];
  const names: Record<string, string> = {};
  for (const c of chosen) for (const tag of c.tags) names[tag] ??= c.label[locale];
  return <>
    <p className="demo-eyebrow">{t.survey.counter(n)}{q.source === "ai" && <span className="demo-badge">{t.survey.followUp}</span>}</p>
    <h1 ref={heading} tabIndex={-1}>{q.text[locale]}</h1>
    <p className="demo-muted">{t.survey.lead}</p>
    <div className="demo-chips" role="group" aria-label={q.text[locale]}>
      {q.chips.map((c) => <button type="button" key={c.id} aria-pressed={picked.includes(c.id)} onClick={() => setPicked(picked.includes(c.id) ? picked.filter((x) => x !== c.id) : [...picked, c.id])}>{c.label[locale]}</button>)}
    </div>
    <label className="demo-field demo-typed-answer">
      <span>{words.textLabel}</span>
      <textarea rows={3} maxLength={500} value={answerText} onChange={(event) => onText(event.target.value)} placeholder={words.textPlaceholder} aria-describedby="demo-typed-hint" />
      <small id="demo-typed-hint">{words.textHint}</small>
    </label>
    <div className="demo-tag-area" aria-live="polite">{tags.length > 0 && <><p className="demo-label">{t.survey.tags}</p><TagList tags={tags} locale={locale} names={names} /></>}</div>
    <Voice t={t} locale={locale} questionId={q.id} sessionId={sessionId} onAnswer={onVoice} />
  </>;
}

function Voice({ t, locale, questionId, sessionId, onAnswer }: { t: Copy; locale: Locale; questionId: string; sessionId?: string; onAnswer: (tags: string[], text?: string) => void }) {
  const [state, setState] = useState<"idle" | "listening" | "working" | "fail">("idle");
  const recorder = useRef<MediaRecorder | null>(null);
  useEffect(() => () => recorder.current?.stream.getTracks().forEach((track) => track.stop()), []);
  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream), chunks: Blob[] = [];
      recorder.current = rec;
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setState("working");
        const blob = new Blob(chunks, { type: rec.mimeType });
        const form = new FormData();
        form.append("audio", blob, "answer.webm");
        form.append("locale", locale);
        form.append("questionId", questionId);
        if (sessionId) form.append("sessionId", sessionId);
        const r = await callApi<{ tags?: string[]; text?: string }>("voice", form, 8000);
        if (r?.tags?.length || r?.text?.trim()) { setState("idle"); onAnswer(r.tags ?? [], r.text); } else setState("fail");
      };
      rec.start();
      setState("listening");
      setTimeout(() => { if (rec.state === "recording") rec.stop(); }, 8000);
    } catch { setState("fail"); }
  }
  return <div className="demo-voice">
    <button type="button" className="demo-mic" aria-pressed={state === "listening"} disabled={state === "working"} onClick={() => (state === "listening" ? recorder.current?.stop() : start())}>
      <svg aria-hidden="true" width="14" height="18" viewBox="0 0 14 18"><rect x="4" y="1" width="6" height="10" rx="3" fill="none" stroke="currentColor" /><path d="M1 8a6 6 0 0 0 12 0M7 14v3" fill="none" stroke="currentColor" /></svg>
      {state === "listening" ? t.survey.voiceStop : t.survey.voice}
    </button>
    <p className="demo-muted" role="status">{state === "listening" ? t.survey.voiceListening : state === "working" ? t.survey.voiceWorking : state === "fail" ? t.survey.voiceFail : ""}</p>
  </div>;
}

function smellStep(s: State, t: Copy, locale: Locale, patch: (p: Partial<State>) => void, go: (step: number, sub?: number) => void, heading: RefObject<HTMLHeadingElement | null>, now: number): { body: ReactNode; primary: Action; secondary?: Action; note?: string } {
  const lab = labCopy[locale];
  const words = sequentialCopy[locale];
  const h1 = (text: string) => <h1 ref={heading} tabIndex={-1}>{text}</h1>;
  const byLike = derive(s).byLike;
  const vials: Vial[] = [1, 2, 3, 4];
  const intensityRow = (vial: Vial, current = false) => <div className={current ? "demo-smell-current" : "demo-smell-history-row"} key={vial} role="group" aria-label={t.smell.vial(vial)}>
    <DemoVial label={String(vial)} active={ladderAnswerComplete(s.ladder[vial])} size={current ? "large" : "small"} />
    <div className="demo-smell-response"><p className="demo-label">{t.smell.vial(vial)}</p>
      <div className="demo-segments">{t.smell.levels.map((label, level) => <button type="button" key={level} aria-pressed={s.ladder[vial] === level}
        onClick={() => patch({ ladder: { ...s.ladder, [vial]: level as 0 | 1 | 2 | 3 }, result: undefined })}>{label}</button>)}</div>
    </div>
  </div>;
  const baseRow = (letter: Letter, current = false) => {
    const r = s.ratings[letter];
    const set = (key: keyof Rating, value: number) => patch({ ratings: { ...s.ratings, [letter]: { ...r, [key]: value } }, top2: [], pick: undefined, result: undefined });
    return <div className={current ? "demo-smell-current" : "demo-smell-history-row"} key={letter}>
      <DemoVial label={letter} active={ratingComplete(r)} size={current ? "large" : "small"} />
      <div className="demo-smell-response"><p className="demo-label">{words.baseLabel(letter)}</p>
        {(["like", "strength"] as const).map((k) => <fieldset key={k} className="demo-rating">
          <legend>{k === "like" ? t.smell.like : t.smell.strength}<output>{r?.[k] ?? "-"}</output></legend>
          <div>{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={lab.ratingLabel(letter, k === "like" ? t.smell.like : t.smell.strength, value)} aria-pressed={r?.[k] === value} onClick={() => set(k, value)}>{value}</button>)}</div>
          <small><span>{(k === "like" ? t.smell.likeEnds : t.smell.strengthEnds)[0]}</span><span>{(k === "like" ? t.smell.likeEnds : t.smell.strengthEnds)[1]}</span></small>
        </fieldset>)}
      </div>
    </div>;
  };
  if (s.sub <= 1) {
    const intensity = s.sub === 0;
    const kind = intensity ? "intensity" : "bases";
    const sequence = s.smell[kind];
    const count = intensity ? vials.length : LETTERS.length;
    const current = Math.min(sequence.index, count - 1);
    const answered = intensity ? vials.map(v => ladderAnswerComplete(s.ladder[v])) : LETTERS.map(letter => ratingComplete(s.ratings[letter]));
    const left = gapSeconds(sequence, now);
    const canContinue = canAdvanceSequence(sequence, answered, now);
    const label = intensity ? t.smell.vial(vials[current]) : words.baseLabel(LETTERS[current]);
    const title = left > 0
      ? intensity ? words.pauseVial(vials[current]) : words.pauseBase(LETTERS[current])
      : intensity ? words.smellVial(vials[current]) : words.smellBase(LETTERS[current]);
    const previous = intensity ? vials.slice(0, current).map(vial => <details className="demo-smell-history-item" key={vial}>
      <summary><span>{t.smell.vial(vial)}</span><strong>{s.ladder[vial] === undefined ? "–" : t.smell.levels[s.ladder[vial]!]}</strong><span className="demo-smell-edit">{words.edit}</span></summary>
      {intensityRow(vial)}
    </details>) : LETTERS.slice(0, current).map(letter => <details className="demo-smell-history-item" key={letter}>
      <summary><span>{words.baseLabel(letter)}</span><strong>{t.smell.like} {s.ratings[letter]?.like ?? "–"}/5 · {t.smell.strength} {s.ratings[letter]?.strength ?? "–"}/5</strong><span className="demo-smell-edit">{words.edit}</span></summary>
      {baseRow(letter)}
    </details>);
    return {
      body: <>
        {h1(title)}
        <p className="demo-lead">{left > 0 ? words.pauseLead : intensity ? words.intensityLead : words.baseLead}</p>
        {s.mode === "sample" && <p className="demo-context-note">{words.sampleNote}</p>}
        {!intensity && <Tutorial kind="scent" locale={locale} />}
        <CompletionNote count={answered.filter(Boolean).length} total={count} locale={locale} />
        <div className="demo-smell-sequence">
          <p className="demo-label">{words.current(current + 1, count)}</p>
          {left > 0 ? <div className="demo-smell-gap">
            <div className="demo-smell-timer" role="timer" aria-live="off"><strong>{left}</strong><span>{t.seconds}</span></div>
            <div><h2>{words.gapTitle}</h2><p>{words.gapLead}</p><small>{words.next(label)}</small></div>
          </div> : intensity ? intensityRow(vials[current], true) : baseRow(LETTERS[current], true)}
          {previous.length > 0 && <div className="demo-smell-history"><p className="demo-label">{words.previous(previous.length)}</p><div className="demo-smell-history-list">{previous}</div></div>}
        </div>
      </>,
      primary: {
        label: current === count - 1 ? t.continue : intensity ? words.nextVial : words.nextBase,
        disabled: !canContinue,
        onClick: () => {
          const next = advanceSequence(sequence, answered, intensity ? INTENSITY_PAUSE_SECONDS : BASE_PAUSE_SECONDS, Date.now());
          patch({ smell: { ...s.smell, [kind]: next.index === count ? { index: count - 1 } : next } });
          if (next.index === count) go(6, s.sub + 1);
        },
      },
      secondary: s.mode === "sample" && left > 0 ? { label: words.skipPause, onClick: () => patch({ smell: { ...s.smell, [kind]: skipDemoGap(sequence, s.mode, Date.now()) } }) } : undefined,
      note: left > 0 ? words.gapGate(left) : !canContinue ? intensity ? words.intensityGate : words.baseGate : undefined,
    };
  }
  switch (s.sub) {
    case 2: return {
      body: <>
        {h1(t.smell.top2Title)}
        <p className="demo-lead">{t.smell.top2Lead}</p>
        <p className="demo-completion" role="status">{lab.topSelection(s.top2.length)}</p>
        <div className="demo-picks demo-vial-picks">{byLike.map((letter) => <button type="button" key={letter} aria-pressed={s.top2.includes(letter)}
          onClick={() => patch({ top2: s.top2.includes(letter) ? s.top2.filter((x) => x !== letter) : [...s.top2, letter].slice(-2), pick: undefined })}>
          <DemoVial label={letter} active={s.top2.includes(letter)} size="small" /><span className="demo-pick-label">{words.baseLabel(letter)}</span><small>{s.ratings[letter]?.like !== undefined ? `${t.smell.like} ${s.ratings[letter]!.like}/5` : ""}</small>
        </button>)}</div>
      </>,
      primary: { label: t.continue, disabled: !pairComplete(s.top2) || !ratingsComplete(LETTERS, s.ratings), onClick: () => go(6, 3) },
      note: !pairComplete(s.top2) ? lab.topGate : undefined,
    };
    default: {
      const pair = s.top2;
      return {
        body: <>
          {h1(t.smell.finalTitle)}
          <p className="demo-lead">{t.smell.finalLead}</p>
          <div className="demo-picks demo-final demo-vial-picks">{pair.map((letter) => <button type="button" key={letter} aria-pressed={s.pick === letter} onClick={() => patch({ pick: letter })}>
            <DemoVial label={letter} active={s.pick === letter} size="small" /><span className="demo-pick-label">{words.baseLabel(letter)}</span><small>{t.smell.choose}</small>
          </button>)}</div>
        </>,
        // The result request starts here, so the model works while the building screen plays.
        primary: { label: t.continue, disabled: !s.pick || !pairComplete(pair) || !pair.includes(s.pick) || !ratingsComplete(LETTERS, s.ratings) || !ladderComplete(s.ladder), onClick: () => { requestResult(s, locale); patch({ result: undefined }); go(7); } },
        note: !s.pick ? lab.finalGate : undefined,
      };
    }
  }
}

function Building({ s, t, locale, heading, onResult, onProgress }: { s: State; t: Copy; locale: Locale; heading: RefObject<HTMLHeadingElement | null>; onResult: (r: Result) => void; onProgress: (ready: boolean[]) => void }) {
  const [ready, setReady] = useState([false, false, false, false]);
  useEffect(() => onProgress(ready), [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const d = derive(s);
  useEffect(() => {
    let alive = true;
    const mark = (i: number) => alive && setReady((r) => r.map((v, j) => (j === i ? true : v)));
    const timers = [700, 1400, 2100].map((ms, i) => setTimeout(() => mark(i), ms));
    const started = Date.now();
    (async () => {
      // Usually already in flight since the final pick. Finish as soon as it lands, after at least 3 s of staged
      // progress, and never wait longer than the API timeout + 1 s (the local tuning stands in).
      const result = await Promise.race([requestResult(s, locale), wait(RESULT_TIMEOUT + 1000).then(() => localResult(s))]);
      await wait(Math.max(0, 3000 - (Date.now() - started)));
      if (!alive) return;
      onResult(result);
      mark(3);
    })();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const blot = usable(s.blot)?.blot, ph = usable(s.ph)?.ph;
  const names = chipLabels(s.answers, locale);
  const details = [
    [blot ? t.blot.oil(blot.step) : null, ph ? `pH ${ph.skin.toFixed(1)}` : null].filter(Boolean).join(" · ") || null,
    d.nose.name[locale],
    BASES[d.base].name[locale],
    d.tags.length ? d.tags.map((tag) => tagLabel(tag, locale, names[tag])).join(" · ") : null,
  ];
  // Sources behind each bar, numbered in bar order so the numbers never shift as bars fill.
  const cite = citer(t);
  const sources: CiteId[][] = [[...(blot ? [CITES.skin] : []), ...(ph ? [CITES.ph] : [])], [CITES.nose, ...(Object.keys(s.ladder).length ? [CITES.sensitivity] : [])], [], []];
  const marks = sources.map((ids) => ids.map((id) => <span key={id}>{cite(id)}</span>));
  const all = ready.every(Boolean);
  return <>
    <h1 ref={heading} tabIndex={-1}>{t.building.title}</h1>
    <FormulaProcessing locale={locale} ready={ready} base={BASES[d.base].name[locale]} details={details} ai={!!s.result?.explanations?.length} />
    <p className="demo-muted">{marks.flat()}</p>
    <p className="demo-based" aria-live="polite">{all ? t.building.basedOn(s.name.trim()) : ""}</p>
  </>;
}

function NoteGraph({ r, t, locale }: { r: Result; t: Copy; locale: Locale }) {
  const start = BASES[r.base].formula.notes;
  const order = { top: 0, heart: 1, base: 2 };
  const shown = displayPercents(r.formula.notes); // whole percents that add up to 100
  const rows = [
    ...r.formula.notes.map((n) => ({ ...n, from: start.find((x) => x.note === n.note)?.weight ?? 0, to: shown[n.note] })),
    ...start.filter((n) => !r.formula.notes.some((x) => x.note === n.note)).map((n) => ({ ...n, from: n.weight, to: 0 })),
  ].map((n) => ({ ...n, tier: NOTE_TIER[n.note] ?? n.tier })) // accents sit in their own tier, never between headers
    .sort((a, b) => order[a.tier] - order[b.tier] || b.to - a.to);
  const max = Math.max(40, ...rows.map((x) => Math.max(x.from, x.to)));
  const name = (note: string) => NOTE_NAMES[note]?.[locale] ?? note;
  const rowH = 30, tierGap = 22, x0 = 100, w = 160;
  // Each tier gets a small header; y positions accumulate so headers never touch the rows above.
  let y = 0;
  const placed = rows.map((x, i) => {
    const header = i === 0 || x.tier !== rows[i - 1].tier;
    if (header) y += i === 0 ? 14 : tierGap;
    const at = y; y += rowH;
    return { ...x, y: at, header };
  });
  return <figure className="demo-graph">
    <figcaption><span>{t.result.graphTitle}</span><span className="demo-legend"><i className="ghost" />{t.result.legendBase}<i className="tuned" />{t.result.legendTuned}</span></figcaption>
    <svg viewBox={`0 0 300 ${y + 4}`} role="img" aria-label={rows.map((x) => `${name(x.note)} ${x.from} to ${x.to}`).join(", ")}>
      {placed.map((x, i) => {
        const y = x.y, changed = x.to !== x.from, delta = x.to - x.from;
        return <g key={x.note} style={{ "--i": i } as CSSProperties}>
          {x.header && <text x="0" y={y - 5} className="demo-graph-tier">{t.result.tiers[x.tier]}</text>}
          <text x="0" y={y + 13} className="demo-graph-note">{name(x.note)}</text>
          <rect x={x0} y={y + 3} width={w} height="14" className="demo-graph-track" />
          <rect x={x0} y={y + 3} width={(w * x.from) / max} height="14" className="demo-graph-ghost" />
          {x.to > 0 && <rect x={x0} y={y + 5} width={(w * x.to) / max} height="10" className={`demo-graph-bar ${changed ? "is-changed" : ""}`} style={{ "--from": x.to ? x.from / x.to : 0 } as CSSProperties} />}
          <text x="300" y={y + 13} textAnchor="end" className={`demo-graph-delta ${changed ? "is-changed" : ""}`}>{changed ? `${delta > 0 ? "+" : ""}${delta}` : `${x.to}`}</text>
        </g>;
      })}
    </svg>
  </figure>;
}

// A horizontal scale with a "You are here" pin (after the Hers pattern). The pin and zones are visual; the value line carries the reading.
function Gauge({ title, value, zones, widths, at, zone, here, badge }: { title: string; value: ReactNode; zones: string[]; widths?: number[]; at?: number; zone?: number; here: string; badge?: string }) {
  const cols = (widths ?? zones.map(() => 1)).map((w) => `${w}fr`).join(" ");
  return <div className="demo-gauge">
    <p className="demo-gauge-head"><span>{title}</span>{badge && <span className="demo-badge">{badge}</span>}</p>
    <p className="demo-gauge-value">{value}</p>
    {at !== undefined && <div className="demo-gauge-scale" aria-hidden="true" style={{ "--at": Math.min(1, Math.max(0, at)) } as CSSProperties}>
      <span className="demo-gauge-here">{here}</span>
      <span className="demo-gauge-pin" />
      <div className="demo-gauge-track" style={{ gridTemplateColumns: cols }}>{zones.map((z, i) => <span key={z} className={i === zone ? "is-on" : ""} />)}</div>
      <div className="demo-gauge-zones" style={{ gridTemplateColumns: cols }}>{zones.map((z, i) => <span key={z} className={i === zone ? "is-on" : ""}>{z}</span>)}</div>
    </div>}
  </div>;
}

function ResultView({ r, t, locale, mode, pick, ph, blot: oil, sensitivity, heading }: { r: Result; t: Copy; locale: Locale; mode: State["mode"]; pick: Letter; ph?: Reading; blot?: Reading; sensitivity: "high" | "medium" | "low" | "unknown"; heading: RefObject<HTMLHeadingElement | null> }) {
  const base = BASES[r.base];
  // Shown percents are whole numbers summing to 100; sentences quote the shown number, not the internal 0.1 weight.
  const shown = displayPercents(r.formula.notes);
  const to = (c: Change) => shown[c.note] ?? 0;
  const visible = r.changes.map((c, i) => ({ c, i })).filter(({ c }) => to(c) !== c.from);
  const cite = citer(t);
  const sens = ["low", "medium", "high"].indexOf(sensitivity);
  // matchingReasons keeps only traits that pushed the note the way it moved (same rule as the server's sentences).
  const reason = (c: Change, i: number) => {
    const matched = matchingReasons(c);
    if (matched[0] === "rebalance") return t.result.balanced;
    const line = r.explLocale === locale && matched.length === c.reasons.length ? r.explanations?.[i] : undefined;
    if (line && to(c) === c.to) return line;
    // Swap the internal "31.3" for the shown "32"; an integer could also match other digits, so those use the template.
    if (line && !Number.isInteger(c.to) && line.includes(String(c.to))) return line.replaceAll(String(c.to), String(to(c)));
    return changeLine({ ...c, to: to(c) }, locale);
  };
  return <>
    <p className="demo-eyebrow">{t.result.eyebrow}</p>
    <p className="demo-reveal">{t.result.reveal(pick)}</p>
    <h1 ref={heading} tabIndex={-1} className="demo-base-name">{base.name[locale]}</h1>
    <p className="demo-meta"><span>{t.families[base.family]}</span><span className="demo-badge">{t.result.sampleFormula}</span></p>
    {mode === "sample" && <p className="demo-context-note">{labCopy[locale].sampleNote}</p>}
    <NoteGraph r={r} t={t} locale={locale} />
    {visible.length ? <ul className="demo-reasons">{visible.map(({ c, i }) => <li key={c.note}>
      <strong>{NOTE_NAMES[c.note]?.[locale] ?? c.note}</strong><span className="demo-fromto">{c.from} → {to(c)}</span>
      <p>{reason(c, i)}{matchingReasons(c).some((x) => x === "dry-skin" || x === "oily-skin") && cite(CITES.skin)}</p>
    </li>)}</ul> : <p className="demo-muted">{t.result.noChanges}</p>}
    <section className="demo-readings" aria-labelledby="demo-readings-title">
      <h2 className="demo-label" id="demo-readings-title">{t.result.readings}</h2>
      <Gauge title={t.result.oilTitle} here={t.result.here} zones={t.result.oilZones} widths={[35, 30, 35]} badge={oil?.sample ? t.sample : undefined}
        value={oil?.blot ? <>{t.blot.oil(oil.blot.step)}{cite(CITES.skin)}</> : t.building.skipped}
        at={oil?.blot?.oil} zone={oil?.blot ? oilZone(oil.blot.oil) : undefined} />
      <Gauge title={t.result.sensTitle} here={t.result.here} zones={t.result.sensZones} badge={mode === "sample" ? t.result.sampleFormula : undefined}
        value={sens >= 0 ? <>{t.result.sensZones[sens]}{cite(CITES.sensitivity)}</> : t.building.skipped}
        at={sens >= 0 ? (sens + 0.5) / 3 : undefined} zone={sens} />
      <div className="demo-gauge">
        <p className="demo-gauge-head"><span>{t.result.nose}</span></p>
        <p className="demo-gauge-value">{r.nose.name[locale]}{cite(CITES.nose)}</p>
        <div className="demo-lean" role="img" aria-label={FAMILIES.map((f) => `${t.families[f]} ${Math.round((r.nose.filled[f] ?? 3) * 10) / 10}/5`).join(", ")}>
          {FAMILIES.map((f) => <div key={f}><span>{t.families[f]}</span><i style={{ "--at": ((r.nose.filled[f] ?? 3) - 1) / 4 } as CSSProperties} /></div>)}
          <small><span>{t.smell.likeEnds[0]}</span><span>{t.smell.likeEnds[1]}</span></small>
        </div>
      </div>
    </section>
    <dl className="demo-facts">
      <div><dt>{t.result.concentration}</dt><dd>{r.concentration} · {t.result.concentrations[r.concentration]}</dd></div>
      <div><dt>{t.result.projection}</dt><dd>{t.result.projections[r.projection]}</dd></div>
    </dl>
    {ph?.ph && <p className="demo-muted">{t.result.phLine(ph.ph.skin.toFixed(1))}{cite(CITES.ph)}</p>}
    <p className="demo-perfumer">{t.perfumer}{cite(CITES.review)}</p>
    <p className="demo-context-note">{labCopy[locale].noOrder}</p>
    <a className="demo-methods" href="/element">{labCopy[locale].explore}</a>
    <p className="demo-muted">{t.medical}</p>
    <p className="demo-muted"><a className="demo-methods" href="/element/tech#methods" target="_blank" rel="noopener">{t.result.methods}</a></p>
  </>;
}

const oilZone = (oil: number) => (oil < 0.35 ? 0 : oil > 0.65 ? 2 : 1); // same thresholds as tune()

// Desktop-only lab bench: a visual for the current step from real assets and live state. Decorative, so hidden from
// assistive tech; everything it shows is also in the main column. Images load lazily so phones (bench hidden) skip them.
function Bench({ s, t, locale, picked, buildReady }: { s: State; t: Copy; locale: Locale; picked: string[]; buildReady: boolean[] }) {
  let art: ReactNode, caption: string | undefined, badge: string | undefined;
  const lid = () => { art = <img className="bench-photo bench-lid" src="/media/element-final-board.webp" width="1543" height="1254" alt="" loading="lazy" />; caption = labCopy[locale].reference; };
  const mark = () => { art = <ElementSignature className="bench-signature" />; };
  switch (s.step) {
    case 0: art = <LabStudy locale={locale} />; break;
    case 2: lid(); break;
    case 3: case 4: {
      const zone: Zone = s.step === 3 ? "blot" : "ph";
      const r = s[zone];
      if (!r?.sample) lid();
      else { art = <DemoPhoto className="bench-photo" src={r.image ?? `/kit/sample/${zone}.webp`} />; caption = sequentialCopy[locale].olderPhoto; badge = t.sample; }
      if (zone === "blot" && r?.blot) art = <>{art}<Gauge title={t.result.oilTitle} here={t.result.here} zones={t.result.oilZones} widths={[35, 30, 35]}
        value={t.blot.oil(r.blot.step)} at={r.blot.oil} zone={oilZone(r.blot.oil)} /></>;
      break;
    }
    case 5: {
      const current = s.current ? s.current.chips.filter((c) => picked.includes(c.id)) : [];
      const names = chipLabels(s.answers, locale);
      for (const c of current) for (const tag of c.tags) names[tag] ??= c.label[locale];
      const tags = [...new Set([...s.answers.flatMap((a) => a.tags), ...current.flatMap((c) => c.tags)])];
      art = tags.length ? <div className="bench-tags"><TagList tags={tags} locale={locale} names={names} /></div> : <p className="bench-empty">{t.bench.tagsEmpty}</p>;
      caption = t.bench.tags;
      break;
    }
    case 6: {
      const pick = s.sub >= 3 ? s.pick : undefined;
      art = <div className="bench-smell">
        <p className="demo-label">{t.bench.vials}</p>
        <div className="bench-vials">{([1, 2, 3, 4] as Vial[]).map((v) => {
          const level = s.ladder[v];
          return <div key={v} className={level === undefined ? "" : "is-set"}>
            <DemoVial label={String(v)} active={level !== undefined} size="small" />
            <small>{t.smell.vial(v)}</small><small>{level === undefined ? "-" : t.smell.levels[level]}</small>
          </div>;
        })}</div>
        <p className="demo-label">{t.bench.bases}</p>
        <div className="bench-letters">{LETTERS.map((letter) => {
          const like = s.ratings[letter]?.like;
          return <div key={letter} className={[s.top2.includes(letter) && "is-top", pick === letter && "is-pick"].filter(Boolean).join(" ")}>
            <span className="demo-letter">{letter}</span>
            <span className="bench-dots">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={like && i <= like ? "on" : ""} />)}</span>
          </div>;
        })}</div>
      </div>;
      caption = t.stepLabels[6];
      break;
    }
    case 7: {
      art = <LabStudy locale={locale} />;
      caption = buildReady.every(Boolean) ? motionCopy[locale].complete : motionCopy[locale].stages[Math.max(0, buildReady.findIndex(value => !value))];
      break;
    }
    case 8: {
      const shots = (["blot", "ph"] as Zone[]).map((zone, i) => ({ zone, r: usable(s[zone]), label: t.stepLabels[3 + i] })).filter((x) => x.r?.image);
      if (!shots.length) { mark(); break; }
      art = <div className="bench-evidence">{shots.map(({ zone, r, label }) => <figure key={zone}>
        <DemoPhoto src={r!.image!} />
        <figcaption><span>{label}</span><span className="demo-badge">{r!.sample ? t.sample : t.bench.yourPhoto}</span></figcaption>
      </figure>)}</div>;
      caption = t.result.readings;
      break;
    }
    default: mark();
  }
  return <aside className="demo-bench" aria-hidden="true">
    <figure className="bench-plate" key={s.step}>
      <div className="bench-stage">{art}</div>
      <span className="demo-frame-corners" />
      {caption && <figcaption><span>{caption}</span>{badge && <span className="demo-badge">{badge}</span>}</figcaption>}
    </figure>
  </aside>;
}
