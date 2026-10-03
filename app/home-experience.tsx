"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { STORY_FRAMES, dropTipGeometry, storyMotion } from "../lib/story-motion";
import SiteHeader, { useLocale, type Locale } from "./site-header";
import { elementCopy as c, text } from "./element/content";

const makeCopy = (locale: Locale) => {
  const tr = (en: string, hant: string, hans: string) => text(en, hant, hans)[locale];
  return {
    contact: { press: tr("Press & collaborations", "傳媒與合作", "媒体与合作"), general: tr("General inquiries", "一般查詢", "一般咨询") },
    hero: { title: c.tagline[locale], intro: c.subline[locale], explore: c.demo[locale], story: c.how[locale], note: c.price[locale] },
    collections: {
      title: tr("Regular lines", "常規系列", "常规系列"),
      intro: tr("Also from YAT.lifestyle. Hours and Afterimage are ideas in development, and the starting points for Element's six sample bases.", "同樣來自 YAT.lifestyle。Hours 與 Afterimage 是開發中的構想，也是 Element 六款示例基底的起點。", "同样来自 YAT.lifestyle。Hours 与 Afterimage 是开发中的构想，也是 Element 六款示例基底的起点。"),
      hours: { title: "Hours", line: tr("Idea in development", "開發中的構想", "开发中的构想"), body: tr("Dawn, Noon, Night. Fragrance studies shaped by Hong Kong's changing light, air and pace.", "Dawn、Noon、Night。以香港光線、空氣與節奏變化為起點的香氣研究。", "Dawn、Noon、Night。以香港光线、空气与节奏变化为起点的香气研究。"), imageAlt: tr("Illustrated Tsim Sha Tsui Clock Tower in morning light", "晨光中尖沙咀鐘樓的生成概念圖", "晨光中尖沙咀钟楼的生成概念图") },
      afterimage: { title: "Afterimage", line: tr("Idea in development", "開發中的構想", "开发中的构想"), body: tr("Tea, Harbour, Forest. Specific Hong Kong memories, carried into scent.", "Tea、Harbour、Forest。把具體的香港記憶帶進香氣。", "Tea、Harbour、Forest。把具体的香港记忆带进香气。"), imageAlt: tr("Illustrated tea on a sunlit Hong Kong windowsill", "香港日照窗台上一杯茶的生成概念圖", "香港日照窗台上一杯茶的生成概念图") },
    },
    story: {
      heading: tr("A small lab. A scent that's yours.", "小小實驗室，屬於你的香氣。", "小小实验室，属于你的香气。"),
      intro: c.intro[locale],
      element: { title: tr("Element / Your skin", "Element / 你的肌膚", "Element / 你的肌肤"), body: tr("Blot, photograph the lid, record pH. Measurements are exploratory; pH never changes your formula.", "吸油、拍攝盒蓋、記錄 pH。測量仍屬探索階段，pH 不會改變配方。", "吸油、拍摄盒盖、记录 pH。测量仍属探索阶段，pH 不会改变配方。") },
      tuning: { title: tr("Element / Your nose", "Element / 你的嗅覺", "Element / 你的嗅觉"), body: tr("Choose a blind base, explore your preferences and connect the notes. AI explains bounded rule-based changes. A perfumer reviews every formula before mixing.", "盲測選基底，探索偏好，連結香調。AI 解釋有限度的規則微調。每個配方均由調香師審核後才調配。", "盲测选基底，探索偏好，连接香调。AI 解释有限度的规则微调。每个配方均由调香师审核后才调配。") },
      regular: { title: tr("Also from YAT.lifestyle", "同樣來自 YAT.lifestyle", "同样来自 YAT.lifestyle"), body: tr("Hours follows the day. Afterimage follows a memory. Two regular lines in development, with six working bases to explore through Element.", "Hours 跟隨一天，Afterimage 跟隨記憶。兩個開發中的常規系列，六款暫定基底，透過 Element 探索。", "Hours 跟随一天，Afterimage 跟随记忆。两个开发中的常规系列，六款暂定基底，通过 Element 探索。") },
      stage: [tr("YOUR SKIN", "你的肌膚", "你的肌肤"), tr("YOUR NOSE", "你的嗅覺", "你的嗅觉"), tr("YOUR SCENT", "你的香氣", "你的香气")],
    },
    process: { title: tr("From your test to your bottle.", "從你的測試，到你的香水。", "从你的测试，到你的香水。"), intro: c.prototype[locale], steps: c.steps.map(([title, body]) => [title[locale], body[locale]]), note: c.disclaimer[locale] },
    about: { title: tr("A Hong Kong beginning.", "從香港開始。", "从香港开始。"), body: tr("YAT.lifestyle was started by an HKUST Biotechnology student who wanted laboratory curiosity and perfumery to share the same bench. The work is local, early and deliberately small in scale.", "YAT.lifestyle 由一位香港科技大學生物科技學生創立，希望讓實驗室的好奇心與香水並排在同一張工作枱上。這是一項本地、早期，而且刻意保持小規模的工作。", "YAT.lifestyle 由一位香港科技大学生物科技学生创立，希望让实验室的好奇心与香水并排在同一张工作台上。这是一项本地、早期，而且刻意保持小规模的工作。"), quote: tr("An hour. A place. Your point of view.", "一個時刻，一處地方，你的感受。", "一个时刻，一处地方，你的感受。") },
    soon: { title: tr("Your next scent starts with you.", "下一款香氣，從你開始。", "下一款香气，从你开始。"), body: c.waitlist[locale], status: tr("Join the launch waitlist", "加入推出候補名單", "加入推出候补名单"), availability: c.price[locale] },
    footer: { top: c.top[locale], note: tr("Perfume, laboratory curiosity and Hong Kong memory.", "香水、實驗室的好奇心與香港記憶。", "香水、实验室的好奇心与香港记忆。") },
    skip: tr("Skip to Regular lines", "跳至常規系列", "跳至常规系列"),
  };
};
const copy = { en: makeCopy("en"), "zh-Hant": makeCopy("zh-Hant"), "zh-Hans": makeCopy("zh-Hans") };

