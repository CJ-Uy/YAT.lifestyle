"use client";

import { useEffect, useRef, useState } from "react";
import { STORY_FRAMES, storyMotion } from "../lib/story-motion";

type Locale = "en" | "zh-Hant" | "zh-Hans";

const copy = {
  en: {
    nav: { home: "Home", collections: "Collections", process: "Process", about: "About", status: "Coming Soon", menu: "Menu" },
    hero: {
      title: "Perfume through time, place, and you.",
      intro: "Born in Hong Kong, YAT.lifestyle brings laboratory curiosity to perfume. Each scent begins with an hour, a place, or a person.",
      explore: "Explore collections", story: "Experience the story", note: "Hong Kong, held in scent.",
    },
    collections: {
      title: "Three ways into scent.",
      intro: "Each collection begins with a different source: the hour around us, the city behind us, or the person in front of us.",
      hours: { title: "Hours", line: "A city in motion", body: "Time-of-day studies shaped by the changing pace, air, and light of Hong Kong.", imageAlt: "Hong Kong skyline at dawn, seen through warm morning haze" },
      afterimage: { title: "Afterimage", line: "Memories in the air", body: "Tea, forests, streets, and places recalled through scent without reducing the city to a postcard.", imageAlt: "Passengers inside a Hong Kong tram, framed by the city outside" },
      element: { title: "Element", line: "Personal by inquiry", body: "A planned personalization line that begins with a scent sample and a base fragrance you already like.", imageAlt: "Laboratory glassware and a pipette lit against a dark workbench" },
    },
    story: {
      heading: "A scent can keep time.", intro: "Follow the drop through the three working collection directions.",
      hours: { title: "Hours", body: "Morning lift, noon heat, evening air. Hours looks at the way Hong Kong changes within a single day, then carries those shifts into perfume." },
      afterimage: { title: "Afterimage", body: "A cup of tea, wet stone, leaves after rain. Afterimage starts with specific Hong Kong memories and follows what remains after the moment has passed." },
      element: { title: "Element", body: "Element is a planned scientific personalization line. The intention is to study a customer-provided scent sample and refine an existing base fragrance they prefer. The process is still being developed." },
      stage: ["TIME", "PLACE", "YOU"],
    },
    process: {
      title: "From observation to formula.",
      intro: "YAT.lifestyle grows from a biotechnology student's interest in laboratory work and perfume. The method starts with attention, then moves through careful trials.",
      steps: [["Observe", "Begin with an hour, a place, or a scent preference worth understanding."], ["Compose", "Build and adjust a fragrance through repeated, documented trials."], ["Return", "Smell again over time and keep what remains true to the starting idea."]],
      note: "Element's final consultation and analysis process has not been announced.",
    },
    about: { title: "A Hong Kong beginning.", body: "YAT.lifestyle was started by an HKUST Biotechnology student who wanted laboratory curiosity and perfumery to share the same bench. The work is local, early, and deliberately small in scale.", quote: "Not a formula for Hong Kong. A practice of noticing it." },
    soon: { title: "The first release is in development.", body: "YAT.lifestyle is not taking orders yet. When purchasing opens, delivery will initially be available to Hong Kong addresses.", status: "Coming Soon", availability: "Hong Kong first" },
    footer: { top: "Back to top", note: "Perfume, laboratory curiosity, and Hong Kong memory." }, skip: "Skip to collections",
  },
  "zh-Hant": {
    nav: { home: "首頁", collections: "系列", process: "過程", about: "關於", status: "即將推出", menu: "選單" },
    hero: { title: "讓香氣留住時間、地方與你。", intro: "YAT.lifestyle 誕生於香港，把實驗室的好奇心帶進香水。每款香氣從一個時刻、一處地方，或一個人開始。", explore: "探索系列", story: "進入香氣故事", note: "香港，留在香氣之中。" },
    collections: { title: "三個進入香氣的方向。", intro: "每個系列都從不同地方開始：身邊的時間、身後的城市，或眼前的人。", hours: { title: "Hours", line: "流動中的城市", body: "以香港每個時段的節奏、空氣與光線變化為起點。", imageAlt: "晨霧與暖光中的香港天際線" }, afterimage: { title: "Afterimage", line: "留在空氣中的記憶", body: "從茶、樹林、街道與地方出發，不把香港簡化成一張明信片。", imageAlt: "從車廂望向城市的香港電車乘客" }, element: { title: "Element", line: "由探問開始的個人香氣", body: "計劃中的個人化系列，從氣味樣本及你原本喜歡的基礎香氣開始。", imageAlt: "暗色工作枱上的實驗室玻璃器皿與滴管" } },
    story: { heading: "香氣可以留住時間。", intro: "跟隨一滴香氣，走過三個仍在發展中的系列方向。", hours: { title: "Hours", body: "清晨的提振、正午的熱、入夜的空氣。Hours 觀察香港在一天內的轉變，再把這些變化帶進香水。" }, afterimage: { title: "Afterimage", body: "一杯茶、濕潤的石面、雨後的樹葉。Afterimage 從具體的香港記憶開始，追尋時刻過去後仍然留下的氣息。" }, element: { title: "Element", body: "Element 是計劃中的科學個人化系列，構想是研究顧客提供的氣味樣本，再調整他們偏好的現有基礎香氣。過程仍在開發中。" }, stage: ["時間", "地方", "你"] },
    process: { title: "從觀察走到配方。", intro: "YAT.lifestyle 源於一位生物科技學生對實驗室工作與香水的興趣。方法先由留意開始，再進入細心的反覆試驗。", steps: [["觀察", "從值得理解的時刻、地方或氣味偏好開始。"], ["調配", "透過反覆並有記錄的試驗，建立及調整香氣。"], ["重聞", "讓香氣隨時間展開，只留下忠於最初想法的部分。"]], note: "Element 最終的諮詢及分析流程尚未公布。" },
    about: { title: "從香港開始。", body: "YAT.lifestyle 由一位香港科技大學生物科技學生創立，希望讓實驗室的好奇心與香水並排在同一張工作枱上。這是一項本地、早期，而且刻意保持小規模的工作。", quote: "不是為香港寫下一條公式，而是練習好好留意它。" },
    soon: { title: "首個作品仍在開發中。", body: "YAT.lifestyle 暫未接受訂購。購買服務開放初期，只會送貨到香港地址。", status: "即將推出", availability: "香港先行" },
    footer: { top: "返回頂部", note: "香水、實驗室的好奇心與香港記憶。" }, skip: "跳至系列",
  },
  "zh-Hans": {
    nav: { home: "首页", collections: "系列", process: "过程", about: "关于", status: "即将推出", menu: "菜单" },
    hero: { title: "让香气留住时间、地方与你。", intro: "YAT.lifestyle 诞生于香港，把实验室的好奇心带进香水。每款香气从一个时刻、一处地方，或一个人开始。", explore: "探索系列", story: "进入香气故事", note: "香港，留在香气之中。" },
    collections: { title: "三个进入香气的方向。", intro: "每个系列都从不同地方开始：身边的时间、身后的城市，或眼前的人。", hours: { title: "Hours", line: "流动中的城市", body: "以香港每个时段的节奏、空气与光线变化为起点。", imageAlt: "晨雾与暖光中的香港天际线" }, afterimage: { title: "Afterimage", line: "留在空气中的记忆", body: "从茶、树林、街道与地方出发，不把香港简化成一张明信片。", imageAlt: "从车厢望向城市的香港电车乘客" }, element: { title: "Element", line: "由探问开始的个人香气", body: "计划中的个性化系列，从气味样本及你原本喜欢的基础香气开始。", imageAlt: "暗色工作台上的实验室玻璃器皿与滴管" } },
    story: { heading: "香气可以留住时间。", intro: "跟随一滴香气，走过三个仍在发展的系列方向。", hours: { title: "Hours", body: "清晨的提振、正午的热、入夜的空气。Hours 观察香港在一天内的转变，再把这些变化带进香水。" }, afterimage: { title: "Afterimage", body: "一杯茶、湿润的石面、雨后的树叶。Afterimage 从具体的香港记忆开始，追寻时刻过去后仍然留下的气息。" }, element: { title: "Element", body: "Element 是计划中的科学个性化系列，构想是研究顾客提供的气味样本，再调整他们偏好的现有基础香气。过程仍在开发中。" }, stage: ["时间", "地方", "你"] },
    process: { title: "从观察走到配方。", intro: "YAT.lifestyle 源于一位生物科技学生对实验室工作与香水的兴趣。方法先由留意开始，再进入细心的反复试验。", steps: [["观察", "从值得理解的时刻、地方或气味偏好开始。"], ["调配", "通过反复并有记录的试验，建立及调整香气。"], ["重闻", "让香气随时间展开，只留下忠于最初想法的部分。"]], note: "Element 最终的咨询及分析流程尚未公布。" },
    about: { title: "从香港开始。", body: "YAT.lifestyle 由一位香港科技大学生物科技学生创立，希望让实验室的好奇心与香水并排在同一张工作台上。这是一项本地、早期，而且刻意保持小规模的工作。", quote: "不是为香港写下一条公式，而是练习好好留意它。" },
    soon: { title: "首个作品仍在开发中。", body: "YAT.lifestyle 暂未接受订购。购买服务开放初期，只会送货到香港地址。", status: "即将推出", availability: "香港先行" },
    footer: { top: "返回顶部", note: "香水、实验室的好奇心与香港记忆。" }, skip: "跳至系列",
  },
} as const;

