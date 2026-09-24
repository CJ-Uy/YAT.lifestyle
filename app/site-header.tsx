"use client";

import { useEffect, useRef, useState } from "react";

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
  const languageRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !languageRef.current?.contains(event.target)) languageRef.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  const t = navigation[locale];
  const home = shop ? "/" : "";
  const links = [["top", t.home], ["collections", t.collections], ["process", t.process], ["about", t.about]];
  return <header className="site-header">
    <a className="wordmark" href={`${home}#top`} aria-label={`YAT.lifestyle · ${t.home}`}>
      <img className="brand-drop" src="/brand-emblem.svg" alt="" width="64" height="100" />
    </a>
    <nav aria-label="Primary navigation" className="primary-nav">{links.filter(([id]) => id !== "top").map(([id, label]) => <a href={`${home}#${id}`} key={id}>{label}</a>)}</nav>
    <details className="mobile-nav">
      <summary>{t.menu}<svg aria-hidden="true" width="16" height="12" viewBox="0 0 16 12"><path d="M1 2h14M1 10h14" stroke="currentColor" /></svg></summary>
      <nav aria-label="Mobile navigation">{links.map(([id, label]) => <a href={`${home}#${id}`} key={id} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>{label}</a>)}</nav>
    </details>
    <div className="header-tools">
      <details className="language-select" ref={languageRef} onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
      }} onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.currentTarget.open = false;
          event.currentTarget.querySelector("summary")?.focus();
          event.preventDefault();
        }
      }}>
        <summary aria-label={`${t.language}: ${languages.find((language) => language.id === locale)?.name}`}>
          <span className="language-full">{languages.find((language) => language.id === locale)?.name}</span>
          <span className="language-short" aria-hidden="true">{locale === "en" ? "EN" : locale === "zh-Hant" ? "繁" : "简"}</span>
          <svg className="language-chevron" aria-hidden="true" width="10" height="6" viewBox="0 0 10 6"><path d="m1 1 4 4 4-4" fill="none" stroke="currentColor" /></svg>
        </summary>
        <div className="language-options" role="group" aria-label={t.language}>{languages.map((language) => <button type="button" key={language.id} lang={language.id} aria-pressed={locale === language.id} onClick={() => {
          onLocaleChange(language.id);
          if (languageRef.current) languageRef.current.open = false;
          languageRef.current?.querySelector("summary")?.focus();
        }}>{language.name}<svg aria-hidden="true" width="14" height="12" viewBox="0 0 14 12"><path d="m2 6 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg></button>)}</div>
      </details>
      <a className="shop-link" href="/shop" aria-current={shop ? "page" : undefined}>{t.shop}<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M2 12 12 2M3 2h9v9" fill="none" stroke="currentColor" /></svg></a>
    </div>
  </header>;
}
