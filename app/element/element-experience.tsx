"use client";

import { useEffect, useRef, useState } from "react";
import SiteHeader, { useLocale, type Locale } from "../site-header";
import { STORY_FRAMES, storyMotion } from "../../lib/story-motion";
import { baseNames, elementCopy as c, text } from "./content";
import { StyledQr } from "./styled-qr";
import { LabTabs, ElementFooter, ClaimLink, NoteGraph } from "./lab-notes";

const story = [
  [text("A drop. A starting point.", "一滴，作為起點。", "一滴，作为起点。"), c.tagline],
  [text("01 / Notice your skin", "01 / 留意肌膚", "01 / 留意肌肤"), text("The blot darkens. Zone 1 gives the photo reader a fixed frame and a dry reference.", "吸油紙漸深。區域 1 為照片讀取提供固定範圍與乾燥對照。", "吸油纸渐深。区域 1 为照片读取提供固定范围与干燥对照。")],
  [text("02 / Record, don't assume", "02 / 記錄，不作假設", "02 / 记录，不作假设"), text("Skin and control strips change colour. We record pH with a confidence note. It never changes the formula.", "肌膚與對照試紙變色。我們記錄 pH 與可信度說明，它不會改變配方。", "肌肤与对照试纸变色。我们记录 pH 与可信度说明，它不会改变配方。")],
  [text("03 / Follow your answers", "03 / 跟隨你的回答", "03 / 跟随你的回答"), text("A routine. A memory. A scent you dislike. Each answer shapes the next question.", "一個習慣，一段記憶，一款不喜歡的香氣。每個回答引導下一個問題。", "一个习惯，一段记忆，一款不喜欢的香气。每个回答引导下一个问题。")],
  [text("04 / Connect the notes", "04 / 連結香調", "04 / 连接香调"), c.aiBody],
  [text("05 / Find your element", "05 / 找到你的 Element", "05 / 找到你的 Element"), c.review],
];

