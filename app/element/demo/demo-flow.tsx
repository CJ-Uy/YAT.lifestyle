"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import SiteHeader, { useLocale, type Locale } from "../../site-header";
import { demoCopy } from "../../../lib/element/copy";
import { callApi } from "./api";
import {
  BASES, StyledQr, TRAIT_EFFECTS, compare, inferNose, kitKey, loadOpenCv, nextFromBank, readZone, scoreLadder, tune,
  type BaseId, type Change, type Family, type Formula, type LadderAnswer, type Letter, type Localised, type Question, type Vial, type ZoneResult,
} from "./stubs";

type Copy = (typeof demoCopy)["en"];
type Action = { label: string; onClick?: () => void; href?: string; disabled?: boolean };
type Zone = "blot" | "ph";
type Reading = {
  sample: boolean; estimated: boolean; image?: string; flags: string[];
  blot?: { oil: number; step: number; clearArea: number }; ph?: { skin: number; control: number; diff: number; confidence: number };
};
type Answer = { id: string; text: string; chips: string[]; tags: string[]; source: "bank" | "ai"; q: AskedQuestion };
type AskedQuestion = Question & { source: "bank" | "ai" };
type Rating = { like: number; strength: number };
type Nose = { type: string; name: Localised; filled: Record<Family, number> };
type Result = {
  base: BaseId; formula: Formula; changes: Change[]; explanations?: string[]; explLocale?: Locale;
  concentration: "EDT" | "EDP"; projection: "close" | "moderate" | "carrying"; nose: Nose; shareId?: string; source: "api" | "local";
};
type State = {
  step: number; sub: number; mode: "sample" | "kit"; name: string; email: string; demoAccount: boolean; kitCode: string; adult: boolean; consent: boolean;
  setup: boolean[]; blot?: Reading; ph?: Reading; answers: Answer[]; current?: AskedQuestion | null;
  ladder: Partial<Record<Vial, 0 | 1 | 2 | 3>>; ratings: Partial<Record<Letter, Rating>>; top2: Letter[]; pick?: Letter; sessionId?: string; result?: Result;
};

const STORAGE = "element-demo-v1";
const LETTERS: Letter[] = ["A", "B", "C", "D", "E", "F"];
const FAMILIES: Family[] = ["citrus", "green", "water", "floral", "woody", "amber"];
const LAST_SUB: Record<number, number> = { 3: 1, 4: 2, 6: 6 };
const SAMPLE_BLOT = { oil: 0.28, step: 2, clearArea: 0.14 };
const SAMPLE_PH = { skin: 5.3, control: 6.9, diff: -1.6, confidence: 0.72 };
const FOUNDER = { likes: { citrus: 4, green: 5, water: 3, floral: 2, woody: 5, amber: 2 } as Record<Family, number>, tags: ["trail-memory", "aircon-office"] };
const initial: State = { step: 0, sub: 0, mode: "sample", name: "", email: "", demoAccount: false, kitCode: "DEMO", adult: false, consent: false, setup: [false, false, false, false], answers: [], ladder: {}, ratings: {}, top2: [] };
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Everything the tuning needs, derived from answers so a skipped step simply contributes nothing.
function derive(s: State) {
  const key = kitKey(s.kitCode || "DEMO");
  const ladderAnswers: LadderAnswer[] = (Object.entries(s.ladder) as [string, 0 | 1 | 2 | 3][]).map(([vial, strength]) => ({ vial: Number(vial) as Vial, smelled: strength > 0, strength }));
  const ladder = scoreLadder(ladderAnswers, key.vials);
  const likes: Partial<Record<Family, number>> = {};
  for (const letter of LETTERS) { const r = s.ratings[letter]; if (r) likes[BASES[key.letters[letter]].family] = r.like; }
  const nose = inferNose(likes, ladder.sensitivity);
  const tags = [...new Set(s.answers.flatMap((a) => a.tags))];
  const byLike = [...LETTERS].sort((a, b) => (s.ratings[b]?.like ?? 0) - (s.ratings[a]?.like ?? 0));
  const pick = s.pick ?? s.top2[0] ?? byLike[0];
  const base = key.letters[pick];
  const traits = { oil: s.blot?.blot?.oil, sensitivity: ladder.sensitivity, tags, muskQuiet: nose.muskQuiet, trust: ladder.trust };
  return { key, ladderAnswers, ladder, likes, nose, tags, pick, base, traits, byLike };
}

function localResult(s: State): Result {
  const d = derive(s);
  return { ...tune(d.base, d.traits), base: d.base, nose: d.nose, source: "local" };
}

