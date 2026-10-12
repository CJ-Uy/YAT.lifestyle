"use client";

import { useEffect, useState } from "react";
import { useLocale } from "../site-header";
import { StoreShell, ProductCard, storeCopy } from "../storefront";
import { PRODUCTS } from "../../lib/shop";
import NewsletterForm from "./newsletter-form";

const filters = {
  en: { all: "All scents", tea: "Tea & green", woody: "Woody", fruity: "Fruity", floral: "Floral", musky: "Musky" },
  "zh-Hant": { all: "全部香氣", tea: "茶香與綠意", woody: "木質", fruity: "果香", floral: "花香", musky: "麝香" },
  "zh-Hans": { all: "全部香气", tea: "茶香与绿意", woody: "木质", fruity: "果香", floral: "花香", musky: "麝香" },
};
type Filter = keyof typeof filters.en;

export default function ShopExperience() {
  const [locale, setLocale] = useLocale();
  const [filter, setFilter] = useState<Filter>("all");
  useEffect(() => { const initial = new URLSearchParams(location.search).get("family"); if (initial && Object.hasOwn(filters.en, initial)) setFilter(initial as Filter); }, []);
  const t = storeCopy[locale];
  const selected = PRODUCTS.filter((product) => filter === "all" || product.families.includes(filter) || (filter === "tea" && product.families.includes("green")));
  return <StoreShell locale={locale} onLocaleChange={setLocale}>
    <main className="store-page store-catalogue" id="store-content">
      <div className="store-catalogue-heading"><h1>{t.all}</h1><div><p>{t.chooseBody}</p><p>{t.inclusion} · HK$228</p></div></div>
      <div className="store-filter-bar"><div role="group" aria-label={t.familyLabel}>{(Object.keys(filters.en) as Filter[]).map((id) => <button key={id} type="button" aria-pressed={filter === id} onClick={() => { setFilter(id); const url = new URL(location.href); if (id === "all") url.searchParams.delete("family"); else url.searchParams.set("family", id); history.replaceState(null, "", url); }}>{filters[locale][id]}</button>)}</div><span role="status" aria-live="polite">{selected.length} / 12</span></div>
      <div className="store-catalogue-grid">{selected.map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}</div>
      <section className="store-delivery-note"><h2>{t.delivery}</h2><p>{t.shipping}</p><p className="store-muted">{t.preview}</p></section>
      <NewsletterForm locale={locale} />
    </main>
  </StoreShell>;
}