function ElementStory({ locale }: { locale: Locale }) {
  const journey = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const logo = useRef<HTMLImageElement>(null);
  const [reduced, setReduced] = useState(true);
  const [chapter, setChapter] = useState(0);
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (reduced) return;
    const root = journey.current, frame = stage.current, surface = canvas.current;
    const ctx = surface?.getContext("2d");
    if (!root || !frame || !surface || !ctx) return;
    let request = 0, disposed = false;
    const images = Array.from({ length: STORY_FRAMES }, () => new Image());
    const draw = () => {
      request = 0;
      if (disposed || document.hidden) return;
      const bounds = root.getBoundingClientRect();
      if (bounds.top > innerHeight || bounds.bottom < 0) return;
      const mark = logo.current?.getBoundingClientRect();
      const stageBounds = frame.getBoundingClientRect();
      const aspect = logo.current?.naturalWidth && logo.current?.naturalHeight ? logo.current.naturalWidth / logo.current.naturalHeight : 1.32;
      const markWidth = mark ? Math.min(mark.width, mark.height * aspect) : 0;
      const markHeight = markWidth / aspect;
      const targetX = mark ? mark.left - stageBounds.left + (mark.width - markWidth) / 2 + markWidth * .55 : frame.clientWidth * .72;
      const targetY = mark ? mark.top - stageBounds.top + (mark.height - markHeight) / 2 + markHeight * .4 : frame.offsetHeight * .52;
      const motion = storyMotion(bounds.top, root.offsetHeight, frame.offsetHeight, targetY);
      const next = Math.min(5, Math.floor(motion.progress * 6));
      setChapter(previous => previous === next ? previous : next);
      frame.style.setProperty("--element-settle", String(motion.settle));
      frame.style.setProperty("--element-film", String(motion.filmOpacity));
      frame.style.setProperty("--element-drop-x", `${frame.clientWidth * (frame.clientWidth < 680 ? .5 : .65) + (targetX - frame.clientWidth * (frame.clientWidth < 680 ? .5 : .65)) * motion.settle}px`);
      frame.style.setProperty("--element-drop-y", `${motion.focusY}px`);
      frame.style.setProperty("--element-drop-width", `${55 + (markWidth * .06 - 55) * motion.settle}px`);
      frame.style.setProperty("--element-drop-opacity", String(motion.vectorOpacity * (1 - motion.signatureReveal)));
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const w = Math.round(frame.clientWidth * ratio), h = Math.round(frame.clientHeight * ratio);
      if (surface.width !== w || surface.height !== h) { surface.width = w; surface.height = h; }
      ctx.clearRect(0, 0, w, h);
      let index = motion.frame;
      while (index > 0 && !images[index].naturalWidth) index--;
      const image = images[index];
      if (image.naturalWidth) {
        const width = Math.min(w, h * .64);
        ctx.drawImage(image, (w - width) * .75, 0, width, h);
      }
    };
    const schedule = () => { if (!disposed && !request) request = requestAnimationFrame(draw); };
    images.forEach((image, index) => { image.onload = schedule; image.src = `/media/drop-sequence/frame-${String(index).padStart(3, "0")}.webp`; });
    addEventListener("scroll", schedule, { passive: true }); addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule); schedule();
    return () => { disposed = true; cancelAnimationFrame(request); images.forEach(image => { image.onload = null; }); removeEventListener("scroll", schedule); removeEventListener("resize", schedule); document.removeEventListener("visibilitychange", schedule); };
  }, [reduced]);
  return <section className={`element-journey${reduced ? " element-stills" : ""}`} ref={journey} id="top" aria-label={c.how[locale]}>
    <div className="element-stage" ref={stage} data-chapter={chapter}>
      <div className="element-film" aria-hidden="true"><img src="/media/hong-kong-drop-mobile-poster.jpg" alt="" /><canvas ref={canvas} /></div>
      <div className="element-story-art" aria-hidden="true">
        <div className="story-board"><div className="board-zone zone-blot"><span>01</span><div className="blot-sheet" /></div><div className="board-zone zone-ph"><span>02</span><i /><i /><i /></div><div className="board-marker" /></div>
        <div className="story-chips">{[text("Tea", "茶", "茶"), text("Outdoors", "戶外", "户外"), text("Skin-close", "貼膚", "贴肤")].map(t => <span key={t.en}>{t[locale]}</span>)}</div>
        <div className="story-graph"><NoteGraph locale={locale} /></div>
        <img className="story-element-logo" src="/media/element-logo.png" alt="" ref={logo} />
      </div>
      {!reduced && <svg className="element-settling-drop" viewBox="0 0 100 145" aria-hidden="true"><defs><radialGradient id="element-liquid-gold" cx=".3" cy=".4" r=".8"><stop stopColor="#fff1b0" /><stop offset=".45" stopColor="#d8a443" /><stop offset=".8" stopColor="#674013" /><stop offset="1" stopColor="#e7c984" /></radialGradient></defs><path d="M50 3C48 41 8 73 8 103C8 128 25 142 50 142C75 142 92 128 92 103C92 73 52 41 50 3Z" fill="url(#element-liquid-gold)" /></svg>}
      {story.map(([title, body], index) => <div className={`element-story-panel${index === 0 ? " element-opening" : ""}`} data-active={chapter === index} key={index} aria-hidden={!reduced && chapter !== index} inert={!reduced && chapter !== index}>
        {index === 0 ? <>
          <img className="element-hero-mark" src="/media/element-logo.png" alt="Element · YAT.lifestyle" /><span className="eyebrow">ELEMENT / YAT.lifestyle</span><h1>{c.tagline[locale]}</h1><p className="element-subline">{c.subline[locale]}</p><p>{c.intro[locale]}</p>
          <div className="element-actions"><a className="action primary" href="/element/demo">{c.demo[locale]} ↗</a><a className="action" href="#how-it-works">{c.how[locale]}</a></div><small>{c.price[locale]}</small>
        </> : <><span className="eyebrow">ELEMENT / {String(index).padStart(2, "0")}</span><h2>{title[locale]}</h2><p>{body[locale]}</p>{index === 2 && <ClaimLink id="kit-validation" locale={locale} />}</>}
        {reduced && index > 0 && <img className="element-still-image" src={index === 5 ? "/media/element-logo.png" : "/kit/lid-board.svg"} alt="" loading="lazy" />}
      </div>)}
      {!reduced && <div className="element-story-progress" aria-hidden="true">{story.map((_, index) => <span key={index} data-active={index === chapter} />)}</div>}
    </div>
  </section>;
}