// Accept the API result only when it has the shape we render; anything else falls back to local tuning.
function fromApi(raw: unknown, s: State, locale: Locale): Result | null {
  const r = raw as Partial<Result> & { explanations?: unknown; nose?: Partial<Nose> };
  if (!r || !r.base || !(r.base in BASES) || !Array.isArray(r.formula?.notes) || !Array.isArray(r.changes)) return null;
  const local = localResult(s);
  const ex: unknown = (raw as { explanations?: unknown }).explanations;
  const explanations = Array.isArray(ex) && ex.length === r.changes.length && ex.every((x) => typeof x === "string") ? ex as string[]
    : ex && typeof ex === "object" ? r.changes.map((c) => String((ex as Record<string, unknown>)[c.note] ?? "")) : undefined;
  return {
    base: r.base, formula: r.formula as Formula, changes: r.changes, explanations, explLocale: locale,
    concentration: r.concentration === "EDP" ? "EDP" : r.concentration === "EDT" ? "EDT" : local.concentration,
    projection: r.projection && ["close", "moderate", "carrying"].includes(r.projection) ? r.projection : local.projection,
    nose: r.nose?.name?.en && r.nose.filled ? r.nose as Nose : local.nose, shareId: typeof r.shareId === "string" ? r.shareId : undefined, source: "api",
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

export default function DemoFlow() {
  const [locale, setLocale] = useLocale();
  const t = demoCopy[locale];
  const [s, setS] = useState<State>(initial);
  const patch = (p: Partial<State> | ((prev: State) => Partial<State>)) => setS((prev) => ({ ...prev, ...(typeof p === "function" ? p(prev) : p) }));
  const loaded = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const [picked, setPicked] = useState<string[]>([]);

  // iOS may reload the page after the camera closes, so the walkthrough survives a reload.
  useEffect(() => {
    try { const saved = sessionStorage.getItem(STORAGE); if (saved) setS({ ...initial, ...JSON.parse(saved) }); } catch { /* start fresh */ }
    loaded.current = true;
    loadOpenCv().catch(() => { /* readZone falls back to estimated readings */ });
    lidLayout();
  }, []);
  useEffect(() => { if (loaded.current) try { sessionStorage.setItem(STORAGE, JSON.stringify(s)); } catch { /* storage full or blocked */ } }, [s]);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) { moved.current = true; return; }
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, [s.step, s.sub]);

  const go = (step: number, sub = 0) => patch({ step, sub });
  const back = () => {
    if (s.step === 5 && s.answers.length && (s.sub === 0)) {
      const last = s.answers[s.answers.length - 1];
      setPicked(last.chips);
      return patch({ answers: s.answers.slice(0, -1), current: last.q });
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
      const answered = s.answers.map(({ id, text, chips, tags, source }) => ({ id, text, chips, tags, source }));
      const state = { answered, aiFollowUps: answered.filter((a) => a.source === "ai").length };
      let next: AskedQuestion | null = null;
      if (answered.length < surveyCap) {
        next = normaliseQuestion(await callApi("survey", { sessionId: s.sessionId, locale, state }, 3500), answered.length);
        if (next && answered.some((a) => a.id === next!.id)) next = null;
        if (!next) { const bank = nextFromBank(state); next = bank ? { ...bank, source: "bank" } : null; }
      }
      if (alive) { setPicked([]); patch({ current: next }); }
    })();
    return () => { alive = false; };
  }, [s.step, s.current]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (q: AskedQuestion, chips: string[], extraTags: string[] = []) => {
    const tags = [...new Set([...q.chips.filter((c) => chips.includes(c.id)).flatMap((c) => c.tags), ...extraTags])];
    patch((prev) => ({ answers: [...prev.answers, { id: q.id, text: q.text[locale], chips, tags, source: q.source, q }], current: undefined }));
  };

  const startSession = () => {
    callApi<{ sessionId?: string }>("session", { mode: s.mode === "kit" ? "kit" : "demo", kitCode: s.kitCode, firstName: s.name.trim(), email: s.demoAccount ? "" : s.email.trim(), locale, consents: { adult: s.adult, storage: s.consent } }, 4000)
      .then((r) => { if (r?.sessionId) patch({ sessionId: r.sessionId }); });
  };


  let body: ReactNode, primary: Action | undefined, secondary: Action | undefined, note: string | undefined;
  const h1 = (text: string) => <h1 ref={heading} tabIndex={-1}>{text}</h1>;

  switch (s.step) {
    case 0:
      body = <>
        <img className="demo-logo" src="/media/element-logo.png" alt="Element · YAT.lifestyle" width="1146" height="861" />
        <p className="demo-eyebrow">{t.welcome.eyebrow}</p>
        {h1(t.welcome.title)}
        <p className="demo-lead">{t.welcome.lead}</p>
        <h2 className="demo-label">{t.welcome.measureTitle}</h2>
        <ol className="demo-measures">{t.welcome.measures.map(([name, text], i) => <li key={name}><span>{String(i + 1).padStart(2, "0")}</span><strong>{name}</strong><p>{text}</p></li>)}</ol>
        <fieldset className="demo-modes"><legend className="demo-label">{t.welcome.modeLabel}</legend>
          {(["sample", "kit"] as const).map((mode) => <label key={mode} className="demo-option">
            <input type="radio" name="mode" checked={s.mode === mode} onChange={() => patch({ mode })} />
            <span><strong>{mode === "sample" ? t.welcome.modeSample : t.welcome.modeKit}</strong><small>{mode === "sample" ? t.welcome.modeSampleHint : t.welcome.modeKitHint}</small></span>
          </label>)}
        </fieldset>
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
        <p className="demo-lead">{t.setup.lead}</p>
        <ul className="demo-checklist">{t.setup.items.map((item, i) => <li key={i}><label className="demo-check demo-check-row">
          <input type="checkbox" checked={s.setup[i]} onChange={(e) => patch({ setup: s.setup.map((v, j) => (j === i ? e.target.checked : v)) })} /><span>{item}</span>
        </label></li>)}</ul>
      </>;
      primary = { label: t.continue, onClick: () => go(3) };
      break;
    case 3:
      if (s.sub === 0) {
        body = <>{h1(t.blot.title)}<Steps items={t.blot.steps} /><ZoneArt zone="blot" /></>;
        primary = { label: t.blot.ready, onClick: () => go(3, 1) };
      } else {
        body = <>{h1(t.blot.title)}<Capture zone="blot" t={t} mode={s.mode} reading={s.blot} sessionId={s.sessionId} onReading={(r) => patch((prev) => ({ blot: r && prev.blot && r.image === prev.blot.image ? { ...prev.blot, ...r } : r }))} hint={t.blot.frameHint} /></>;
        if (s.blot) primary = { label: t.continue, onClick: () => go(4) }; else secondary = { label: t.skipStep, onClick: () => go(4) };
      }
      break;
    case 4:
      if (s.sub === 0) {
        body = <>{h1(t.ph.title)}<Steps items={t.ph.steps} /><ZoneArt zone="ph" /></>;
        primary = { label: t.ph.startTimer, onClick: () => go(4, 1) };
        secondary = { label: t.ph.skipTimer, onClick: () => go(4, 2) };
      } else if (s.sub === 1) {
        body = <Timer seconds={60} title={t.ph.timerTitle} hint={t.ph.timerHint} done={t.ph.timerDone} heading={heading} />;
        primary = { label: t.continue, onClick: () => go(4, 2) };
      } else {
        body = <>{h1(t.ph.photoTitle)}<Capture zone="ph" t={t} mode={s.mode} reading={s.ph} sessionId={s.sessionId} onReading={(r) => patch((prev) => ({ ph: r && prev.ph && r.image === prev.ph.image ? { ...prev.ph, ...r } : r }))} hint={t.ph.frameHint} /></>;
        if (s.ph) primary = { label: t.continue, onClick: () => go(5) }; else secondary = { label: t.skipStep, onClick: () => go(5) };
      }
      break;
    case 5: {
      const q = s.current;
      if (q === undefined) {
        body = <>{h1(t.survey.title)}<p className="demo-wait" role="status"><span className="demo-pulse" aria-hidden="true" />{t.survey.loading}</p></>;
      } else if (q === null) {
        const tags = [...new Set(s.answers.flatMap((a) => a.tags))];
        body = <>{h1(t.survey.title)}<p className="demo-label">{t.survey.tags}</p><TagList tags={tags} /></>;
        primary = { label: t.continue, onClick: () => go(6) };
      } else {
        body = <Survey key={q.id} q={q} n={s.answers.length + 1} t={t} locale={locale} picked={picked} setPicked={setPicked} heading={heading} sessionId={s.sessionId}
          onVoice={(tags) => answer(q, picked, tags)} />;
        primary = { label: picked.length ? t.survey.next : t.survey.skipQuestion, onClick: () => answer(q, picked) };
        secondary = { label: t.survey.skipRest, onClick: () => patch({ current: null }) };
      }
      break;
    }
    case 6:
      ({ body, primary, secondary } = smellStep(s, t, patch, go, heading));
      break;
    case 7:
      body = <Building s={s} t={t} locale={locale} heading={heading} onResult={(result) => patch({ result })} />;
      primary = { label: t.building.see, disabled: !s.result, onClick: () => go(8) };
      break;
    case 8: {
      const r = s.result ?? localResult(s);
      const d = derive(s);
      body = <ResultView r={r} t={t} locale={locale} pick={d.pick} ph={s.ph} heading={heading} />;
      primary = { label: t.result.shareCard, onClick: () => go(9) };
      break;
    }
    default: {
      const r = s.result ?? localResult(s);
      body = <Share r={r} s={s} t={t} locale={locale} heading={heading} />;
      primary = { label: t.share.restart, onClick: () => { setPicked([]); setS({ ...initial, mode: s.mode }); } };
    }
  }

  return <>
    <a className="skip-link" href="#demo-content">{t.skip}</a>
    <SiteHeader locale={locale} onLocaleChange={setLocale} subpage />
    <main className="demo" id="demo-content">
      <ol className="demo-rail" aria-hidden="true">{t.stepLabels.map((label, i) => <li key={i} className={i === s.step ? "is-current" : i < s.step ? "is-done" : ""}><span>{String(i + 1).padStart(2, "0")}</span>{label}</li>)}</ol>
      <div className="demo-column">
        <div className="demo-bar">
          <button type="button" className="demo-back" onClick={back} disabled={s.step === 0 && s.sub === 0} aria-label={t.back}>
            <svg aria-hidden="true" width="18" height="14" viewBox="0 0 18 14"><path d="M7 1 1 7l6 6M1 7h16" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
          </button>
          <p><span>{t.stepLabels[s.step]}</span><span className="demo-count">{t.stepOf(s.step + 1, 10)}</span></p>
          <div className="demo-progress" role="progressbar" aria-label={t.stepOf(s.step + 1, 10)} aria-valuemin={1} aria-valuemax={10} aria-valuenow={s.step + 1}><span style={{ transform: `scaleX(${(s.step + 1) / 10})` }} /></div>
        </div>
        <section className="demo-screen" key={`${s.step}-${s.sub}`}>{body}</section>
        <div className="demo-actions">
          {note && <p className="demo-note">{note}</p>}
          {primary && (primary.href ? <a className="demo-primary" href={primary.href}>{primary.label}</a>
            : <button type="button" className="demo-primary" onClick={primary.onClick} disabled={primary.disabled}>{primary.label}</button>)}
          {secondary && <button type="button" className="demo-secondary" onClick={secondary.onClick}>{secondary.label}</button>}
        </div>
      </div>
    </main>
  </>;
}

