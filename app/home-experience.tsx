"use client";

import { useEffect, useRef, useState } from "react";
import { storyMotion } from "../lib/story-motion";

type Locale = "en" | "zh-Hant" | "zh-Hans";

const copy = {
  en: {
    nav: { home: "Home", collections: "Collections", process: "Process", about: "About", status: "Coming Soon", menu: "Menu" },
    hero: {
      title: "Perfume through time, place, and you.",
      intro: "Born in Hong Kong from a love of laboratory work and scent. YAT.lifestyle studies how a fragrance can hold an hour, a memory, or something personal.",
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
    hero: { title: "讓香氣留住時間、地方與你。", intro: "YAT.lifestyle 在香港誕生，源於對實驗室工作與香氣的熱愛。我們研究一款香水如何盛載一個時刻、一段記憶，或屬於你的氣息。", explore: "探索系列", story: "進入香氣故事", note: "香港，留在香氣之中。" },
    collections: { title: "三個進入香氣的方向。", intro: "每個系列都從不同地方開始：身邊的時間、身後的城市，或眼前的人。", hours: { title: "Hours", line: "流動中的城市", body: "以香港每個時段的節奏、空氣與光線變化為起點。", imageAlt: "晨霧與暖光中的香港天際線" }, afterimage: { title: "Afterimage", line: "留在空氣中的記憶", body: "從茶、樹林、街道與地方出發，不把香港簡化成一張明信片。", imageAlt: "從車廂望向城市的香港電車乘客" }, element: { title: "Element", line: "由探問開始的個人香氣", body: "計劃中的個人化系列，從氣味樣本及你原本喜歡的基礎香氣開始。", imageAlt: "暗色工作枱上的實驗室玻璃器皿與滴管" } },
    story: { heading: "香氣可以留住時間。", intro: "跟隨一滴香氣，走過三個仍在發展中的系列方向。", hours: { title: "Hours", body: "清晨的提振、正午的熱、入夜的空氣。Hours 觀察香港在一天內的轉變，再把這些變化帶進香水。" }, afterimage: { title: "Afterimage", body: "一杯茶、濕潤的石面、雨後的樹葉。Afterimage 從具體的香港記憶開始，追尋時刻過去後仍然留下的氣息。" }, element: { title: "Element", body: "Element 是計劃中的科學個人化系列，構想是研究顧客提供的氣味樣本，再調整他們偏好的現有基礎香氣。過程仍在開發中。" }, stage: ["時間", "地方", "你"] },
    process: { title: "從觀察走到配方。", intro: "YAT.lifestyle 源於一位生物科技學生對實驗室工作與香水的興趣。方法先由留意開始，再進入細心的反覆試驗。", steps: [["觀察", "從值得理解的時刻、地方或氣味偏好開始。"], ["調配", "透過反覆並有記錄的試驗，建立及調整香氣。"], ["重聞", "讓香氣隨時間展開，只留下忠於最初想法的部分。"]], note: "Element 最終的諮詢及分析流程尚未公布。" },
    about: { title: "從香港開始。", body: "YAT.lifestyle 由一位香港科技大學生物科技學生創立，希望讓實驗室的好奇心與香水並排在同一張工作枱上。這是一項本地、早期，而且刻意保持小規模的工作。", quote: "不是為香港寫下一條公式，而是練習好好留意它。" },
    soon: { title: "首個作品仍在開發中。", body: "YAT.lifestyle 暫未接受訂購。購買服務開放初期，只會送貨到香港地址。", status: "即將推出", availability: "香港先行" },
    footer: { top: "返回頂部", note: "香水、實驗室的好奇心與香港記憶。" }, skip: "跳至系列",
  },
  "zh-Hans": {
    nav: { home: "首页", collections: "系列", process: "过程", about: "关于", status: "即将推出", menu: "菜单" },
    hero: { title: "让香气留住时间、地方与你。", intro: "YAT.lifestyle 在香港诞生，源于对实验室工作与香气的热爱。我们研究一款香水如何盛载一个时刻、一段记忆，或属于你的气息。", explore: "探索系列", story: "进入香气故事", note: "香港，留在香气之中。" },
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
  const storyRef = useRef<HTMLElement>(null);
  const storyVideoRef = useRef<HTMLVideoElement>(null);
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
    const story = storyRef.current;
    const video = storyVideoRef.current;
    if (!story || !video || reducedMotion) return;
    if (video.readyState >= 1) video.pause();
    let frame = 0;
    const update = () => {
      frame = 0;
      const header = window.innerWidth <= 680 ? 96 : 0;
      const { progress, logoReveal, time } = storyMotion(story.getBoundingClientRect().top, story.offsetHeight, window.innerHeight, header, video.duration);
      story.style.setProperty("--story-progress", String(progress));
      story.style.setProperty("--logo-reveal", String(logoReveal));
      if (Number.isFinite(video.duration) && video.duration > 0) {
        if (Math.abs(video.currentTime - time) > 0.04) video.currentTime = time;
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const onReady = () => { video.pause(); schedule(); };
    video.addEventListener("loadedmetadata", onReady);
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      video.removeEventListener("loadedmetadata", onReady);
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
    <main id="top">
      <section aria-labelledby="hero-heading" className="hero">
        <div aria-hidden="true" className="exposure exposure-left" /><div aria-hidden="true" className="exposure exposure-right" />
        <div className="hero-stage">
          {reducedMotion ? <picture><source media="(max-width: 680px)" srcSet="/media/hong-kong-drop-mobile-poster.jpg" /><img alt="" aria-hidden="true" className="hero-film" src="/media/hong-kong-harbour-afterimage-poster.jpg" /></picture> : <video aria-hidden="true" autoPlay className="hero-film" loop muted playsInline poster="/media/hong-kong-harbour-afterimage-poster.jpg" preload="metadata"><source media="(max-width: 680px)" src="/media/hong-kong-drop-mobile.mp4" type="video/mp4" /><source src="/media/hong-kong-harbour-afterimage.mp4" type="video/mp4" /></video>}
          <p className="stage-caption">{t.hero.note}</p>
        </div>
        <div className="hero-copy"><h1 id="hero-heading">{t.hero.title}</h1><p>{t.hero.intro}</p><div className="hero-actions"><a className="action action-primary" href="#collections">{t.hero.explore}</a><a className="action action-secondary" href="#story">{t.hero.story}</a></div><p className="frame-note">{t.hero.note}</p></div>
        <div className="hero-rail" aria-label={t.collections.title}>{collectionItems.map((item, index) => <a href={`#collection-${index + 1}`} key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><small>{item.line}</small></a>)}</div><FilmEdge />
      </section>
      <section aria-labelledby="story-heading" className="story" id="story" ref={storyRef}>
        <div className="story-stage" aria-hidden="true">
          {reducedMotion ? <picture><source media="(max-width: 680px)" srcSet="/media/hong-kong-drop-mobile-poster.jpg" /><img alt="" className="story-film" src="/media/hong-kong-harbour-afterimage-poster.jpg" /></picture> : <video autoPlay className="story-film" muted playsInline preload="auto" ref={storyVideoRef}><source media="(max-width: 680px)" src="/media/hong-kong-drop-mobile.mp4" type="video/mp4" /><source src="/media/hong-kong-harbour-afterimage.mp4" type="video/mp4" /></video>}
          <div className="story-logo"><img alt="" src="/media/yat-logo-reference.jpg" /></div>
          <div className="story-words">{t.story.stage.map((word) => <span key={word}>{word}</span>)}</div>
        </div>
        <div className="story-copy"><header><h2 id="story-heading">{t.story.heading}</h2><p>{t.story.intro}</p></header>{storyItems.map((item, index) => <article key={item.title}><span className="chapter-index">{String(index + 1).padStart(2, "0")}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
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
