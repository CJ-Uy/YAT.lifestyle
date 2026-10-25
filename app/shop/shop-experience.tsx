"use client";

import { useEffect, useState } from "react";
import { lineIcon, useLocale, type Locale } from "../site-header";
import { StoreShell, ProductCard, storeCopy } from "../storefront";
import { PRODUCTS } from "../../lib/shop";
import NewsletterForm from "./newsletter-form";

const filters = {
  en: { all: "All scents", tea: "Tea & green", woody: "Woody", fruity: "Fruity", floral: "Floral", musky: "Musky" },
  "zh-Hant": { all: "全部香氣", tea: "茶香與綠意", woody: "木質", fruity: "果香", floral: "花香", musky: "麝香" },
  "zh-Hans": { all: "全部香气", tea: "茶香与绿意", woody: "木质", fruity: "果香", floral: "花香", musky: "麝香" },
};
type Filter = keyof typeof filters.en;

const services = {
  en: { gift: ["Gift box included", "Blue box with artificial flowers"], delivery: ["Free Hong Kong delivery", "Arrives within 2 weeks"], payment: ["Secure checkout", "Cards, FPS, AlipayHK and WeChat Pay via Airwallex"], count: (n: number) => n === 1 ? "1 scent" : `${n} scents` },
  "zh-Hant": { gift: ["附送禮盒", "藍色禮盒配人造花"], delivery: ["香港免費送貨", "兩星期內送達"], payment: ["安全結帳", "經 Airwallex 支援信用卡、轉數快、AlipayHK 及 WeChat Pay"], count: (n: number) => `${n} 款香氣` },
  "zh-Hans": { gift: ["附送礼盒", "蓝色礼盒配人造花"], delivery: ["香港免费配送", "两星期内送达"], payment: ["安全结账", "经 Airwallex 支持信用卡、转数快、AlipayHK 及 WeChat Pay"], count: (n: number) => `${n} 款香气` },
};
const serviceIcons = {
  gift: "M4 10h16v10H4ZM3 7h18v3H3ZM12 7v13M12 7c-1.5-3-5-3.5-5-1.5S10 7 12 7Zm0 0c1.5-3 5-3.5 5-1.5S14 7 12 7Z",
  delivery: "M2 5h11v10H2ZM13 8h4l4 4v3h-8M8.5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM19.5 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z",
  payment: "M6 11h12v10H6ZM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2",
};

// Four columns from 1200px. Only the first photo is the LCP candidate: React preloads every high-priority image ahead of the CSS.
const CATALOGUE_SIZES = "(max-width: 370px) 100vw, (max-width: 760px) 50vw, (max-width: 1199px) 33vw, 25vw";

export default function ShopExperience({ initialLocale }: { initialLocale?: Locale }) {
  const [locale, setLocale] = useLocale(initialLocale);
  const [filter, setFilter] = useState<Filter>("all");
  useEffect(() => { const initial = new URLSearchParams(location.search).get("family"); if (initial && Object.hasOwn(filters.en, initial)) setFilter(initial as Filter); }, []);
  const t = storeCopy[locale];
  const service = services[locale];
  const selected = PRODUCTS.filter((product) => filter === "all" || product.families.includes(filter) || (filter === "tea" && product.families.includes("green")));
  return <StoreShell locale={locale} onLocaleChange={setLocale}>
    <main className="store-page store-catalogue" id="store-content">
      <div className="store-catalogue-heading"><h1>{t.all}</h1><p>{t.chooseBody}</p></div>
      <ul className="store-service-strip" role="list">{(["gift", "delivery", "payment"] as const).map((id) => <li key={id}>{lineIcon(serviceIcons[id])}<div><strong>{service[id][0]}</strong><span>{service[id][1]}</span></div></li>)}</ul>
      <div className="store-filter-bar"><div role="group" aria-label={t.familyLabel}>{(Object.keys(filters.en) as Filter[]).map((id) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => { setFilter(id); const url = new URL(location.href); if (id === "all") url.searchParams.delete("family"); else url.searchParams.set("family", id); history.replaceState(null, "", url); }}>{filters[locale][id]}</button>)}</div><span role="status" aria-live="polite">{service.count(selected.length)}</span></div>
      <h2 className="visually-hidden">{filters[locale][filter]}</h2>
      <div className="store-catalogue-grid">{selected.map((product, index) => <ProductCard key={product.slug} product={product} locale={locale} priority={index === 0} sizes={CATALOGUE_SIZES} />)}</div>
      <NewsletterForm locale={locale} />
    </main>
  </StoreShell>;
}