function Steps({ items }: { items: string[] }) {
  return <ol className="demo-steps">{items.map((item, i) => <li key={i}><span>{i + 1}</span>{item}</li>)}</ol>;
}

// Schematic of the lid zone so people know what to aim at before the camera opens.
function ZoneArt({ zone }: { zone: Zone }) {
  return <svg className="demo-zone-art" viewBox="0 0 160 66" aria-hidden="true">
    <rect x=".5" y=".5" width="159" height="65" fill="none" stroke="currentColor" strokeOpacity=".35" />
    {[[2, 2], [148, 2], [148, 54], [2, 54]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="10" height="10" fill="currentColor" />)}
    {zone === "blot" ? <><rect x="16" y="6" width="86" height="54" fill="#000" stroke="currentColor" strokeOpacity=".5" /><rect x="19" y="9" width="80" height="48" fill="none" stroke="#d8a443" strokeDasharray="3 2" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x="106" y={6 + i * 9} width="7" height="7.5" fill="#23a8ff" fillOpacity={0.25 + i * 0.13} />)}</>
      : <><rect x="20" y="10" width="110" height="16" fill="none" stroke="#d8a443" strokeDasharray="3 2" /><rect x="20" y="40" width="110" height="16" fill="none" stroke="currentColor" strokeOpacity=".6" strokeDasharray="3 2" />
        {[0, 1, 2].map((i) => <rect key={i} x={40 + i * 30} y="13" width="10" height="10" fill="#e9b04a" fillOpacity=".8" />)}{[0, 1, 2].map((i) => <rect key={i} x={40 + i * 30} y="43" width="10" height="10" fill="#c9c46a" fillOpacity=".8" />)}</>}
  </svg>;
}

