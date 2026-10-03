"use client";

import { Fragment, type ReactNode, useEffect, useState } from "react";
import SiteHeader, { type Locale, useLocale } from "../../site-header";
import { elementCopy as c } from "../content";
import { ElementFooter, LabTabs } from "../lab-notes";
import { references, techCopy as tc, type TechStep } from "../../../lib/element/tech-content";

/** Turns "[6, 14]" in copy into links to the reference list. */
function Cited({ text }: { text: string }) {
  return <>{text.split(/(\[\d+(?:, \d+)*\])/).map((part, i) => {
    const nums = part.match(/^\[(\d+(?:, \d+)*)\]$/)?.[1].split(", ");
    if (!nums) return <Fragment key={i}>{part}</Fragment>;
    return <span className="tech-cite" key={i}>[{nums.map((n, j) => <Fragment key={n}>{j ? ", " : ""}<a href={`#ref-${n}`} aria-label={`Reference ${n}`}>{n}</a></Fragment>)}]</span>;
  })}</>;
}

// Rough text fitting for SVG: CJK glyphs are about 1 em wide, Latin about 0.56 em.
// Tokens are single CJK characters or Latin words with their trailing space.
const ems = (s: string) => [...s].reduce((w, ch) => w + (/[　-鿿＀-￯]/.test(ch) ? 1 : 0.56), 0);
function wrap(text: string, width: number, size: number): string[] {
  const lines = [""];
  for (const token of text.match(/[　-鿿＀-￯]|[^\s　-鿿＀-￯]+\s*|\s+/g) ?? [text]) {
    const line = lines[lines.length - 1];
    if (line && ems(line + token.trimEnd()) * size > width) lines.push(token.trimStart());
    else lines[lines.length - 1] = line + token;
  }
  const out = lines.map(l => l.trim()).filter(Boolean);
  // No orphan: a lone CJK character on the last line takes one more from the line above.
  const n = out.length;
  if (n > 1 && [...out[n - 1]].length === 1 && /[　-鿿]$/.test(out[n - 2])) { const prev = [...out[n - 2]]; out[n - 1] = prev.pop() + out[n - 1]; out[n - 2] = prev.join("").trim(); }
  return out;
}

const INK = "#080806", PANEL = "#14130e", WARM = "#f1eadc", MUTED = "#aaa499", GOLD = "#d8a443", RULE = "rgba(241,234,220,.28)";