const localeLabels: { id: Locale; short: string; name: string }[] = [
  { id: "en", short: "EN", name: "English" }, { id: "zh-Hant", short: "繁", name: "繁體中文" }, { id: "zh-Hans", short: "简", name: "简体中文" },
];

const collectionImages = [
  "/media/hours-dawn.png",
  "/media/afterimage-tram.png",
  "/media/element-lab.png",
];

function FilmEdge() { return <div aria-hidden="true" className="film-edge" />; }

export default function HomeExperience() {
  const [locale, setLocale] = useState<Locale>("en");
  const [reducedMotion, setReducedMotion] = useState(true);
  const [activePanel, setActivePanel] = useState(0);
  const activePanelRef = useRef(0);
  const journeyRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropTargetRef = useRef<HTMLSpanElement>(null);
  const t = copy[locale];
  const collectionItems = [t.collections.hours, t.collections.afterimage, t.collections.element];
  const storyItems = [t.story.hours, t.story.afterimage, t.story.element];
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
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
    const frames = Array.from({ length: reducedMotion ? 1 : STORY_FRAMES }, () => new Image());
    let active = true;
    let frame = 0;
    const draw = () => {
      frame = 0;
      if (!active) return;
      const bounds = journey.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      const rect = stage.getBoundingClientRect();
      const target = dropTarget.getBoundingClientRect();
      const targetX = target.left - rect.left + target.width / 2;
      const targetY = target.top - rect.top + target.height / 2;
      const motion = storyMotion(bounds.top, journey.offsetHeight, window.innerHeight, targetY);
      const reveal = reducedMotion ? Number(motion.progress >= 0.9) : motion.logoReveal;
      const filmOpacity = reducedMotion ? 1 - reveal : motion.filmOpacity;
      const dropIsolation = reducedMotion ? reveal : motion.dropIsolation;
      const panel = Math.min(5, Math.round(motion.progress * 5));
      if (panel !== activePanelRef.current) { activePanelRef.current = panel; setActivePanel(panel); }
      stage.style.setProperty("--logo-reveal", String(reveal));
      stage.style.setProperty("--film-opacity", String(filmOpacity));
      stage.style.setProperty("--narration-opacity", String(motion.narrationOpacity));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const filmWidth = rect.width > 900 ? Math.min(rect.width * 0.48, 640) : rect.width;
      const scale = Math.max(filmWidth / 540, rect.height / 960) * motion.zoom;
      if (!reducedMotion && filmOpacity > 0) {
        let image = frames[motion.frame];
        if (!image.naturalWidth) image = frames.slice(0, motion.frame).reverse().find((candidate) => candidate.naturalWidth) ?? frames[0];
        if (image.naturalWidth) {
          context.save();
          context.globalAlpha = filmOpacity;
          context.beginPath();
          context.rect((rect.width - filmWidth) / 2, 0, filmWidth, rect.height);
          context.clip();
          context.drawImage(image, (rect.width - 540 * scale) / 2, motion.focusY - motion.dropY * scale, 540 * scale, 960 * scale);
          context.restore();
        }
      }
      const dropImage = frames[reducedMotion ? 0 : 38];
      if (dropIsolation > 0 && dropImage.naturalWidth) {
        const settle = Math.min(1, reveal * 1.8);
        const dropWidth = 144 * scale + (target.width - 144 * scale) * settle;
        const dropHeight = dropWidth * 174 / 144;
        context.save();
        context.globalAlpha = dropIsolation;
        context.beginPath();
        context.ellipse(targetX, targetY, dropWidth * .49, dropHeight * .49, 0, 0, Math.PI * 2);
        context.clip();
        const glow = context.createRadialGradient(targetX - dropWidth * .16, targetY - dropHeight * .2, 0, targetX, targetY, dropWidth * .65);
        glow.addColorStop(0, "rgba(229, 175, 82, .5)");
        glow.addColorStop(.7, "rgba(134, 81, 29, .28)");
        glow.addColorStop(1, "rgba(8, 8, 6, 0)");
        context.fillStyle = glow;
        context.fillRect(targetX - dropWidth / 2, targetY - dropHeight / 2, dropWidth, dropHeight);
        context.globalCompositeOperation = "screen";
        context.drawImage(dropImage, 198, 474, 144, 174, targetX - dropWidth / 2, targetY - dropHeight / 2, dropWidth, dropHeight);
        context.restore();
      }
    };
    const schedule = () => { if (active && !frame) frame = requestAnimationFrame(draw); };
    frames.forEach((image, index) => {
      image.decoding = "async";
      image.onload = schedule;
      image.src = `/media/drop-sequence/frame-${String(reducedMotion ? 38 : index).padStart(3, "0")}.webp`;
    });
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      active = false;
      frames.forEach((image) => { image.onload = null; });
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);
  return <>
    <a className="skip-link" href="#collections">{t.skip}</a>
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="YAT.lifestyle home">YAT.lifestyle</a>
      <nav aria-label="Primary navigation" className="primary-nav"><a href="#top">{t.nav.home}</a><a href="#collections">{t.nav.collections}</a><a href="#process">{t.nav.process}</a><a href="#about">{t.nav.about}</a></nav>
      <details className="mobile-nav">
        <summary>{t.nav.menu}</summary>
        <nav aria-label="Mobile navigation"><a href="#top" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>{t.nav.home}</a><a href="#collections" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>{t.nav.collections}</a><a href="#process" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>{t.nav.process}</a><a href="#about" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>{t.nav.about}</a><span>{t.nav.status}</span></nav>
      </details>
      <div className="header-tools"><div aria-label="Language" className="locale-switcher" role="group">{localeLabels.map((item) => <button aria-label={item.name} aria-pressed={locale === item.id} key={item.id} onClick={() => setLocale(item.id)} type="button">{item.short}</button>)}</div><span className="status-label">{t.nav.status}</span></div>
    </header>
    <main>
      <section aria-labelledby="hero-heading" className="journey" id="top" ref={journeyRef}>
        <div className="journey-stage" ref={stageRef}>
          <div aria-hidden="true" className="journey-media">
            <img alt="" className="journey-poster" src="/media/hong-kong-drop-mobile-poster.jpg" />
            <div className="journey-logo">
              <div className="logo-lockup">
                <svg className="logo-pipette" viewBox="0 0 160 180" fill="none" aria-hidden="true">
                  <path d="M71 39V17c0-12 4-16 9-16s9 4 9 16v22" fill="#11100e" stroke="#ba8d45" strokeWidth="1.5" />
                  <path d="M66 39h28v24H66z" fill="#b8893d" stroke="#ebc978" strokeWidth="1.5" />
                  <path d="M75 63v88m10-88v88" stroke="#d8a443" strokeWidth="2" />
                  <path d="M66 67C73 85 36 90 24 119c-8 18 4 34 30 57M94 67c-7 18 30 23 42 52 8 18-4 34-30 57" stroke="#b8893d" strokeWidth="2" />
                  <path d="M75 151 80 170l5-19" stroke="#e2ba6c" strokeWidth="2" />
                </svg>
                <div className="logo-letters"><span>Y</span><span className="logo-a"><svg viewBox="0 0 110 120" aria-hidden="true"><path d="M10 115 55 5l45 110M2 116h31m44 0h31" /></svg><span className="logo-drop-target" ref={dropTargetRef} /></span><span>T</span></div>
                <div className="logo-name"><i />yatlife.style<i /></div>
                <div className="logo-tagline">SCIENCE MEETS SCENT</div>
              </div>
            </div>
            <canvas className="journey-canvas" ref={canvasRef} />
            <div className="journey-shade" />
          </div>
          {activePanel < 5 && <div className={`journey-narration ${activePanel === 0 ? "journey-hero" : activePanel === 1 ? "journey-intro" : "journey-chapter"}`} key={activePanel}>
            {activePanel === 0 ? <div className="journey-copy"><div aria-hidden="true"><h1>{t.hero.title}</h1><p>{t.hero.intro}</p></div><div className="hero-actions"><a className="action action-primary" href="#collections">{t.hero.explore}</a><a className="action action-secondary" href="#story">{t.hero.story}</a></div></div>
              : activePanel === 1 ? <div aria-hidden="true" className="journey-copy"><h2>{t.story.heading}</h2><p>{t.story.intro}</p></div>
              : <div aria-hidden="true" className="journey-copy"><span className="chapter-index">{String(activePanel - 1).padStart(2, "0")}</span><h3>{storyItems[activePanel - 2].title}</h3><p>{storyItems[activePanel - 2].body}</p></div>}
          </div>}
        </div>
        <div aria-hidden="true" className="journey-spacers"><div id="story" /><div /><div /><div /><div /></div>
        <div className="visually-hidden">
          <h1 id="hero-heading">{t.hero.title}</h1><p>{t.hero.intro}</p>
          <h2>{t.story.heading}</h2><p>{t.story.intro}</p>
          {storyItems.map((item) => <section key={item.title}><h3>{item.title}</h3><p>{item.body}</p></section>)}
          <p>YAT.lifestyle</p>
        </div>
      </section>
      <section aria-labelledby="collections-heading" className="collections" id="collections">
        <header className="section-heading"><h2 id="collections-heading">{t.collections.title}</h2><p>{t.collections.intro}</p></header>
        <div className="contact-sheet">{collectionItems.map((item, index) => <article id={`collection-${index + 1}`} key={item.title}><div className={`contact-image contact-image-${index + 1}`}><img alt={item.imageAlt} loading="lazy" src={collectionImages[index]} /><span aria-hidden="true" className="contact-time">{index === 0 ? "06:00" : index === 1 ? "18:42" : "YAT.E"}</span></div><div className="contact-copy"><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.body}</p><small>{item.line}</small></div></article>)}</div><FilmEdge />
      </section>
      <section aria-labelledby="process-heading" className="process" id="process"><header><h2 id="process-heading">{t.process.title}</h2><p>{t.process.intro}</p></header><ol>{t.process.steps.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{body}</p></li>)}</ol><p className="process-note">{t.process.note}</p></section>
      <section aria-labelledby="about-heading" className="about" id="about"><div className="about-frame" aria-hidden="true"><div className="bench-glass"><i /><i /><i /></div><span>HK · YAT · LAB</span></div><div className="about-copy"><h2 id="about-heading">{t.about.title}</h2><p>{t.about.body}</p><blockquote>{t.about.quote}</blockquote></div></section>
      <section aria-labelledby="soon-heading" className="soon"><div><span className="soon-status">{t.soon.status}</span><h2 id="soon-heading">{t.soon.title}</h2><p>{t.soon.body}</p></div><p className="availability">{t.soon.availability}</p></section>
    </main>
    <footer><a className="footer-wordmark" href="#top">YAT.lifestyle</a><p>{t.footer.note}</p><a href="#top">{t.footer.top}</a></footer>
  </>;
}
