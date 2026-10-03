"use client";

import { useState } from "react";
import SiteHeader, { useLocale, type Locale } from "../site-header";
import { baseNames, elementCopy as c, text } from "./content";
import { landingCopy as l } from "./landing-copy";
import { ElementJourney } from "./element-journey";
import { ElementSignature } from "./element-signature";
import { StyledQr } from "./styled-qr";
import { LabTabs, ElementFooter, ClaimLink, NoteGraph } from "./lab-notes";
import "./element-landing.css";

function Arrow({ down = false }: { down?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={down ? "M12 4v16m-6-6 6 6 6-6" : "M5 19 19 5M5 5h14v14"} stroke="currentColor" strokeWidth="1.2" /></svg>;
}

function BoardImage({ locale, highlight }: { locale: Locale; highlight?: number }) {
  return <div className="e-board-image" data-highlight={highlight}>
    <img src="/media/element-final-board.webp" alt={l.boardAlt[locale]} width="1543" height="1254" loading="lazy" />
    {highlight === 2 ? [0, 1, 2, 3, 4, 5, 6, 7].map(marker => <span className={`e-marker-ring e-marker-${marker}`} key={marker} aria-hidden="true" />)
      : highlight !== undefined && <span className={`e-board-highlight e-board-highlight-${highlight}`} aria-hidden="true" />}
  </div>;
}

function CompositionMark() {
  return <svg className="e-composition-mark" viewBox="0 0 220 160" fill="none" aria-hidden="true"><path d="M30 38H65M30 80H65M30 122H65M154 38H190M154 80H190M154 122H190" stroke="#798f9b" /><rect x="65" y="24" width="88" height="28" rx="14" stroke="#798f9b" /><rect x="52" y="66" width="114" height="28" rx="14" stroke="#4f6674" /><rect x="39" y="108" width="140" height="28" rx="14" stroke="#223541" /><path d="M109 53V65M109 95V107" stroke="#798f9b" /><circle cx="30" cy="38" r="3" fill="#223541" /><circle cx="30" cy="80" r="3" fill="#223541" /><circle cx="30" cy="122" r="3" fill="#223541" /></svg>;
}

function BoardExplorer({ locale }: { locale: Locale }) {
  const [selected, setSelected] = useState(0);
  return <section className="e-board-section" id="the-board" aria-labelledby="board-title">
    <div className="e-section-heading"><h2 id="board-title">{l.boardHeading[locale]}</h2></div>
    <div className="e-board-layout"><figure><BoardImage locale={locale} highlight={selected} /><figcaption>{l.boardCaption[locale]}</figcaption></figure>
      <div className="e-board-details"><p>{c.lid[locale]}</p><span className="e-board-hint">{l.boardHint[locale]}</span>
        <div className="e-board-options">{l.boardDetails.map(([number, title], index) => <button key={title.en} type="button" aria-pressed={selected === index} aria-controls="board-description" onClick={() => setSelected(index)}><span>{number[locale]}</span>{title[locale]}<Arrow /></button>)}</div>
        <p className="e-board-description" id="board-description" aria-live="polite">{l.boardDetails[selected][2][locale]}</p><ClaimLink id="kit-validation" locale={locale} />
      </div>
    </div>
  </section>;
}

export default function ElementExperience() {
  const [locale, setLocale] = useLocale();
  return <>
    <a className="skip-link" href="#how-it-works">{c.skip[locale]}</a><SiteHeader locale={locale} onLocaleChange={setLocale} subpage />
    <main className="element-page e-editorial">
      <ElementJourney locale={locale} />
      <section className="e-introduction e-section"><h2>{c.problem[locale]}</h2><div><p>{c.problemBody[locale]}</p><span className="e-small-note">{l.atHome[locale]} · {l.minutes[locale]}</span></div></section>
      <section className="e-section e-how" id="how-it-works"><div className="e-section-heading"><h2>{c.how[locale]}</h2><p>{c.prototype[locale]}</p></div>
        <ol>{c.steps.map(([title, body], index) => <li key={title.en}><span className="e-step-index">0{index + 1}</span><div className="e-step-art" aria-hidden="true">{index === 0 ? <img src="/media/element-final-board.webp" alt="" loading="lazy" width="1543" height="1254" /> : index === 1 ? <CompositionMark /> : <img src="/media/element-scent-study.webp" alt="" loading="lazy" width="1536" height="1024" />}</div><h3>{title[locale]}</h3><p>{body[locale]}</p></li>)}</ol><ClaimLink id="kit-validation" locale={locale} />
      </section>
      <BoardExplorer locale={locale} />
      <section className="e-section e-kit"><figure><img src="/media/element-scent-study.webp" alt={l.photoAlt[locale]} loading="lazy" width="1536" height="1024" /><figcaption>{l.concept[locale]}</figcaption></figure><div><h2>{c.kit[locale]}</h2><ul>{c.kitItems.map((item, index) => <li key={item.en}><span>0{index + 1}</span>{item[locale]}</li>)}</ul></div></section>
      <section className="e-section e-bases" id="starting-points"><div className="e-section-heading"><h2>{c.bases[locale]}</h2><p>{c.samples[locale]}</p></div>
        <figure className="e-base-study"><img src="/media/element-base-vials.webp" alt={l.baseStudyAlt[locale]} width="1536" height="1024" loading="lazy" /><figcaption>{l.concept[locale]}</figcaption></figure><div className="e-base-lineup">{baseNames.map((name, index) => <article key={name}><div className="e-base-portrait" style={{ backgroundPosition: `${index * 20}% center` }} aria-hidden="true" /><span className="e-base-index">0{index + 1}</span><span className="e-family">{c.families[index][locale]}</span><h3>{name}</h3></article>)}</div><p className="e-small-note e-base-concept">{l.concept[locale]}</p><p className="e-small-note">{l.blindNote[locale]}</p>
      </section>
      <section className="e-section e-science"><figure><img src="/media/element-daylight-lab.webp" alt={text("Concept illustration of glass laboratory vessels and a pipette in warm light", "暖光下玻璃實驗器皿與滴管的概念插圖", "暖光下玻璃实验器皿与滴管的概念插图")[locale]} loading="lazy" width="1536" height="1024" /><figcaption>{l.concept[locale]}</figcaption></figure><div><h2>{c.science[locale]}</h2><p>{c.scienceBody[locale]}</p><div className="claim-links"><ClaimLink id="smell-relay" locale={locale} /><ClaimLink id="receptor-variation" locale={locale} /></div><a className="e-text-action" href="/element/science">{c.tabs[1][locale]}<Arrow /></a></div></section>
      <section className="e-section e-ai"><div><h2>{l.figureTitle[locale]}</h2><p>{c.aiBody[locale]}</p><p className="e-small-note">{c.steps[1][1][locale]}</p><a className="e-text-action" href="/element/ai">{c.tabs[0][locale]}<Arrow /></a><ClaimLink id="kit-validation" locale={locale} /></div><figure><NoteGraph locale={locale} /><figcaption>{l.tuningNote[locale]}</figcaption></figure></section>
      <section className="e-section e-pause"><span className="e-pause-number" aria-hidden="true">15<span>s</span></span><div><h2>{c.honest[locale]}</h2><p>{c.honestBody[locale]}</p><div className="claim-links"><ClaimLink id="coffee-beans" locale={locale} /><ClaimLink id="timed-pause" locale={locale} /></div></div></section>
      <section className="e-section e-pricing"><div className="e-section-heading"><h2>{c.pricing[locale]}</h2><p>{l.priceNote[locale]}</p></div><div className="e-price-grid">{[[c.labKit, "988", c.labBody], [c.discovery, "188", c.discoveryBody]].map(([name, amount, body], index) => <article key={index}><h3>{typeof name !== "string" && name[locale]}</h3><p className="e-price"><span>HK$</span>{amount as string}</p><p>{typeof body !== "string" && body[locale]}</p><a className={index === 0 ? "e-button" : "e-text-action"} href="/shop?source=element-order#newsletter">{l.waitlist[locale]}<Arrow /></a></article>)}</div><p className="e-small-note">{c.waitlist[locale]}</p></section>
      <section className="e-section e-faq"><div><h2>{c.faq[locale]}</h2><p className="e-small-note">{c.disclaimer[locale]}</p></div><div>{c.questions.map(([question, answer], index) => <details key={index}><summary>{question[locale]}<span aria-hidden="true">+</span></summary><p>{answer[locale]} <ClaimLink id={index === 3 ? "receptor-variation" : "kit-validation"} locale={locale} /></p></details>)}</div></section>
      <section className="e-section e-notes"><h2>{c.notes[locale]}</h2><p>{c.notesBody[locale]}</p><LabTabs locale={locale} /></section>
      <section className="e-section e-closing"><div><ElementSignature /><h2>{c.closing[locale]}</h2><div className="e-actions"><a className="e-button" href="/element/demo">{c.demo[locale]}<Arrow /></a><a className="e-text-action" href="/shop?source=element-order#newsletter">{l.waitlist[locale]}<Arrow /></a></div><p className="e-small-note">{c.prototype[locale]}</p></div><figure><a href="/element/demo" aria-label={c.demo[locale]}><StyledQr value="https://yatlifestyle.com/element/demo" size={184} /></a><figcaption>{c.scan[locale]}</figcaption></figure></section>
    </main><ElementFooter locale={locale} />
  </>;
}
