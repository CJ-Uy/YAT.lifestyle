"use client";

import { useEffect, useState } from "react";

export type Locale = "en" | "zh-Hant" | "zh-Hans";
const languages: { id: Locale; name: string }[] = [
  { id: "en", name: "English" }, { id: "zh-Hant", name: "繁體中文" }, { id: "zh-Hans", name: "简体中文" },
];
const navigation = {
  en: { home: "Home", collections: "Collections", process: "Process", about: "About", shop: "Shop", menu: "Menu", language: "Language" },
  "zh-Hant": { home: "首頁", collections: "系列", process: "過程", about: "關於", shop: "商店", menu: "選單", language: "語言" },
  "zh-Hans": { home: "首页", collections: "系列", process: "过程", about: "关于", shop: "商店", menu: "菜单", language: "语言" },
};

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("yat-language");
      if (languages.some((language) => language.id === saved)) setLocale(saved as Locale);
    } catch { /* Private browsing may disable storage. Language changes still work. */ }
  }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const changeLocale = (next: Locale) => {
    if (!languages.some((language) => language.id === next)) return;
    setLocale(next);
    try { localStorage.setItem("yat-language", next); } catch { /* Keep the in-page choice. */ }
  };
  return [locale, changeLocale] as const;
}

export default function SiteHeader({ locale, onLocaleChange, shop = false }: { locale: Locale; onLocaleChange: (locale: Locale) => void; shop?: boolean }) {
  const t = navigation[locale];
  const home = shop ? "/" : "";
  const links = [["top", t.home], ["collections", t.collections], ["process", t.process], ["about", t.about]];
  return <header className="site-header">
    <a className="wordmark" href={`${home}#top`} aria-label={`YAT.lifestyle · ${t.home}`}>
      <img className="brand-drop" src="/brand-emblem.svg" alt="" width="64" height="100" />
      <span className="brand-type">YAT<span>lifestyle</span></span>
    </a>
    <nav aria-label="Primary navigation" className="primary-nav">{links.filter(([id]) => id !== "top").map(([id, label]) => <a href={`${home}#${id}`} key={id}>{label}</a>)}</nav>
    <details className="mobile-nav">
      <summary>{t.menu}<svg aria-hidden="true" width="16" height="12" viewBox="0 0 16 12"><path d="M1 2h14M1 10h14" stroke="currentColor" /></svg></summary>
      <nav aria-label="Mobile navigation">{links.map(([id, label]) => <a href={`${home}#${id}`} key={id} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>{label}</a>)}</nav>
    </details>
    <div className="header-tools">
      <label className="language-select"><span className="visually-hidden">{t.language}</span><select value={locale} onChange={(event) => onLocaleChange(event.target.value as Locale)}>{languages.map((language) => <option key={language.id} value={language.id} lang={language.id}>{language.name}</option>)}</select><svg aria-hidden="true" width="10" height="6" viewBox="0 0 10 6"><path d="m1 1 4 4 4-4" fill="none" stroke="currentColor" /></svg></label>
      <a className="shop-link" href="/shop" aria-current={shop ? "page" : undefined}>{t.shop}<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M2 12 12 2M3 2h9v9" fill="none" stroke="currentColor" /></svg></a>
    </div>
  </header>;
}
