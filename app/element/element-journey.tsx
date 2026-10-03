"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "../site-header";
import { journeyMotion, journeyProgress } from "../../lib/element/journey-motion";
import { journeyCopy as copy } from "./journey-copy";
import { ElementSignature } from "./element-signature";
import "./element-journey.css";

const dropShape = "M50 3C48 41 8 73 8 103C8 128 25 142 50 142C75 142 92 128 92 103C92 73 52 41 50 3Z";

function JourneyArrow({ down = false }: { down?: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={down ? "M12 4v16m-6-6 6 6 6-6" : "M5 19 19 5M5 5h14v14"} stroke="currentColor" strokeWidth="1.3" /></svg>;
}

export function ElementJourney({ locale }: { locale: Locale }) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);
  const dropId = useId().replaceAll(":", "");

  useEffect(() => {
    const section = root.current, frame = stage.current;
    if (!section || !frame) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let request = 0, currentScene = 0, disposed = false;
    const update = () => {
      request = 0;
      if (document.hidden) return;
      const bounds = section.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > innerHeight) return;
      const motion = journeyMotion(journeyProgress(bounds.top, section.offsetHeight - frame.offsetHeight));
      const style = frame.style;
      section.dataset.progress = motion.progress.toFixed(3);
      style.setProperty("--journey-progress", String(motion.progress));
      style.setProperty("--board-opacity", String(motion.boardOpacity));
      style.setProperty("--board-scale", String(motion.boardScale));
      style.setProperty("--board-taper", String(motion.boardTaper));
      style.setProperty("--board-melt", String(motion.boardMelt));
      style.setProperty("--board-liquid", String(motion.boardLiquid));
      style.setProperty("--pipette-opacity", String(motion.pipetteOpacity));
      style.setProperty("--drop-opacity", String(motion.dropOpacity));
      style.setProperty("--signature-reveal", String(motion.signatureReveal));
      motion.papers.forEach((value, index) => style.setProperty(`--paper-${index}`, String(value)));
      motion.scenes.forEach((value, index) => style.setProperty(`--scene-${index}`, String(value)));

      // Melt the unchanged printed assembly into the actual glass footprint, across every viewport.
      const assembly = frame.querySelector<HTMLElement>(".ej-board-origin")?.getBoundingClientRect();
      const glass = frame.querySelector<HTMLElement>(".ej-pipette")?.getBoundingClientRect();
      if (assembly && glass && assembly.width > 0 && assembly.height > 0) {
        const melt = motion.boardMelt;
        style.setProperty("--melt-x", `${(glass.left + glass.width / 2 - assembly.left - assembly.width / 2) * melt}px`);
        style.setProperty("--melt-y", `${(glass.top + glass.height / 2 - assembly.top - assembly.height / 2) * melt}px`);
        style.setProperty("--melt-scale-x", String(1 + (glass.width / assembly.width - 1) * melt));
        style.setProperty("--melt-scale-y", String(1 + (glass.height / assembly.height - 1) * melt));
      }

      // The final target is the hanging drop in the supplied logo, measured from its real crop.
      const tip = frame.querySelector<HTMLElement>(".ej-pipette-tip")?.getBoundingClientRect();
      const target = frame.querySelector<HTMLElement>(".element-signature-target")?.getBoundingClientRect();
      const stageBounds = frame.getBoundingClientRect();
      if (tip && target) {
        const t = motion.dropProgress;
        const morph = motion.dropMorph;
        // HOME's SVG outline occupies x8..92 and y3..142 inside its 100x145 viewBox.
        const width = 22 + (target.width / .84 - 22) * morph;
        const height = 38 + (target.height * 145 / 139 - 38) * morph;
        const x = tip.left + tip.width / 2 + (target.left + target.width / 2 - tip.left - tip.width / 2) * t;
        const y = tip.top + (target.top - tip.top) * t;
        style.setProperty("--drop-x", `${x - stageBounds.left - width / 2}px`);
        style.setProperty("--drop-y", `${y - stageBounds.top - height * 3 / 145}px`);
        style.setProperty("--drop-width", `${width}px`);
        style.setProperty("--drop-height", `${height}px`);
      }
      if (currentScene !== motion.activeScene) { currentScene = motion.activeScene; setActive(currentScene); }
    };
    const schedule = () => { if (!disposed && !request) request = requestAnimationFrame(update); };
    const changePreference = () => { setReduced(preference.matches); schedule(); };
    const observer = new ResizeObserver(schedule);
    observer.observe(frame);
    preference.addEventListener("change", changePreference);
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    document.fonts.ready.then(schedule);
    changePreference();
    return () => {
      disposed = true;
      cancelAnimationFrame(request); observer.disconnect();
      preference.removeEventListener("change", changePreference);
      removeEventListener("scroll", schedule); removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, []);

  return <section className="element-journey" ref={root} id="top" aria-label={copy.label[locale]} data-reduced={reduced}>
    <div className="ej-stage" ref={stage}>
      <div className="ej-narrative">
        {copy.scenes.map((scene, index) => <div className={`ej-copy ej-copy-${index}`} key={scene.title.en} aria-hidden={reduced ? index !== 0 : active !== index} inert={reduced ? index !== 0 : active !== index}>
          {index === 0 ? <h1>{copy.initialLines.map((line, i) => <span key={line.en} className={i === 2 ? "ej-gold" : undefined}>{line[locale]}</span>)}</h1> : <h2>{scene.title[locale]}</h2>}
          <p>{scene.body[locale]}</p>
          {index === 0 || index === 4 ? <a href="/element/demo" className="ej-demo">{copy.demo[locale]}<JourneyArrow /></a> : null}
        </div>)}
      </div>
      <div className="ej-board-origin"><figure className="ej-board" aria-label={copy.boardAlt[locale]}><div className="ej-board-material">
        <img className="ej-board-print" src="/media/element-final-board.webp" alt={copy.boardAlt[locale]} width="1543" height="1254" fetchPriority="high" />
        <div className="ej-paper ej-paper-blot" aria-hidden="true"><img src="/media/element-blot-sheet.webp" alt="" /></div>
        <div className="ej-paper ej-paper-skin" aria-hidden="true"><img src="/media/element-ph-strip.webp" alt="" /></div>
        <div className="ej-paper ej-paper-control" aria-hidden="true"><img src="/media/element-ph-strip.webp" alt="" /></div>
      </div></figure></div>
      <div className="ej-pipette" aria-hidden="true"><img src="/media/element-home-pipette.png" alt="" width="940" height="1672" /><span className="ej-pipette-tip" /></div>
      <div className="ej-signature"><ElementSignature /></div>
      <svg className="ej-travelling-drop" viewBox="0 0 100 145" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <radialGradient id={`${dropId}-gold`} cx=".32" cy=".4" r=".76" gradientTransform="translate(0 .08) scale(1 .92)">
            <stop stopColor="#f8df91" /><stop offset=".3" stopColor="#d7a641" /><stop offset=".62" stopColor="#95590f" /><stop offset=".84" stopColor="#3e260d" /><stop offset=".95" stopColor="#98692b" /><stop offset="1" stopColor="#eed79c" />
          </radialGradient>
          <radialGradient id={`${dropId}-reflection`} gradientUnits="userSpaceOnUse" cx="29" cy="84" r="39" gradientTransform="translate(29 84) rotate(19) scale(.42 1) translate(-29 -84)">
            <stop stopColor="#fffdf0" stopOpacity=".95" /><stop offset=".28" stopColor="#fff6cc" stopOpacity=".72" /><stop offset=".64" stopColor="#ffebac" stopOpacity=".2" /><stop offset="1" stopColor="#ffebac" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${dropId}-bounce`} cx=".55" cy=".94" r=".5" gradientTransform="translate(0 .7) scale(1 .3)">
            <stop stopColor="#ffeab0" stopOpacity=".7" /><stop offset=".55" stopColor="#dca947" stopOpacity=".2" /><stop offset="1" stopColor="#dca947" stopOpacity="0" />
          </radialGradient>
          <path id={`${dropId}-outline`} d={dropShape} />
        </defs>
        <use href={`#${dropId}-outline`} fill={`url(#${dropId}-gold)`} stroke="#e9ca82" strokeOpacity=".5" strokeWidth=".65" />
        <use href={`#${dropId}-outline`} fill={`url(#${dropId}-reflection)`} />
        <use href={`#${dropId}-outline`} fill={`url(#${dropId}-bounce)`} />
      </svg>
      <div className="ej-bottom"><span className="ej-scroll">{copy.scroll[locale]}<JourneyArrow down /></span><p>{copy.caption[locale]}</p><a href="#how-it-works">{copy.explore[locale]}<JourneyArrow down /></a><div className="ej-progress" aria-hidden="true" /></div>
    </div>
  </section>;
}