export default function ElementExperience() {
  const [locale, setLocale] = useLocale();
  return <>
    <a className="skip-link" href="#how-it-works">{c.skip[locale]}</a><SiteHeader locale={locale} onLocaleChange={setLocale} subpage />
    <main className="element-page">
      <ElementStory locale={locale} />
      <section className="element-section element-problem"><span className="eyebrow">01 / ELEMENT</span><h2>{c.problem[locale]}</h2><p>{c.problemBody[locale]}</p></section>
      <section className="element-section element-science"><div><span className="eyebrow">02 / ELEMENT</span><h2>{c.science[locale]}</h2><h3>{c.relay[locale]}</h3><p>{c.scienceBody[locale]}</p><div className="claim-links"><ClaimLink id="smell-relay" locale={locale} /><ClaimLink id="receptor-variation" locale={locale} /></div></div><figure><img src="/media/element-daylight-lab.webp" alt={text("Illustrated laboratory glass and a pipette", "玻璃器皿與滴管概念圖", "玻璃器皿与滴管概念图")[locale]} loading="lazy" /><figcaption>{text("Laboratory study. Generated illustration.", "實驗室概念，生成插圖。", "实验室概念，生成插图。")[locale]}</figcaption></figure></section>
      <section className="element-section element-how" id="how-it-works"><span className="eyebrow">03 / ELEMENT</span><h2>{c.how[locale]}</h2><ol>{c.steps.map(([title, body], i) => <li key={i}><span className="step-number">0{i + 1}</span><img src={i === 0 ? "/kit/lid-board.svg" : i === 1 ? "/media/element-daylight-lab.webp" : "/media/element-lab.webp"} alt="" loading="lazy" /><h3>{title[locale]}</h3><p>{body[locale]}</p></li>)}</ol><p className="element-fine">{c.prototype[locale]} <ClaimLink id="kit-validation" locale={locale} /></p></section>
      <section className="element-section element-kit"><figure><img src="/media/element-kit-study.svg" alt={c.kitCaption[locale]} loading="lazy" /><figcaption>{c.kitCaption[locale]}</figcaption></figure><div><span className="eyebrow">04 / ELEMENT</span><h2>{c.kit[locale]}</h2><ul>{c.kitItems.map(item => <li key={item.en}>{item[locale]}</li>)}</ul><p>{c.lid[locale]}</p></div></section>
      <section className="element-section element-bases"><h2>{c.bases[locale]}</h2><p className="element-fine">{c.samples[locale]}</p><div className="base-list">{baseNames.map((name, i) => <div key={name}><span>{String.fromCharCode(65 + i)}</span><h3>{name}</h3><p>{c.families[i][locale]}</p></div>)}</div></section>
      <section className="element-section element-ai"><div><span className="eyebrow">05 / ELEMENT</span><h2>{c.ai[locale]}</h2><p>{c.aiBody[locale]}</p><p className="element-fine">{c.steps[1][1][locale]}</p><a className="text-link" href="/element/ai">{c.tabs[0][locale]} ↗</a><ClaimLink id="kit-validation" locale={locale} /></div><NoteGraph locale={locale} /></section>
      <section className="element-section element-pause"><span className="eyebrow">06 / ELEMENT</span><h2>{c.honest[locale]}</h2><p>{c.honestBody[locale]}</p><div className="claim-links"><ClaimLink id="coffee-beans" locale={locale} /><ClaimLink id="timed-pause" locale={locale} /></div></section>
      <section className="element-section element-pricing"><span className="eyebrow">07 / ELEMENT</span><h2>{c.pricing[locale]}</h2><div className="price-grid">{[[c.labKit, "988", c.labBody], [c.discovery, "188", c.discoveryBody]].map(([name, amount, body]) => <article key={amount as string}><h3>{typeof name !== "string" && name[locale]}</h3><p className="price">HK${amount as string}</p><p>{typeof body !== "string" && body[locale]}</p><a className="action primary" href="/shop?source=element-order#newsletter">{c.order[locale]} ↗</a></article>)}</div><p className="element-fine">{c.waitlist[locale]}</p></section>
      <section className="element-section element-faq"><h2>{c.faq[locale]}</h2>{c.questions.map(([question, answer], index) => <details key={index}><summary>{question[locale]}<span aria-hidden="true">+</span></summary><p>{answer[locale]} <ClaimLink id={index === 3 ? "receptor-variation" : "kit-validation"} locale={locale} /></p></details>)}<p className="element-fine">{c.disclaimer[locale]}</p></section>
      <section className="element-section element-lab-notes"><span className="eyebrow">08 / ELEMENT</span><h2>{c.notes[locale]}</h2><p>{c.notesBody[locale]}</p><LabTabs locale={locale} /></section>
      <section className="element-section element-closing"><div><img src="/media/element-logo.png" alt="Element · YAT.lifestyle" width="180" /><h2>{c.closing[locale]}</h2><div className="element-actions"><a className="action primary" href="/element/demo">{c.demo[locale]} ↗</a><a className="action" href="/shop?source=element-order#newsletter">{c.order[locale]}</a></div><p className="element-fine">{c.review[locale]}<br />{c.disclaimer[locale]}</p></div><figure><a href="/element/demo" aria-label={c.demo[locale]}><StyledQr value="https://yatlifestyle.com/element/demo" size={216} /></a><figcaption>{c.scan[locale]}</figcaption></figure></section>
    </main><ElementFooter locale={locale} />
  </>;
}