function Capture({ zone, t, mode, reading, onReading, hint, sessionId }: { zone: Zone; t: Copy; mode: State["mode"]; reading?: Reading; onReading: (r: Reading | undefined) => void; hint: string; sessionId?: string }) {
  const [status, setStatus] = useState<"idle" | "reading" | "retake">("idle");
  const [problem, setProblem] = useState<string>();
  const [preview, setPreview] = useState<string>();
  const input = useRef<HTMLInputElement>(null);

  async function read(src: string, sample: boolean) {
    setStatus("reading"); setProblem(undefined); setPreview(src);
    let result: ZoneResult | null = null;
    try {
      const canvas = await toCanvas(src);
      // ponytail: a fixed 6 s budget for OpenCV load + read; tune if real phones need longer.
      result = await Promise.race([loadOpenCv().then(async () => readZone(canvas, zone, await lidLayout())), wait(6000).then(() => null)]);
    } catch { result = null; }
    if (result && !result.ok) {
      setStatus("retake"); setProblem(t.retake[result.reason]);
      return;
    }
    const image = result?.ok ? result.warped.toDataURL("image/jpeg", 0.82) : src.startsWith("blob:") ? undefined : src;
    const next: Reading = result?.ok
      ? { sample, estimated: false, image, flags: result.flags, blot: result.blot, ph: result.ph }
      : { sample, estimated: true, image, flags: [], ...(zone === "blot" ? { blot: SAMPLE_BLOT } : { ph: SAMPLE_PH }) };
    if (!result) setProblem(t.retake.timeout);
    setStatus("idle");
    onReading(next);
    // Store the straightened photo and run the server vision check; extra flags arrive later if the API answers.
    if (result?.ok && image) callApi<{ flags?: string[] }>("photo", { sessionId, zone, image, readings: next.blot ?? next.ph, sample }, 6000)
      .then((r) => { if (r?.flags?.length) onReading({ ...next, flags: [...new Set([...next.flags, ...r.flags])] }); });
  }

  const shown = status === "idle" && reading ? reading.image : preview;
  const sampleFirst = mode === "sample";
  const quiet = !!reading; // once there is a reading, Continue is the only gold action
  const take = <label className={sampleFirst || quiet ? "demo-secondary" : "demo-primary demo-inline"}>
    <input ref={input} className="demo-hidden-input" type="file" accept="image/*" capture="environment" onChange={(e) => {
      const file = e.target.files?.[0]; e.target.value = "";
      if (file) read(URL.createObjectURL(file), false); // ponytail: object URLs are not revoked; a handful per session.
    }} />{reading || status === "retake" ? t.blot.retakePhoto : t.blot.takePhoto}
  </label>;
  const useSample = <button type="button" className={sampleFirst && !quiet ? "demo-primary demo-inline" : "demo-secondary"} onClick={() => read(`/kit/sample/${zone}.webp`, true)}>{t.blot.useSample}</button>;

  return <div className="demo-capture">
    <div className={`demo-frame demo-frame-${zone} ${status === "reading" ? "is-reading" : ""}`}>
      {shown ? <img src={shown} alt="" /> : <ZoneArt zone={zone} />}
      <span className="demo-frame-corners" aria-hidden="true" />
      {status === "reading" && <span className="demo-scan" aria-hidden="true" />}
    </div>
    <p className="demo-hint">{hint}</p>
    <div role="status" aria-live="polite">
      {status === "reading" && <p className="demo-wait"><span className="demo-pulse" aria-hidden="true" />{t.blot.reading}</p>}
      {status === "retake" && <p className="demo-problem">{problem}</p>}
      {status === "idle" && reading && <ReadingChip zone={zone} r={reading} t={t} problem={problem} />}
    </div>
    <div className="demo-capture-actions">{sampleFirst ? <>{useSample}{take}</> : <>{take}{useSample}</>}</div>
  </div>;
}

