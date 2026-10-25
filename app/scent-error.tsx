"use client";

import { useEffect } from "react";
import SiteHeader, { useLocale, type Locale } from "./site-header";

const text = (en: string, hant: string, hans: string): Record<Locale, string> => ({ en, "zh-Hant": hant, "zh-Hans": hans });

export default function ScentError({ error = false, reset }: { error?: boolean; reset?: () => void }) {
  const [locale, setLocale] = useLocale();
  // The server title is English; follow the chosen language once it is known.
  useEffect(() => { if (!error) document.title = `${text("Not found", "找不到頁面", "找不到页面")[locale]} | YAT.lifestyle`; }, [error, locale]);
  return <><SiteHeader locale={locale} onLocaleChange={setLocale} subpage /><main className="scent-error" id="top"><div className="cold-drop" aria-hidden="true"><img src="/brand-emblem.svg" width="64" height="100" alt="" /></div><div><span className="eyebrow">YAT.lifestyle / {error ? text("A pause", "稍作停頓", "稍作停顿")[locale] : "404"}</span><h1>{text("This scent trail went cold.", "這條香氣線索，暫時消散了。", "这条香气线索，暂时消散了。")[locale]}</h1><p>{error ? text("Something interrupted the page. Take a breath and try again, or return to a familiar scent.", "頁面暫時中斷。深呼吸，再試一次，或回到熟悉的香氣。", "页面暂时中断。深呼吸，再试一次，或回到熟悉的香气。")[locale] : text("We couldn't find this page. Follow the drop home, or browse the fragrances.", "找不到這個頁面。跟隨香氣回到首頁，或瀏覽香水。", "找不到这个页面。跟随香气回到首页，或浏览香水。")[locale]}</p><div className="scent-error-actions">{reset && <button type="button" className="action primary" onClick={reset}>{text("Try again", "再試一次", "再试一次")[locale]}</button>}<a className="action" href="/">{text("Home", "首頁", "首页")[locale]}</a><a className="action primary" href="/shop">{text("Shop fragrances", "選購香水", "选购香水")[locale]}</a></div></div></main></>;
}