const collectionImages = [
  "/media/hours-clock-tower.webp",
  "/media/afterimage-morning-tea.webp",
  "/media/element-daylight-lab.webp",
];

export default function HomeExperience() {
  const [locale, setLocale] = useLocale();
  const [reducedMotion, setReducedMotion] = useState(true);
  const [activePanel, setActivePanel] = useState(0);
  const [ambientPaused, setAmbientPaused] = useState(false);
  const activePanelRef = useRef(0);
  const journeyRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropTargetRef = useRef<HTMLSpanElement>(null);
  const dropPathRef = useRef<SVGPathElement>(null);
  const t = copy[locale];
  const collectionItems = [t.collections.hours, t.collections.afterimage];
  const storyItems = [t.story.element, t.story.tuning, t.story.regular];
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const journey = journeyRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const dropTarget = dropTargetRef.current;
    const context = canvas?.getContext("2d");
    if (!journey || !stage || !dropTarget || !canvas || !context) return;
    const scenes = stage.querySelectorAll<HTMLElement>(".journey-scene");
    const frames = Array.from({ length: reducedMotion ? 1 : STORY_FRAMES }, () => new Image());
    const tips: (HTMLCanvasElement | null)[] = [];
    let active = true;
    let frame = 0;
    const draw = () => {
      frame = 0;
      if (!active) return;
      stage.dataset.idle = "false";
      if (document.hidden) return;
      const bounds = journey.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      const rect = stage.getBoundingClientRect();
      const target = dropTarget.getBoundingClientRect();
      const targetX = target.left - rect.left + target.width / 2;
      const targetY = target.top - rect.top + target.height / 2;
      const motion = storyMotion(bounds.top, journey.offsetHeight, rect.height, targetY);
      const reveal = reducedMotion ? Number(motion.progress >= 0.9) : motion.logoReveal;
      const filmOpacity = reducedMotion ? 1 - reveal : motion.filmOpacity;
      const panel = motion.scenes.findIndex((scene) => scene.opacity > .5);
      if (panel !== activePanelRef.current) { activePanelRef.current = panel; setActivePanel(panel); }
      stage.style.setProperty("--logo-reveal", String(reveal));
      stage.style.setProperty("--signature-reveal", String(reducedMotion ? reveal : motion.signatureReveal));
      stage.style.setProperty("--film-opacity", String(filmOpacity));
      stage.style.setProperty("--atmosphere-opacity", String(reducedMotion ? 1 - reveal : motion.atmosphereOpacity));
      scenes.forEach((scene, index) => {
        const opacity = String(reducedMotion ? Number(index === panel) : motion.scenes[index].opacity);
        scene.style.setProperty("--scene-opacity", opacity);
        scene.style.setProperty("--scene-offset", `${reducedMotion ? 0 : motion.scenes[index].offset}px`);
        if (index >= 2) {
          stage.style.setProperty(`--photo-${index - 1}-opacity`, opacity);
          stage.style.setProperty(`--photo-${index - 1}-offset`, `${reducedMotion ? 0 : motion.scenes[index].offset * -1.6}px`);
        }
      });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const filmWidth = rect.width > 900 ? Math.min(rect.width * 0.5, 720) : rect.width;
      // Motion tracking stays in the original 540 x 960 coordinate space;
      // source images retain the film's full 720 x 1280 detail.
      const scale = Math.max(filmWidth / 540, rect.height / 960) * motion.zoom;
      stage.style.setProperty("--idle-opacity", String(reducedMotion ? 0 : motion.idleLightOpacity));
      const settle = reducedMotion ? reveal : motion.settle;
      const morph = reducedMotion ? 1 : motion.dropMorph;
      const mix = (from: number, to: number) => from + (to - from) * morph;
      // Match the filmed bulb first. Reshape only after its outline has faded.
      dropPathRef.current?.setAttribute("d", `M50 3C${mix(22, 48)} ${mix(3, 41)} ${mix(4, 8)} ${mix(47, 73)} ${mix(4, 8)} ${mix(82, 103)}C${mix(4, 8)} ${mix(116, 128)} ${mix(23, 25)} 142 50 142C${mix(77, 75)} 142 ${mix(96, 92)} ${mix(116, 128)} ${mix(96, 92)} ${mix(82, 103)}C${mix(96, 92)} ${mix(47, 73)} ${mix(78, 52)} ${mix(3, 41)} 50 3Z`);
      stage.style.setProperty("--drop-x", `${rect.width / 2 + (targetX - rect.width / 2) * settle}px`);
      stage.style.setProperty("--drop-y", `${reducedMotion ? targetY : motion.focusY}px`);
      stage.style.setProperty("--drop-width", `${140 * scale + (target.width - 140 * scale) * settle}px`);
      stage.style.setProperty("--drop-height", `${136 * scale + (target.width * 1.45 - 136 * scale) * settle}px`);
      stage.style.setProperty("--drop-opacity", String(reducedMotion ? reveal : motion.vectorOpacity));
      if (!reducedMotion && filmOpacity > 0) {
        let imageIndex = motion.frame;
        while (imageIndex > 0 && !frames[imageIndex].naturalWidth) imageIndex--;
        const image = frames[imageIndex];
        if (image.naturalWidth) {
          context.save();
          context.globalAlpha = filmOpacity;
          context.beginPath();
          context.rect((rect.width - filmWidth) / 2, 0, filmWidth, rect.height);
          context.clip();
          context.imageSmoothingQuality = "high";
          context.drawImage(image, (rect.width - 540 * scale) / 2, motion.focusY - motion.dropY * scale, 540 * scale, 960 * scale);
          const tip = tips[imageIndex];
          const region = tip && dropTipGeometry(imageIndex);
          if (tip && region) {
            // Replace only the blunt neck, preserving the source reflections and body.
            context.save();
            context.translate((rect.width - 540 * scale) / 2, motion.focusY - motion.dropY * scale);
            context.scale(scale * .75, scale * .75);
            context.clearRect(region.x, region.y, region.width, tip.height);
            context.drawImage(tip, region.x, region.y);
            context.restore();
          }
          // Feather the portrait plate into the full-width photographic scene.
          context.globalCompositeOperation = "destination-in";
          const mask = context.createLinearGradient((rect.width - filmWidth) / 2, 0, (rect.width + filmWidth) / 2, 0);
          mask.addColorStop(0, "transparent"); mask.addColorStop(.24, "black");
          mask.addColorStop(.76, "black"); mask.addColorStop(1, "transparent");
          context.globalAlpha = 1;
          context.fillStyle = mask;
          context.fillRect(0, 0, rect.width, rect.height);
          context.restore();
          stage.style.setProperty("--poster-opacity", "0");
          stage.dataset.idle = String(motion.idleLightOpacity > 0);
        }
      }
    };
    const schedule = () => { if (active && !frame) frame = requestAnimationFrame(draw); };
    const visibility = () => {
      if (document.hidden) {
        stage.dataset.idle = "false";
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    };
    frames.forEach((image, index) => {
      image.decoding = "async";
      image.onload = () => {
        const region = !reducedMotion && dropTipGeometry(index);
        if (region) {
          // Cache a tiny tapered texture once, not a per-scroll pixel operation.
          const tip = document.createElement("canvas");
          tip.width = region.width;
          tip.height = region.widths.length;
          const tipContext = tip.getContext("2d");
          if (tipContext) {
            region.widths.forEach((width, row) => {
              // Retain the film's dark backing instead of leaving a transparent box.
              tipContext.drawImage(image, region.x, region.y + row, 1, 1, 0, row, region.width, 1);
              tipContext.drawImage(image, region.x, region.y + row, region.width, 1,
                (region.width - width) / 2, row, width, 1);
            });
            tips[index] = tip;
          }
        }
        schedule();
      };
      image.src = `/media/drop-sequence/frame-${String(reducedMotion ? 38 : index).padStart(3, "0")}.webp?v=2`;
    });
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      active = false;
      frames.forEach((image) => { image.onload = null; });
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", visibility);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);
  return <>
    <a className="skip-link" href="#collections">{t.skip}</a>
    <SiteHeader locale={locale} onLocaleChange={setLocale} />
    <main>
      <section aria-labelledby="hero-heading" className="journey" id="top" ref={journeyRef}>
        <div className={`journey-stage${reducedMotion ? " is-still" : ""}${ambientPaused ? " is-ambient-paused" : ""}`} ref={stageRef}>
          <div aria-hidden="true" className="journey-media">
            <img alt="" className="journey-atmosphere" src="/media/element-lab.webp" />
            {["/media/element-daylight-lab.webp", "/kit/lid-board.svg", "/media/afterimage-morning-tea.webp"].map((src, index) => <div className={`scene-photograph scene-photo-${index + 1}`} key={src}><img alt="" src={src} /><span>{index === 0 ? "06:00" : index === 1 ? "HONG KONG" : "YAT.E"}</span></div>)}
            <img alt="" className="journey-poster" src="/media/hong-kong-drop-mobile-poster.jpg" />
            <div className="hero-ambient" aria-hidden="true"><div className="hero-backlight" /></div>
            <canvas className="journey-canvas" ref={canvasRef} />
            <div className="journey-shade" />
          </div>
          <div className="journey-scene scene-hero" style={{ "--scene-opacity": 1 } as CSSProperties} inert={activePanel !== 0}>
            <div className="journey-copy"><div><img className="home-element-logo" src="/media/element-logo.png" alt="Element · YAT.lifestyle" /><h1 id="hero-heading">{t.hero.title}</h1><p>{t.hero.intro}</p><div className="element-actions"><a className="action primary" href="/element/demo">{t.hero.explore} ↗</a><a className="action" href="/element">{t.hero.story}</a></div><small className="element-fine">{t.hero.note}</small></div></div>
          </div>
          {!reducedMotion && activePanel === 0 && <button className="ambient-control" type="button" onClick={() => setAmbientPaused(!ambientPaused)} aria-label={locale === "en" ? (ambientPaused ? "Resume ambient motion" : "Pause ambient motion") : locale === "zh-Hant" ? (ambientPaused ? "繼續背景動態" : "暫停背景動態") : (ambientPaused ? "继续背景动画" : "暂停背景动画")}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">{ambientPaused ? <path d="m5 3 8 5-8 5Z" fill="currentColor" /> : <path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="1.5" />}</svg>
          </button>}
          <div aria-hidden="true" className="journey-scene scene-intro">
            <div className="journey-copy"><h2>{t.story.heading}</h2><p>{t.story.intro}</p></div>
            <div className="story-axis">{t.story.stage.map((word) => <span key={word}>{word}</span>)}</div>
          </div>
          {storyItems.map((item, index) => <div aria-hidden="true" className={`journey-scene scene-${index + 1}`} key={item.title}>
            <div className="journey-copy"><h3><span className="chapter-index">{String(index + 1).padStart(2, "0")}</span>{item.title}</h3><p>{item.body}</p></div>
          </div>)}
          <div aria-hidden="true" className="journey-finale">
            <div className="journey-logo">
              <div className="logo-lockup">
                <div className="logo-letters">
                  <svg viewBox="0 0 640 240" fill="currentColor">
                    <path d="M23 30H111V34H88L146 126L195 48Q202 34 181 34H173V30H231V34Q208 34 202 46L150 133V207H177V211H88V207H114V135L49 34H23Z" />
                    <path d="M242 211V207H251Q263 207 269 191L331 25H339L407 207H424V211H344V207H369L322 76L279 191Q273 207 291 207H300V211Z" />
                    <path d="M435 30H617L620 86H615Q607 34 570 34H545V207H573V211H481V207H509V34H484Q447 34 439 86H434Z" />
                  </svg>
                  <span className="logo-drop-target" ref={dropTargetRef} />
                </div>
                <div className="logo-name">YAT.lifestyle</div>
                <div className="logo-tagline">{text("SCIENCE MEETS SCENT", "科學遇上香氣", "科学遇上香气")[locale]}</div>
              </div>
            </div>
            <svg className="signature-drop" viewBox="0 0 100 145" preserveAspectRatio="none">
              <defs>
                <radialGradient id="signature-gold" cx=".32" cy=".4" r=".76" gradientTransform="translate(0 .08) scale(1 .92)">
                  <stop stopColor="#f8df91" /><stop offset=".3" stopColor="#d7a641" /><stop offset=".62" stopColor="#95590f" /><stop offset=".84" stopColor="#3e260d" /><stop offset=".95" stopColor="#98692b" /><stop offset="1" stopColor="#eed79c" />
                </radialGradient>
                <radialGradient id="signature-reflection" gradientUnits="userSpaceOnUse" cx="29" cy="84" r="39" gradientTransform="translate(29 84) rotate(19) scale(.42 1) translate(-29 -84)">
                  <stop stopColor="#fffdf0" stopOpacity=".95" /><stop offset=".28" stopColor="#fff6cc" stopOpacity=".72" /><stop offset=".64" stopColor="#ffebac" stopOpacity=".2" /><stop offset="1" stopColor="#ffebac" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="signature-bounce" cx=".55" cy=".94" r=".5" gradientTransform="translate(0 .7) scale(1 .3)">
                  <stop stopColor="#ffeab0" stopOpacity=".7" /><stop offset=".55" stopColor="#dca947" stopOpacity=".2" /><stop offset="1" stopColor="#dca947" stopOpacity="0" />
                </radialGradient>
                <path id="signature-outline" ref={dropPathRef} d="M50 3C48 41 8 73 8 103C8 128 25 142 50 142C75 142 92 128 92 103C92 73 52 41 50 3Z" />
              </defs>
              <use href="#signature-outline" fill="url(#signature-gold)" stroke="#e9ca82" strokeOpacity=".5" strokeWidth=".65" />
              <use href="#signature-outline" fill="url(#signature-reflection)" stroke="none" />
              <use href="#signature-outline" fill="url(#signature-bounce)" stroke="none" />
            </svg>
          </div>
        </div>
        <div aria-hidden="true" className="journey-spacers"><div id="story" /><div /><div /><div /><div /></div>
        <div className="visually-hidden">
          <p>{t.hero.title}</p><p>{t.hero.intro}</p>
          <h2>{t.story.heading}</h2><p>{t.story.intro}</p>
          {storyItems.map((item) => <section key={item.title}><h3>{item.title}</h3><p>{item.body}</p></section>)}
          <p>YAT.lifestyle</p>
        </div>
      </section>
      <section aria-labelledby="collections-heading" className="collections" id="collections">
        <header className="section-heading"><h2 id="collections-heading">{t.collections.title}</h2><p>{t.collections.intro}</p></header>
        <div className="contact-sheet">{collectionItems.map((item, index) => <article id={index === 0 ? "hours" : "afterimage"} key={item.title}><div className={`contact-image contact-image-${index + 1}`}><img alt={item.imageAlt} loading="lazy" src={collectionImages[index]} /><span aria-hidden="true" className="contact-time">{index === 0 ? "06:00" : index === 1 ? "HONG KONG" : "YAT.E"}</span></div><div className="contact-copy"><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.body}</p><small>{item.line}</small></div></article>)}</div>
      </section>
      <section aria-labelledby="process-heading" className="process" id="process"><header><h2 id="process-heading">{t.process.title}</h2><p>{t.process.intro}</p></header><ol>{t.process.steps.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{body}</p></li>)}</ol><p className="process-note">{t.process.note}</p></section>
      <section aria-labelledby="about-heading" className="about" id="about"><figure className="about-frame"><img alt={locale === "en" ? "Notebook, scent blotters and amber glass beside a Hong Kong window at dusk" : locale === "zh-Hant" ? "香港黃昏窗旁的筆記本、試香紙與琥珀色玻璃瓶" : "香港黄昏窗旁的笔记本、试香纸与琥珀色玻璃瓶"} loading="lazy" width="1536" height="1024" src="/media/hong-kong-beginning.webp" /><figcaption>{locale === "en" ? "An imagined Hong Kong workspace. Generated illustration." : locale === "zh-Hant" ? "想像中的香港工作室。生成概念圖。" : "想象中的香港工作室。生成概念图。"}</figcaption></figure><div className="about-copy"><h2 id="about-heading">{t.about.title}</h2><p>{t.about.body}</p><blockquote>{t.about.quote}</blockquote><a className="email-link" href="mailto:press@yatlifestyle.com"><span>{t.contact.press}</span><span>press@yatlifestyle.com</span></a></div></section>
      <section aria-labelledby="soon-heading" className="soon"><div><a className="soon-status" href="/shop?source=element-order#newsletter">{t.soon.status} ↗</a><h2 id="soon-heading">{t.soon.title}</h2><p>{t.soon.body}</p></div><p className="availability">{t.soon.availability}</p></section>
    </main>
    <footer><a className="footer-wordmark" href="#top">YAT.lifestyle</a><div className="footer-contact"><p>{t.footer.note}</p><a className="email-link" href="mailto:hello@yatlifestyle.com"><span>{t.contact.general}</span><span>hello@yatlifestyle.com</span></a></div><a href="#top">{t.footer.top}</a></footer>
  </>;
}
