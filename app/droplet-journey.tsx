"use client";

import { type CSSProperties, useEffect, useId, useRef, useState } from "react";
import { STORY_FRAMES, dropTipGeometry, storyMotion } from "../lib/story-motion";
import { PRICE_CENTS, formatPrice } from "../lib/shop";
import { type Locale } from "./site-header";

const copy = {
  en: {
    title: "Time.\nPlace.\nYou.",
    intro: "Twelve perfumes. Born in Hong Kong.",
    heading: "A Hong Kong beginning.",
    story: "One small idea. Twelve personal scents.",
    scenes: [
      { title: "Ready to give.", body: "Your scent. A blue box. Decorative flowers." },
      { title: "Meet Natasha.", body: "HKUST Biotechnology student.\nYAT.LIFESTYLE founder." },
      { title: "Close to you.", body: "Twelve fragrances. Yours to make personal." },
    ],
    shop: "Shop fragrances", inclusion: "10 mL + flower gift box", skip: "Skip story",
  },
  "zh-Hant": {
    title: "時間。\n地方。\n你。",
    intro: "十二款香水，從香港開始。",
    heading: "從香港開始。",
    story: "一個小小念頭，十二款個人香氣。",
    scenes: [
      { title: "心意，已準備好。", body: "你的香氣、藍色禮盒與裝飾花。" },
      { title: "認識 Natasha。", body: "香港科技大學生物科技學生。\nYAT.LIFESTYLE 創辦人。" },
      { title: "香氣，隨你。", body: "十二款香水，演繹你的日常。" },
    ],
    shop: "選購香水", inclusion: "10 mL + 花禮盒", skip: "跳過故事",
  },
  "zh-Hans": {
    title: "时间。\n地方。\n你。",
    intro: "十二款香水，从香港开始。",
    heading: "从香港开始。",
    story: "一个小小念头，十二款个人香气。",
    scenes: [
      { title: "心意，已准备好。", body: "你的香气、蓝色礼盒与装饰花。" },
      { title: "认识 Natasha。", body: "香港科技大学生物科技学生。\nYAT.LIFESTYLE 创办人。" },
      { title: "香气，随你。", body: "十二款香水，演绎你的日常。" },
    ],
    shop: "选购香水", inclusion: "10 mL + 花礼盒", skip: "跳过故事",
  },
} as const;

const sceneImages = ["/media/yat-official-gift-box.webp", "/media/yat-official-evening.webp", "/media/yat-official-in-hand.webp"];