function ReadingChip({ zone, r, t, problem }: { zone: Zone; r: Reading; t: Copy; problem?: string }) {
  const badge = r.estimated ? t.estimated : r.sample ? t.sample : null;
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
      <p>{t.ph.confidence(Math.round(r.ph.confidence * 100))}</p>
      <p className="demo-muted">{t.ph.note}</p>
    </>}
    {r.flags.length > 0 && <TagList tags={r.flags} />}
  </div>;
}

const Tick = () => <svg aria-hidden="true" width="14" height="12" viewBox="0 0 14 12"><path d="m2 6 3 3 7-7" fill="none" stroke="#d8a443" strokeWidth="1.4" /></svg>;
const TagList = ({ tags }: { tags: string[] }) => <ul className="demo-tags">{tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>;

function Timer({ seconds, title, hint, done, heading }: { seconds: number; title: string; hint: string; done: string; heading: RefObject<HTMLHeadingElement | null> }) {
  const left = useCountdown(seconds, true);
  const r = 88, c = 2 * Math.PI * r;
  return <div className="demo-timer">
    <h1 ref={heading} tabIndex={-1}>{title}</h1>
    <div className="demo-ring">
      <svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r={r} className="demo-ring-track" /><circle cx="100" cy="100" r={r} className="demo-ring-fill" strokeDasharray={c} strokeDashoffset={c * (left / seconds)} /></svg>
      <p className="demo-ring-time" role="timer" aria-live="off">{left}<small>s</small></p>
    </div>
    <p className="demo-lead" role="status">{left === 0 ? done : hint}</p>
  </div>;
}

function Survey({ q, n, t, locale, picked, setPicked, heading, onVoice, sessionId }: { q: AskedQuestion; n: number; t: Copy; locale: Locale; picked: string[]; setPicked: (p: string[]) => void; heading: RefObject<HTMLHeadingElement | null>; onVoice: (tags: string[]) => void; sessionId?: string }) {
  const tags = [...new Set(q.chips.filter((c) => picked.includes(c.id)).flatMap((c) => c.tags))];
  return <>
    <p className="demo-eyebrow">{t.survey.counter(n)}{q.source === "ai" && <span className="demo-badge">{t.survey.followUp}</span>}</p>
    <h1 ref={heading} tabIndex={-1}>{q.text[locale]}</h1>
    <p className="demo-muted">{t.survey.lead}</p>
    <div className="demo-chips" role="group" aria-label={q.text[locale]}>
      {q.chips.map((c) => <button type="button" key={c.id} aria-pressed={picked.includes(c.id)} onClick={() => setPicked(picked.includes(c.id) ? picked.filter((x) => x !== c.id) : [...picked, c.id])}>{c.label[locale]}</button>)}
    </div>
    <div className="demo-tag-area" aria-live="polite">{tags.length > 0 && <><p className="demo-label">{t.survey.tags}</p><TagList tags={tags} /></>}</div>
    <Voice t={t} locale={locale} questionId={q.id} sessionId={sessionId} onTags={onVoice} />
  </>;
}

function Voice({ t, locale, questionId, sessionId, onTags }: { t: Copy; locale: Locale; questionId: string; sessionId?: string; onTags: (tags: string[]) => void }) {
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
        const audio = await new Promise<string>((resolve) => { const fr = new FileReader(); fr.onload = () => resolve(String(fr.result)); fr.readAsDataURL(blob); });
        const r = await callApi<{ tags?: string[] }>("voice", { sessionId, locale, questionId, audio }, 8000);
        if (r?.tags?.length) { setState("idle"); onTags(r.tags); } else setState("fail");
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

function smellStep(s: State, t: Copy, patch: (p: Partial<State>) => void, go: (step: number, sub?: number) => void, heading: RefObject<HTMLHeadingElement | null>): { body: ReactNode; primary: Action; secondary?: Action } {
  const h1 = (text: string) => <h1 ref={heading} tabIndex={-1}>{text}</h1>;
  const next = { label: t.continue, onClick: () => go(6, s.sub + 1) };
  const byLike = derive(s).byLike;
  const rate = (letters: Letter[]) => <>
    {h1(t.smell.rateTitle(`${letters[0]}-${letters[letters.length - 1]}`))}
    <p className="demo-lead">{t.smell.rateLead}</p>
    <div className="demo-bases">{letters.map((letter) => {
      const r = s.ratings[letter];
      const set = (k: keyof Rating, v: number) => patch({ ratings: { ...s.ratings, [letter]: { like: r?.like ?? 3, strength: r?.strength ?? 3, [k]: v } } });
      return <div className="demo-base" key={letter}>
        <p className="demo-letter">{letter}</p>
        {(["like", "strength"] as const).map((k) => <label key={k} className="demo-slider">
          <span>{k === "like" ? t.smell.like : t.smell.strength}<output>{r ? r[k] : "-"}</output></span>
          <input type="range" min={1} max={5} step={1} value={r?.[k] ?? 3} className={r ? "" : "is-unset"} onChange={(e) => set(k, Number(e.target.value))} />
          <small><span>{(k === "like" ? t.smell.likeEnds : t.smell.strengthEnds)[0]}</span><span>{(k === "like" ? t.smell.likeEnds : t.smell.strengthEnds)[1]}</span></small>
        </label>)}
      </div>;
    })}</div>
  </>;
  switch (s.sub) {
    case 0: return {
      body: <>
        {h1(t.smell.ladderTitle)}
        <p className="demo-lead">{t.smell.ladderLead}</p>
        <div className="demo-ladder">{([1, 2, 3, 4] as Vial[]).map((vial) => <div key={vial} className="demo-vial" role="group" aria-label={t.smell.vial(vial)}>
          <p>{t.smell.vial(vial)}</p>
          <div className="demo-segments">{t.smell.levels.map((label, level) => <button type="button" key={level} aria-pressed={s.ladder[vial] === level}
            onClick={() => patch({ ladder: { ...s.ladder, [vial]: level as 0 | 1 | 2 | 3 } })}>{label}</button>)}</div>
        </div>)}</div>
      </>, primary: next,
    };
    case 1: case 3: return { body: <Pause t={t} heading={heading} />, primary: { label: t.smell.pauseReady, onClick: next.onClick } };
    case 2: return { body: rate(["A", "B", "C"]), primary: next };
    case 4: return { body: rate(["D", "E", "F"]), primary: next };
    case 5: return {
      body: <>
        {h1(t.smell.top2Title)}
        <p className="demo-lead">{t.smell.top2Lead}</p>
        <div className="demo-picks">{byLike.map((letter) => <button type="button" key={letter} aria-pressed={s.top2.includes(letter)}
          onClick={() => patch({ top2: s.top2.includes(letter) ? s.top2.filter((x) => x !== letter) : [...s.top2, letter].slice(-2), pick: undefined })}>
          <span className="demo-letter">{letter}</span><small>{s.ratings[letter] ? `${t.smell.like} ${s.ratings[letter]!.like}/5` : ""}</small>
        </button>)}</div>
      </>,
      primary: { label: t.continue, onClick: () => { patch({ top2: [...s.top2, ...byLike.filter((l) => !s.top2.includes(l))].slice(0, 2) }); go(6, 6); } },
    };
    default: {
      const pair = s.top2.length ? s.top2 : byLike.slice(0, 2);
      return {
        body: <>
          {h1(t.smell.finalTitle)}
          <p className="demo-lead">{t.smell.finalLead}</p>
          <div className="demo-picks demo-final">{pair.map((letter) => <button type="button" key={letter} aria-pressed={(s.pick ?? pair[0]) === letter} onClick={() => patch({ pick: letter })}>
            <span className="demo-letter">{letter}</span><small>{t.smell.choose}</small>
          </button>)}</div>
        </>,
        primary: { label: t.continue, onClick: () => { patch({ pick: s.pick ?? pair[0], result: undefined }); go(7); } },
      };
    }
  }
}

function Pause({ t, heading }: { t: Copy; heading: RefObject<HTMLHeadingElement | null> }) {
  const left = useCountdown(30, true);
  return <div className="demo-timer">
    <h1 ref={heading} tabIndex={-1}>{t.smell.pauseTitle}</h1>
    <div className="demo-breath" aria-hidden="true"><span /></div>
    <p className="demo-ring-time" role="timer">{left}<small>s</small></p>
    <p className="demo-lead" role="status">{left === 0 ? t.smell.pauseDone : t.smell.pauseLead}</p>
  </div>;
}

function Building({ s, t, locale, heading, onResult }: { s: State; t: Copy; locale: Locale; heading: RefObject<HTMLHeadingElement | null>; onResult: (r: Result) => void }) {
  const [ready, setReady] = useState([false, false, false, false]);
  const d = derive(s);
  useEffect(() => {
    let alive = true;
    const mark = (i: number) => alive && setReady((r) => r.map((v, j) => (j === i ? true : v)));
    const timers = [700, 1400, 2100].map((ms, i) => setTimeout(() => mark(i), ms));
    const started = Date.now();
    (async () => {
      const body = { sessionId: s.sessionId, locale, kitCode: s.kitCode, pick: d.pick, base: d.base, traits: d.traits, likes: d.likes, ladder: d.ladderAnswers, ph: s.ph?.ph,
        answers: s.answers.map(({ id, text, chips, tags, source }) => ({ id, text, chips, tags, source })) };
      const result = fromApi(await callApi("result", body, 8000), s, locale) ?? localResult(s);
      await wait(Math.max(0, 2800 - (Date.now() - started)));
      if (!alive) return;
      onResult(result);
      mark(3);
    })();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const details = [
    s.blot?.blot ? t.blot.oil(s.blot.blot.step) : null,
    s.ph?.ph ? `pH ${s.ph.ph.skin.toFixed(1)}` : null,
    Object.keys(d.likes).length || s.answers.length || Object.keys(s.ladder).length ? d.nose.name[locale] : null,
    d.tags.length ? d.tags.join(" · ") : null,
  ];
  const all = ready.every(Boolean);
  return <>
    <img className={`demo-emblem ${all ? "" : "is-working"}`} src="/media/element-e.png" alt="" width="470" height="533" />
    <h1 ref={heading} tabIndex={-1}>{t.building.title}</h1>
    <ul className="demo-build">{t.building.bars.map((label, i) => {
      const skipped = ready[i] && !details[i] && i < 2;
      return <li key={label} className={ready[i] ? (skipped ? "is-skipped" : "is-ready") : ""}>
        <p><span>{label}</span><span>{ready[i] ? (skipped ? t.building.skipped : t.building.done) : t.building.working}</span></p>
        <div className="demo-build-bar"><span /></div>
        <small>{ready[i] ? details[i] ?? "" : ""}</small>
      </li>;
    })}</ul>
    <p className="demo-based" aria-live="polite">{all ? t.building.basedOn(s.name.trim()) : ""}</p>
  </>;
}

function NoteGraph({ r, t, locale }: { r: Result; t: Copy; locale: Locale }) {
  const start = BASES[r.base].formula.notes;
  const order = { top: 0, heart: 1, base: 2 };
  const rows = [
    ...r.formula.notes.map((n) => ({ ...n, from: start.find((x) => x.note === n.note)?.weight ?? 0, to: n.weight })),
    ...start.filter((n) => !r.formula.notes.some((x) => x.note === n.note)).map((n) => ({ ...n, from: n.weight, to: 0 })),
  ].sort((a, b) => order[a.tier] - order[b.tier] || b.to - a.to);
  const max = Math.max(40, ...rows.map((x) => Math.max(x.from, x.to)));
  const name = (note: string) => t.notes[note] ?? note;
  const rowH = 30, tierGap = 22, x0 = 118, w = 182;
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
    <svg viewBox={`0 0 340 ${y + 4}`} role="img" aria-label={rows.map((x) => `${name(x.note)} ${x.from} to ${x.to}`).join(", ")}>
      {placed.map((x, i) => {
        const y = x.y, changed = Math.abs(x.to - x.from) >= 0.5, delta = Math.round((x.to - x.from) * 10) / 10;
        return <g key={x.note} style={{ "--i": i } as CSSProperties}>
          {x.header && <text x="0" y={y - 5} className="demo-graph-tier">{t.result.tiers[x.tier]}</text>}
          <text x="0" y={y + 13} className="demo-graph-note">{name(x.note)}</text>
          <rect x={x0} y={y + 3} width={w} height="14" className="demo-graph-track" />
          <rect x={x0} y={y + 3} width={(w * x.from) / max} height="14" className="demo-graph-ghost" />
          {x.to > 0 && <rect x={x0} y={y + 5} width={(w * x.to) / max} height="10" className={`demo-graph-bar ${changed ? "is-changed" : ""}`} style={{ "--from": x.to ? x.from / x.to : 0 } as CSSProperties} />}
          <text x="340" y={y + 13} textAnchor="end" className={`demo-graph-delta ${changed ? "is-changed" : ""}`}>{changed ? `${delta > 0 ? "+" : ""}${delta}` : `${x.to}`}</text>
        </g>;
      })}
    </svg>
  </figure>;
}

function ResultView({ r, t, locale, pick, ph, heading }: { r: Result; t: Copy; locale: Locale; pick: Letter; ph?: Reading; heading: RefObject<HTMLHeadingElement | null> }) {
  const base = BASES[r.base];
  // A note can have several reasons pulling different ways; show the one that pushed it the way it moved.
  const tierOf = (note: string) => r.formula.notes.find((n) => n.note === note)?.tier ?? "heart";
  const push = (id: string, c: Change) => Math.sign(c.to - c.from) * ((TRAIT_EFFECTS[id]?.notes?.[c.note] ?? 0) + (TRAIT_EFFECTS[id]?.tier?.[tierOf(c.note)] ?? 0));
  const reason = (c: Change, i: number) => {
    if (r.explLocale === locale && r.explanations?.[i]) return r.explanations[i];
    const best = [...c.reasons].sort((a, b) => push(b, c) - push(a, c))[0];
    return !best || best === "rebalance" || push(best, c) <= 0 ? t.result.rebalance : t.result.reasons[best] ?? t.result.reasonFallback;
  };
  return <>
    <p className="demo-eyebrow">{t.result.eyebrow}</p>
    <p className="demo-reveal">{t.result.reveal(pick)}</p>
    <h1 ref={heading} tabIndex={-1} className="demo-base-name">{base.name[locale]}</h1>
    <p className="demo-meta"><span>{t.families[base.family]}</span><span className="demo-badge">{t.result.sampleFormula}</span></p>
    <NoteGraph r={r} t={t} locale={locale} />
    {r.changes.length ? <ul className="demo-reasons">{r.changes.map((c, i) => <li key={c.note}>
      <strong>{t.notes[c.note] ?? c.note}</strong><span className="demo-fromto">{c.from} → {c.to}</span><p>{reason(c, i)}</p>
    </li>)}</ul> : <p className="demo-muted">{t.result.noChanges}</p>}
    <dl className="demo-facts">
      <div><dt>{t.result.concentration}</dt><dd>{r.concentration} · {t.result.concentrations[r.concentration]}</dd></div>
      <div><dt>{t.result.projection}</dt><dd>{t.result.projections[r.projection]}</dd></div>
      <div><dt>{t.result.nose}</dt><dd>{r.nose.name[locale]}</dd></div>
    </dl>
    {ph?.ph && <p className="demo-muted">{t.result.phLine(ph.ph.skin.toFixed(1))}</p>}
    <p className="demo-perfumer">{t.perfumer}</p>
    <div className="demo-order">
      <a className="demo-primary demo-inline" href="/shop?source=element-order#newsletter">{t.result.order}</a>
      <a className="demo-secondary" href="/shop?source=element-gift#newsletter">{t.result.gift}</a>
    </div>
    <p className="demo-muted">{t.result.orderNote}</p>
    <p className="demo-muted">{t.medical}</p>
  </>;
}

// Label art drawn from the person's family likes, so every card is different without a network call.
function LabelArt({ filled }: { filled: Record<Family, number> }) {
  return <svg className="demo-label-art" viewBox="0 0 200 120" aria-hidden="true">
    {FAMILIES.map((fam, i) => {
      const v = filled[fam] ?? 3;
      return <g key={fam}>
        <circle cx="100" cy="132" r={30 + i * 16} fill="none" stroke={v >= 4 ? "#d8a443" : "currentColor"} strokeOpacity={0.15 + v * 0.13} strokeWidth={0.6 + v * 0.35} />
      </g>;
    })}
    <path d="M100 30c-9 14-15 23-15 31a15 15 0 0 0 30 0c0-8-6-17-15-31Z" fill="#d8a443" />
  </svg>;
}

function Share({ r, s, t, locale, heading }: { r: Result; s: State; t: Copy; locale: Locale; heading: RefObject<HTMLHeadingElement | null> }) {
  const [copied, setCopied] = useState(false);
  const [match, setMatch] = useState<ReturnType<typeof compare> | null>(null);
  const [scan, setScan] = useState(false);
  const origin = typeof window === "undefined" ? "https://yatlifestyle.com" : window.location.origin;
  const link = r.shareId ? `${origin}/element/p/${r.shareId}` : `${origin}/element/demo`;
  const top = [...FAMILIES].sort((a, b) => (r.nose.filled[b] ?? 0) - (r.nose.filled[a] ?? 0)).slice(0, 3);
  const tags = [...new Set(s.answers.flatMap((a) => a.tags))];
  async function share() {
    try {
      if (navigator.share) return await navigator.share({ title: "Element · YAT.lifestyle", url: link });
      await navigator.clipboard.writeText(link); setCopied(true);
    } catch { /* cancelled */ }
  }
  return <>
    <h1 ref={heading} tabIndex={-1}>{t.share.title}</h1>
    <article className="demo-card">
      <LabelArt filled={r.nose.filled} />
      <div className="demo-card-body">
        <p className="demo-card-brand"><img src="/media/element-e.png" alt="" width="28" height="28" />Element</p>
        {s.name.trim() && <p className="demo-card-name">{s.name.trim()}</p>}
        <p className="demo-label">{t.result.nose}</p>
        <p className="demo-card-nose">{r.nose.name[locale]}</p>
        <p className="demo-label">{t.share.families}</p>
        <p>{top.map((f) => t.families[f]).join(" · ")}</p>
        <p className="demo-card-base">{BASES[r.base].name[locale]} · {r.concentration}</p>
      </div>
    </article>
    <div className="demo-share">
      <StyledQr value={link} size={148} />
      <div>
        <p className="demo-label">{t.share.linkLabel}</p>
        <p className="demo-link">{link}</p>
        <button type="button" className="demo-secondary" onClick={share}>{copied ? t.share.copied : t.share.share}</button>
        <p className="demo-muted">{t.share.friendsTry}</p>
      </div>
    </div>
    <div className="demo-social">
      <button type="button" className="demo-secondary" aria-expanded={!!match} onClick={() => setMatch(compare({ likes: r.nose.filled, tags }, FOUNDER))}>{t.share.compareFounder}</button>
      {match && <div className="demo-match" role="status"><p className="demo-match-pct">{match.percent}%</p><p>{t.share.compareResult(match.percent)}</p>
        <p className="demo-muted">{t.share.compareShared(t.families[match.shared])} {t.share.compareDiffer(t.families[match.differ])}</p></div>}
      <button type="button" className="demo-secondary" aria-expanded={scan} onClick={() => setScan(!scan)}>{t.share.scanFriend}</button>
      {scan && <p className="demo-muted">{t.share.scanHint}</p>}
    </div>
  </>;
}