function Diagram({ locale, narrow }: { locale: Locale; narrow: boolean }) {
  const W = narrow ? 360 : 1000, cols = narrow ? 2 : 5, pad = narrow ? 12 : 32, gap = narrow ? 14 : 28;
  const fs = narrow ? 12.5 : 15, ts = narrow ? 10 : 12, lh = fs * 1.3, inner = narrow ? 10 : 14;
  const nodeW = (W - pad * 2 - gap * (cols - 1)) / cols;
  const lanes: { label: string; steps: TechStep[] }[] = [{ label: tc.dataLane[locale], steps: tc.steps }, { label: tc.buildLane[locale], steps: tc.build }];
  const text = (s: TechStep, i: number) => ({ label: wrap(`${String(i + 1).padStart(2, "0")}  ${s.node[locale]}`, nodeW - inner * 2 - (s.ai ? fs * 1.6 : 0), fs), tools: wrap(s.tools, nodeW - inner * 2, ts) });
  const all = lanes.flatMap(l => l.steps.map(text));
  const nodeH = inner * 2 + Math.max(...all.map(n => n.label.length * lh + n.tools.length * ts * 1.3 + 4));
  const rowGap = narrow ? 22 : 30, laneHead = narrow ? 30 : 40, laneGap = narrow ? 26 : 40;
  let y = pad;
  const blocks = lanes.map(lane => {
    const top = y, rows = Math.ceil(lane.steps.length / cols);
    const nodes = lane.steps.map((s, i) => {
      const row = Math.floor(i / cols), k = i % cols, col = row % 2 ? cols - 1 - k : k;
      return { s, i, ...text(s, i), x: pad + col * (nodeW + gap), y: top + laneHead + row * (nodeH + rowGap), row };
    });
    y = top + laneHead + rows * nodeH + (rows - 1) * rowGap + laneGap;
    return { ...lane, top, nodes };
  });
  const H = y - laneGap + pad;
  return (
    <svg className={narrow ? "tech-diagram-narrow" : "tech-diagram-wide"} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={tc.diagramLabel[locale]}>
      <defs><marker id={`arrow-${narrow ? "n" : "w"}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill={GOLD} /></marker></defs>
      <rect width={W} height={H} fill={INK} />
      {blocks.map((b, bi) => <g key={bi}>
        {bi > 0 && <line x1={pad} x2={W - pad} y1={b.top - laneGap / 2} y2={b.top - laneGap / 2} stroke={RULE} strokeDasharray="3 6" />}
        <text x={pad} y={b.top + (narrow ? 14 : 18)} fill={GOLD} fontSize={narrow ? 11 : 13} letterSpacing=".12em">{b.label.toUpperCase()}</text>
        {b.nodes.slice(1).map((n, k) => {
          const a = b.nodes[k], sameRow = a.row === n.row, right = n.x > a.x;
          const [x1, y1, x2, y2] = sameRow
            ? [right ? a.x + nodeW : a.x, a.y + nodeH / 2, right ? n.x - 2 : n.x + nodeW + 2, n.y + nodeH / 2]
            : [a.x + nodeW / 2, a.y + nodeH, n.x + nodeW / 2, n.y - 2];
          return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={GOLD} strokeWidth="1.2" markerEnd={`url(#arrow-${narrow ? "n" : "w"})`} />;
        })}
        {b.nodes.map(n => <g key={n.i}>
          <rect x={n.x} y={n.y} width={nodeW} height={nodeH} rx="3" fill={PANEL} stroke={n.s.ai ? GOLD : RULE} strokeWidth={n.s.ai ? 1.6 : 1} />
          {n.s.ai && <text x={n.x + nodeW - inner} y={n.y + inner + fs * 0.8} textAnchor="end" fill={GOLD} fontSize={ts} fontWeight="600">{tc.aiMark[locale]}</text>}
          <text x={n.x + inner} y={n.y + inner + fs * 0.85} fill={WARM} fontSize={fs}>{n.label.map((line, li) => <tspan key={li} x={n.x + inner} dy={li ? lh : 0} fill={li === 0 ? undefined : WARM}>{li === 0 ? <><tspan fill={GOLD}>{line.slice(0, 2)}</tspan>{line.slice(2)}</> : line}</tspan>)}</text>
          <text x={n.x + inner} y={n.y + inner + fs * 0.85 + n.label.length * lh + 4} fill={MUTED} fontSize={ts}>{n.tools.map((line, li) => <tspan key={li} x={n.x + inner} dy={li ? ts * 1.3 : 0}>{line}</tspan>)}</text>
        </g>)}
      </g>)}
    </svg>
  );
}

function Section({ id, children, className = "" }: { id: string; children: ReactNode; className?: string }) {
  return <section className={`lab-section tech-section ${className}`} id={id}>{children}</section>;
}

