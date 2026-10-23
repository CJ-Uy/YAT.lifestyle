"use client";

import { useId, useState } from "react";
import { type Locale } from "./site-header";
import { Arrow, ProductCard, storeCopy } from "./storefront";
import { formatPrice, PRICE_CENTS } from "../lib/shop";
import { recommendScents, SCENT_FAMILIES, type ScentFamily } from "../lib/scent-finder";
import "./scent-finder.css";

const copy = {
  en: {
    title: "Find your scent.", intro: "Pick a note and a mood. We'll suggest three to try.",
    family: "What draws you in?", tea: "Tea", floral: "Flowers", woody: "Woods", fruity: "Fruit", musky: "Musk", any: "No preference",
    feel: "How should it feel?", fresh: "Fresh", warm: "Warm", feelings: ["Fresh", "Airy", "Balanced", "Soft", "Warm"],
    suggestions: "Three to start with.", source: "Matched by each scent's notes.", announced: "Suggested scents",
  },
  "zh-Hant": {
    title: "找到你的香氣。", intro: "選一個香調和感覺，我們推薦三款給你試。",
    family: "哪種香氣吸引你？", tea: "茶香", floral: "花香", woody: "木質", fruity: "果香", musky: "麝香", any: "沒有偏好",
    feel: "想要怎樣的感覺？", fresh: "清新", warm: "溫暖", feelings: ["清新", "輕盈", "平衡", "柔和", "溫暖"],
    suggestions: "先從這三款開始。", source: "根據香調配對。", announced: "推薦香氣",
  },
  "zh-Hans": {
    title: "找到你的香气。", intro: "选一个香调和感觉，我们推荐三款给你试。",
    family: "哪种香气吸引你？", tea: "茶香", floral: "花香", woody: "木质", fruity: "果香", musky: "麝香", any: "没有偏好",
    feel: "想要怎样的感觉？", fresh: "清新", warm: "温暖", feelings: ["清新", "轻盈", "平衡", "柔和", "温暖"],
    suggestions: "先从这三款开始。", source: "根据香调配对。", announced: "推荐香气",
  },
};

export function ScentFinder({ locale }: { locale: Locale }) {
  const [family, setFamily] = useState<ScentFamily>("tea");
  const [feel, setFeel] = useState(2);
  const feelId = useId();
  const t = copy[locale];
  const shared = storeCopy[locale];
  const suggestions = recommendScents(family, feel);

  return <div className="scent-finder">
    <div className="scent-finder-intro"><h2>{t.title}</h2><p>{t.intro}</p></div>
    <div className="scent-finder-layout">
      <div className="scent-finder-controls">
        <fieldset className="scent-family-field"><legend><span aria-hidden="true">01</span>{t.family}</legend>
          <div className="scent-families">
            {SCENT_FAMILIES.map((id) => <button className="scent-family" key={id} type="button" aria-pressed={family === id} onClick={() => setFamily(id)}>{t[id]}</button>)}
            <button className="scent-family" type="button" aria-pressed={family === "any"} onClick={() => setFamily("any")}>{t.any}</button>
          </div>
        </fieldset>
        <div className="scent-feel"><label htmlFor={feelId}><span aria-hidden="true">02</span>{t.feel}</label><output htmlFor={feelId}>{t.feelings[feel]}</output><input id={feelId} type="range" min="0" max="4" step="1" value={feel} aria-valuetext={t.feelings[feel]} onChange={(event) => setFeel(Number(event.target.value))} /><div aria-hidden="true"><span>{t.fresh}</span><span>{t.warm}</span></div></div>
      </div>
      <div className="scent-finder-results">
        <div className="scent-results-intro"><div><h3>{t.suggestions}</h3><p>{t.source}</p></div><p className="scent-results-selection">{t[family]}<span aria-hidden="true"> / </span>{t.feelings[feel]}</p></div>
        <p className="scent-announcement" role="status" aria-live="polite" aria-atomic="true">{t.announced}: {suggestions.map((product) => product.name).join(", ")}.</p>
        <div className="scent-recommendations">{suggestions.map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}</div>
        <div className="scent-results-footer"><span>10 mL · {shared.unisex} · {formatPrice(PRICE_CENTS)}</span><a className="store-text-link" href="/shop">{shared.all}<Arrow /></a></div>
      </div>
    </div>
  </div>;
}