export function DropletJourney({ locale }: { locale: Locale }) {
  const [reducedMotion, setReducedMotion] = useState(true);
  const journeyRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropTargetRef = useRef<HTMLSpanElement>(null);
  const dropPathRef = useRef<SVGPathElement>(null);
  const signatureId = useId();
  const t = copy[locale];

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
    const frames = Array.from({ length: reducedMotion ? 0 : STORY_FRAMES }, () => new Image());
    const tips: (HTMLCanvasElement | null)[] = [];
    let active = true;
    let frame = 0;
    stage.style.setProperty("--poster-opacity", "1");
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
      const motion = storyMotion(reducedMotion ? 0 : bounds.top - rect.top, journey.offsetHeight, rect.height, targetY);
      const reveal = motion.logoReveal;
      const filmOpacity = motion.filmOpacity;
      const panel = reducedMotion ? 0 : motion.scenes.findIndex((scene) => scene.opacity > .5);
      stage.style.setProperty("--logo-reveal", String(reveal));
      stage.style.setProperty("--signature-reveal", String(motion.signatureReveal));
      stage.style.setProperty("--film-opacity", String(filmOpacity));
      stage.style.setProperty("--atmosphere-opacity", String(motion.atmosphereOpacity));
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
      // Motion tracks the original 540 x 960 space; frames retain their full 720 x 1280 detail.
      const scale = Math.max(filmWidth / 540, rect.height / 960) * motion.zoom;
      stage.style.setProperty("--idle-opacity", String(reducedMotion ? 0 : motion.idleLightOpacity));
      const settle = motion.settle;
      const morph = motion.dropMorph;
      const mix = (from: number, to: number) => from + (to - from) * morph;
      // Match the filmed bulb first. Reshape only after its outline has faded.
      dropPathRef.current?.setAttribute("d", `M50 3C${mix(22, 48)} ${mix(3, 41)} ${mix(4, 8)} ${mix(47, 73)} ${mix(4, 8)} ${mix(82, 103)}C${mix(4, 8)} ${mix(116, 128)} ${mix(23, 25)} 142 50 142C${mix(77, 75)} 142 ${mix(96, 92)} ${mix(116, 128)} ${mix(96, 92)} ${mix(82, 103)}C${mix(96, 92)} ${mix(47, 73)} ${mix(78, 52)} ${mix(3, 41)} 50 3Z`);
      stage.style.setProperty("--drop-x", `${rect.width / 2 + (targetX - rect.width / 2) * settle}px`);
      stage.style.setProperty("--drop-y", `${motion.focusY}px`);
      stage.style.setProperty("--drop-width", `${140 * scale + (target.width - 140 * scale) * settle}px`);
      stage.style.setProperty("--drop-height", `${136 * scale + (target.width * 1.45 - 136 * scale) * settle}px`);
      stage.style.setProperty("--drop-opacity", String(motion.vectorOpacity));
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
        const region = dropTipGeometry(index);
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
      image.src = `/media/drop-sequence/frame-${String(index).padStart(3, "0")}.webp?v=2`;
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

  return <section aria-labelledby={`${signatureId}-heading`} className={`journey store-journey${reducedMotion ? " is-still" : ""}`} ref={journeyRef}>
    <div className={`journey-stage${reducedMotion ? " is-still" : ""}`} ref={stageRef}>
      <div aria-hidden="true" className="journey-media">
        <img alt="" className="journey-atmosphere" src="/media/hours-dawn.webp" />
        {sceneImages.map((src, index) => <div className={`scene-photograph scene-photo-${index + 1}`} key={src}><img alt="" src={src} /></div>)}
        <img alt="" className="journey-poster" src="/media/hong-kong-drop-mobile-poster.jpg" fetchPriority="high" />
        <div className="hero-ambient"><div className="hero-backlight" /></div>
        <canvas className="journey-canvas" ref={canvasRef} />
        <div className="journey-shade" />
      </div>
      <div className="journey-scene scene-hero" style={{ "--scene-opacity": 1 } as CSSProperties}>
        <div className="journey-copy"><h1 id={`${signatureId}-heading`}>{t.title}</h1><p>{t.intro}</p></div>
      </div>
      <div aria-hidden="true" className="journey-scene scene-intro">
        <div className="journey-copy"><h2>{t.heading}</h2><p>{t.story}</p></div>
      </div>
      {t.scenes.map((item, index) => <div aria-hidden="true" className={`journey-scene scene-${index + 1}`} key={index}>
        <div className="journey-copy"><h3>{item.title}</h3><p>{item.body}</p></div>
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
            <div className="logo-tagline">SCIENCE MEETS SCENT</div>
          </div>
        </div>
        <svg className="signature-drop" viewBox="0 0 100 145" preserveAspectRatio="none">
          <defs>
            <radialGradient id={`${signatureId}-gold`} cx=".32" cy=".4" r=".76" gradientTransform="translate(0 .08) scale(1 .92)">
              <stop stopColor="#f8df91" /><stop offset=".3" stopColor="#d7a641" /><stop offset=".62" stopColor="#95590f" /><stop offset=".84" stopColor="#3e260d" /><stop offset=".95" stopColor="#98692b" /><stop offset="1" stopColor="#eed79c" />
            </radialGradient>
            <radialGradient id={`${signatureId}-reflection`} gradientUnits="userSpaceOnUse" cx="29" cy="84" r="39" gradientTransform="translate(29 84) rotate(19) scale(.42 1) translate(-29 -84)">
              <stop stopColor="#fffdf0" stopOpacity=".95" /><stop offset=".28" stopColor="#fff6cc" stopOpacity=".72" /><stop offset=".64" stopColor="#ffebac" stopOpacity=".2" /><stop offset="1" stopColor="#ffebac" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${signatureId}-bounce`} cx=".55" cy=".94" r=".5" gradientTransform="translate(0 .7) scale(1 .3)">
              <stop stopColor="#ffeab0" stopOpacity=".7" /><stop offset=".55" stopColor="#dca947" stopOpacity=".2" /><stop offset="1" stopColor="#dca947" stopOpacity="0" />
            </radialGradient>
            <path id={`${signatureId}-outline`} ref={dropPathRef} d="M50 3C48 41 8 73 8 103C8 128 25 142 50 142C75 142 92 128 92 103C92 73 52 41 50 3Z" />
          </defs>
          <use href={`#${signatureId}-outline`} fill={`url(#${signatureId}-gold)`} stroke="#e9ca82" strokeOpacity=".5" strokeWidth=".65" />
          <use href={`#${signatureId}-outline`} fill={`url(#${signatureId}-reflection)`} stroke="none" />
          <use href={`#${signatureId}-outline`} fill={`url(#${signatureId}-bounce)`} stroke="none" />
        </svg>
      </div>
      <div className="journey-shopping">
        <div className="journey-shopping-facts"><span>{t.inclusion}</span><strong>{formatPrice(PRICE_CENTS)}</strong></div>
        <div className="journey-shopping-actions"><a className="store-btn" href="/shop">{t.shop}<svg aria-hidden="true" width="22" height="12" viewBox="0 0 22 12"><path d="M1 6h19m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg></a><a className="journey-skip" href="#collections">{t.skip}</a></div>
      </div>
    </div>
    <div aria-hidden="true" className="journey-spacers"><div /><div /><div /><div /><div /></div>
    <div className="visually-hidden">
      <h2>{t.heading}</h2><p>{t.story}</p>
      {t.scenes.map((item) => <section key={item.title}><h3>{item.title}</h3><p>{item.body}</p></section>)}
    </div>
  </section>;
}