export default function TechPage() {
  const [locale, setLocale] = useLocale();
  const nav: [string, string][] = [["abstract", tc.abstractNav[locale]], ["methods", tc.methodsNav[locale]], ["results", tc.resultsNav[locale]], ["limitations", tc.limitsNav[locale]], ["stack", tc.stackNav[locale]], ["references", tc.refsNav[locale]]];
  // Highlight the section crossing a band a third of the way down the viewport; stack sub-sections count as "stack".
  const [active, setActive] = useState("abstract");
  useEffect(() => {
    const top = new Set(["abstract", "methods", "results", "limitations", "stack", "references"]);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(top.has(entry.target.id) ? entry.target.id : "stack");
    }, { rootMargin: "-33% 0px -62% 0px" });
    document.querySelectorAll(".tech-section").forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return <><a className="skip-link" href="#tech-content">{tc.title[locale]}</a><SiteHeader locale={locale} onLocaleChange={setLocale} subpage />
    <main className="lab-page tech-page" id="top">
      <header className="lab-heading"><a className="text-link" href="/element">← {c.back[locale]}</a><span className="eyebrow">ELEMENT / {c.notes[locale]}</span><h1>{tc.title[locale]}</h1><p>{tc.intro[locale]}</p><LabTabs locale={locale} active="tech" /></header>
      <nav className="research-index tech-index" aria-label={tc.onPage[locale]}>{nav.map(([id, label]) => <a href={`#${id}`} key={id}>{label} ↓</a>)}</nav>
      <div className="tech-layout" id="tech-content">
        <Section id="abstract"><aside className="tech-abstract"><h2>{tc.abstractTitle[locale]}</h2><p><Cited text={tc.abstract[locale]} /></p></aside></Section>
        <nav className="tech-toc" aria-label={tc.onPage[locale]}><p>{tc.onPage[locale]}</p><ol>{nav.map(([id, label]) => <li key={id}><a href={`#${id}`} aria-current={active === id ? "location" : undefined}>{label}</a></li>)}</ol></nav>
        <div className="tech-body">

        <Section id="methods">
          <h2>{tc.journeyTitle[locale]}</h2><p>{tc.journeyIntro[locale]}</p>
          <figure className="tech-diagram"><Diagram locale={locale} narrow={false} /><Diagram locale={locale} narrow /><figcaption>{tc.diagramCaption[locale]}</figcaption></figure>
          <ol className="tech-steps">{tc.steps.map((s, i) => <li key={i}><span className="tech-step-n">{String(i + 1).padStart(2, "0")}</span><div><h3>{s.title[locale]}{s.ai && <span className="tech-ai">{tc.aiMark[locale]}</span>}</h3><p><Cited text={s.body[locale]} /></p><small>{s.tools}</small></div></li>)}</ol>
          <h3 className="tech-sub">{tc.buildTitle[locale]}</h3>
          <ol className="tech-build">{tc.build.map((s, i) => <li key={i}><span className="tech-step-n">{String(i + 1).padStart(2, "0")}</span><h4>{s.title[locale]}</h4><p><Cited text={s.body[locale]} /></p><small>{s.tools}</small></li>)}</ol>
        </Section>

        <Section id="results">
          <h2>{tc.resultsTitle[locale]}</h2><p>{tc.resultsIntro[locale]}</p>
          <div className="tech-results">{tc.results.map((r, i) => <article key={i}><span className="eyebrow">2.{i + 1}</span><h3>{r.title[locale]}</h3><p><Cited text={r.body[locale]} /></p></article>)}</div>
        </Section>

        <Section id="limitations">
          <h2>{tc.limitsTitle[locale]}</h2>
          <ul className="tech-limits">{tc.limits.map((l, i) => <li key={i}><Cited text={l[locale]} /></li>)}</ul>
        </Section>

        <Section id="stack" className="tech-stack-head"><h2>{tc.stackTitle[locale]}</h2><p>{tc.stackIntro[locale]}</p><nav className="research-index" aria-label={tc.stackTitle[locale]}>{tc.sections.map(s => <a href={`#${s.id}`} key={s.id}>{s.title[locale]} ↓</a>)}</nav></Section>
        {tc.sections.map(section => <Section id={section.id} key={section.id}>
          <h2>{section.title[locale]}</h2><p><Cited text={section.overview[locale]} /></p>
          <div className="tech-entries">{section.entries.map(e => <article className="tech-entry" key={e.mark + e.name.en}>
            <header><span className="tech-mono" aria-hidden="true">{e.mark}</span><h3>{e.href ? <a href={e.href} rel="noreferrer" target="_blank">{e.name[locale]} ↗</a> : e.name[locale]}</h3></header>
            <p><Cited text={e.why[locale]} /></p>
            <aside className="tech-cost"><span>{tc.cost[locale]}</span><p><Cited text={e.cost[locale]} /></p></aside>
          </article>)}</div>
        </Section>)}

        <Section id="references">
          <h2>{tc.refsTitle[locale]}</h2><p>{tc.refsIntro[locale]}</p>
          <ol className="tech-refs">{references.map(r => <li id={`ref-${r.n}`} key={r.n} className={r.code ? "tech-ref-code" : undefined}><span className="tech-step-n">[{r.n}]</span><p>{r.text}{r.href && <> <a href={r.href} rel="noreferrer" target="_blank">{new URL(r.href).hostname} ↗</a></>}{r.claim && <> <a href={`/element/research#${r.claim}`}>{tc.reviewed[locale]} ↗</a></>}</p></li>)}</ol>
        </Section>
        </div>
      </div>
      <section className="lab-end"><p>{c.review[locale]}<br />{c.disclaimer[locale]}</p><a className="action primary" href="/element/demo">{c.demo[locale]} ↗</a></section>
    </main><ElementFooter locale={locale} /></>;
}
