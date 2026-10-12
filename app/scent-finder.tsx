"use client";

import { useId, useState } from "react";
import { type Locale } from "./site-header";
import { Arrow, ProductCard, storeCopy } from "./storefront";
import { formatPrice, PRICE_CENTS } from "../lib/shop";
import { recommendScents, SCENT_FAMILIES, type ScentFamily } from "../lib/scent-finder";
import "./scent-finder.css";

const copy = {
  en: {
    title: "Find your scent.", intro: "A note you love. A feeling to follow.",
    family: "What draws you in?", tea: "Tea", floral: "Flowers", woody: "Woods", fruity: "Fruit", musky: "Musk", any: "Open to all",
    feel: "How should it feel?", fresh: "Fresh", warm: "Warm", feelings: ["Fresh", "Airy", "Balanced", "Soft", "Warm"],
    suggestions: "Your starting points.", source: "Suggestions from scent notes.", announced: "Suggested scents",
  },
  "zh-Hant": {
    title: "找到你的香氣。", intro: "從喜歡的香調，走向心中的感覺。",
    family: "哪種香氣吸引你？", tea: "茶香", floral: "花香", woody: "木質", fruity: "果香", musky: "麝香", any: "都想試試",
    feel: "想要怎樣的感覺？", fresh: "清新", warm: "溫暖", feelings: ["清新", "輕盈", "平衡", "柔和", "溫暖"],
    suggestions: "從這幾款開始。", source: "依香調介紹推薦。", announced: "推薦香氣",
  },
  "zh-Hans": {
    title: "找到你的香气。", intro: "从喜欢的香调，走向心中的感觉。",
    family: "哪种香气吸引你？", tea: "茶香", floral: "花香", woody: "木质", fruity: "果香", musky: "麝香", any: "都想试试",
    feel: "想要怎样的感觉？", fresh: "清新", warm: "温暖", feelings: ["清新", "轻盈", "平衡", "柔和", "温暖"],
    suggestions: "从这几款开始。", source: "依香调介绍推荐。", announced: "推荐香气",
  },
};

export function ScentFinder({ locale }: { locale: Locale }) {
  const [family, setFamily] = useState<ScentFamily>("tea");
  const [feel, setFeel] = useState(2);
  const feelId = useId();
  const t = copy[locale];
  const shared = storeCopy[locale];
  const suggestions = recommendScents(family, feel);
  const selectedIndex = SCENT_FAMILIES.findIndex((id) => id === family);

  return <div className="scent-finder">
    <div className="scent-finder-intro"><h2>{t.title}</h2><p>{t.intro}</p></div>
    <div className="scent-finder-layout">
      <div className="scent-finder-controls">
        <fieldset className="scent-family-field"><legend>{t.family}</legend>
          <div className="scent-compass">
            <svg className="scent-compass-lines" aria-hidden="true" viewBox="0 0 360 360">
              <circle cx="180" cy="180" r="116" /><circle cx="180" cy="180" r="84" />
              {SCENT_FAMILIES.map((id, index) => <g key={id} transform={`rotate(${index * 72} 180 180)`}><path d="M180 96v-32" /><circle className={family === id ? "is-selected" : ""} cx="180" cy="64" r="3" /></g>)}
              {selectedIndex >= 0 && <path className="scent-compass-pointer" d="M180 107v-11" transform={`rotate(${selectedIndex * 72} 180 180)`} />}
            </svg>
            <div className="scent-compass-center" aria-hidden="true"><span>{t[family]}</span><small>{t.feelings[feel]}</small></div>
            {SCENT_FAMILIES.map((id) => <button className={`scent-family scent-family-${id}`} key={id} type="button" aria-pressed={family === id} onClick={() => setFamily(id)}>{t[id]}</button>)}
          </div>
          <button className="scent-any" type="button" aria-pressed={family === "any"} onClick={() => setFamily("any")}>{t.any}</button>
        </fieldset>
        <div className="scent-feel"><label htmlFor={feelId}>{t.feel}</label><input id={feelId} type="range" min="0" max="4" step="1" value={feel} aria-valuetext={t.feelings[feel]} onChange={(event) => setFeel(Number(event.target.value))} /><div aria-hidden="true"><span>{t.fresh}</span><span>{t.warm}</span></div></div>
      </div>
      <div className="scent-finder-results">
        <div className="scent-results-intro"><div><h3>{t.suggestions}</h3><p>{t.source}</p></div><span>10 mL · {shared.unisex} · {formatPrice(PRICE_CENTS)}</span></div>
        <p className="scent-announcement" role="status" aria-live="polite" aria-atomic="true">{t.announced}: {suggestions.map((product) => product.name).join(", ")}.</p>
        <div className="scent-recommendations">{suggestions.map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}</div>
        <a className="store-text-link" href="/shop">{shared.all}<Arrow /></a>
      </div>
    </div>
  </div>;
}
