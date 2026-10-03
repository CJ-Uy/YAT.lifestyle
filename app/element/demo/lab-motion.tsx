"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Locale } from "../../site-header";
import { motionCopy } from "./lab-motion-copy";
import "./lab-motion.css";

function useVisibleMotion() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  useEffect(() => {
    let intersects = true;
    const update = () => setActive(intersects && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersects = entry.isIntersecting; update(); });
    if (ref.current) observer.observe(ref.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  return { ref, active };
}

export function LabStudy({ locale, className = "" }: { locale: Locale; className?: string }) {
  const c = motionCopy[locale];
  return <figure className={`lab-study ${className}`}><img src="/media/element-lab-study.webp" width="1024" height="1024" alt={c.studyAlt} /><figcaption>{c.concept}</figcaption></figure>;
}

/** Linework shows the relationship of entered signals to a bounded result, not a simulated neural network. */
export function FormulaProcessing({ locale, ready, base, details, ai }: { locale: Locale; ready: boolean[]; base: string; details: (string | null)[]; ai: boolean }) {
  const c = motionCopy[locale];
  const complete = ready.every(Boolean);
  const active = complete ? 3 : Math.max(0, ready.findIndex(value => !value));
  const [selected, setSelected] = useState<number | null>(null);
  const [longWait, setLongWait] = useState(false);
  const motion = useVisibleMotion();
  useEffect(() => {
    if (complete) return;
    const timer = setTimeout(() => setLongWait(true), 5500);
    return () => clearTimeout(timer);
  }, [complete]);
  const shown = selected ?? active;
  return <div className="lab-processing" data-complete={complete} data-animate={motion.active && !complete} ref={motion.ref}>
    <div className="lab-processing-head" role="status"><span className="lab-status-dot" /><span>{complete ? c.complete : c.working}</span><span>{ready.filter(Boolean).length}/4</span></div>
    <figure className="lab-signal-map" aria-hidden="true">
      <svg viewBox="0 0 560 244">
        {c.stages.map((label, i) => <g key={label} className={`lab-signal ${ready[i] ? "is-ready" : ""} ${active === i ? "is-active" : ""}`} style={{ "--signal": i } as CSSProperties}>
          <path className="lab-signal-track" d={`M46 ${36 + i * 57} H166 Q220 ${36 + i * 57} 266 122 H346`} />
          <path className="lab-signal-packet" d={`M46 ${36 + i * 57} H166 Q220 ${36 + i * 57} 266 122 H346`} pathLength="100" />
          <circle cx="33" cy={36 + i * 57} r="12" />
          <text x="33" y={40 + i * 57} textAnchor="middle">{i + 1}</text>
        </g>)}
        <rect className="lab-chosen-node" x="347" y="83" width="180" height="79" rx="5" />
        <text className="lab-node-label" x="437" y="112" textAnchor="middle">{c.chosen}</text>
        <text className="lab-node-title" x="437" y="137" textAnchor="middle">{base}</text>
        <path className="lab-result-link" d="M437 162 V187" />
        <text className="lab-node-label" x="437" y="206" textAnchor="middle">{c.result}</text>
      </svg>
    </figure>
    <ol className="lab-process-stages" aria-label={c.chooseStage}>{c.stages.map((label, i) => <li key={label} data-ready={ready[i]} data-active={shown === i}>
      <button type="button" aria-pressed={shown === i} aria-controls="lab-stage-explanation" onClick={() => setSelected(i)}>
        <span className="lab-stage-number">{ready[i] ? <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7" /></svg> : `0${i + 1}`}</span><span>{label}</span><small>{ready[i] ? c.ready : i === active ? c.now : c.next}</small>
      </button>
      {details[i] && ready[i] && <p className="lab-stage-data">{details[i]}</p>}
    </li>)}</ol>
    <div className="lab-stage-explanation" id="lab-stage-explanation"><p>{c.explanations[shown]}</p></div>
    {complete ? <p className="lab-process-outcome" role="status">{ai ? c.ai : c.local}</p> : longWait && <p className="lab-process-outcome" role="status">{c.awaiting}</p>}
  </div>;
}

export function PhotoProcessing({ locale, phase, sample }: { locale: Locale; phase: number; sample: boolean }) {
  const c = motionCopy[locale];
  const motion = useVisibleMotion();
  return <div className="lab-photo-processing" data-animate={motion.active} ref={motion.ref} role="status">
    <div className="lab-photo-reader" aria-hidden="true"><svg viewBox="0 0 84 70"><path d="M8 24V8h16M60 8h16v16M76 46v16H60M24 62H8V46" /><rect x="20" y="19" width="44" height="32" rx="1" /><path className="lab-photo-beam" d="M20 23H64" /></svg></div>
    <div><strong>{sample ? c.sample : c.photo}</strong><p>{c.photoStages[phase]}</p><small>{c.photoDetails[phase]}</small><span className="lab-photo-phases" aria-hidden="true">{c.photoStages.map((_, i) => <i key={i} data-active={i === phase} data-ready={i < phase} />)}</span></div>
  </div>;
}

export function InlineProcessing({ locale, kind }: { locale: Locale; kind: "question" | "compare" }) {
  const c = motionCopy[locale];
  const motion = useVisibleMotion();
  return <div className="lab-inline-processing" data-animate={motion.active} ref={motion.ref} role="status"><span className="lab-thinking-lines" aria-hidden="true"><i /><i /><i /></span><div><strong>{kind === "question" ? c.question : c.compare}</strong><p>{kind === "question" ? c.questionBody : c.compareBody}</p></div></div>;
}
