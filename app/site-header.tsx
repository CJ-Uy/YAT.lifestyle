"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export type Locale = "en" | "zh-Hant" | "zh-Hans";
const languages: { id: Locale; name: string }[] = [
  { id: "en", name: "English" }, { id: "zh-Hant", name: "繁體中文" }, { id: "zh-Hans", name: "简体中文" },
];
const navigation = {
  en: { home: "Home", collections: "Regular lines", process: "Process", about: "About", shop: "Shop", menu: "Menu", language: "Language", demo: "Try the demo", primary: "Primary navigation", mobile: "Mobile navigation" },
  "zh-Hant": { home: "首頁", collections: "常規系列", process: "過程", about: "關於", shop: "商店", menu: "選單", language: "語言", demo: "體驗示範", primary: "主要導覽", mobile: "手機導覽" },
  "zh-Hans": { home: "首页", collections: "常规系列", process: "过程", about: "关于", shop: "商店", menu: "菜单", language: "语言", demo: "体验演示", primary: "主要导航", mobile: "手机导航" },
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

export default function SiteHeader({ locale, onLocaleChange, shop = false, subpage = false }: { locale: Locale; onLocaleChange: (locale: Locale) => void; shop?: boolean; subpage?: boolean }) {
  const pathname = usePathname();
  const elementPage = pathname === "/" || pathname?.startsWith("/element");
  const languageRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !languageRef.current?.contains(event.target)) languageRef.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  const t = navigation[locale];
  const home = shop || subpage ? "/" : "";
  const links = [["top", t.home], ["collections", t.collections], ["process", t.process], ["about", t.about]];
  return <header className="site-header">
    <a className="wordmark" href={`${home}#top`} aria-label={`YAT.lifestyle · ${t.home}`}>
      <img className="brand-drop" src="/brand-emblem.svg" alt="" width="64" height="100" />
    </a>
    <nav aria-label={t.primary} className="primary-nav"><a href="/element" aria-current={pathname === "/element" ? "page" : undefined}>Element</a><details className="regular-nav"><summary>{t.collections}</summary><div><a href="/#collections">{t.collections}</a><a href="/#hours">Hours</a><a href="/#afterimage">Afterimage</a></div></details>{links.filter(([id]) => id === "process" || id === "about").map(([id, label]) => <a href={`${home}#${id}`} key={id}>{label}</a>)}</nav>
    <details className="mobile-nav">
      <summary>{t.menu}<svg aria-hidden="true" width="16" height="12" viewBox="0 0 16 12"><path d="M1 2h14M1 10h14" stroke="currentColor" /></svg></summary>
      <nav aria-label={t.mobile}><a href="/element" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>Element</a>{links.filter(([id]) => id === "top" || id === "collections").map(([id, label]) => <a href={`${home}#${id}`} key={id} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>{label}</a>)}<a className="regular-child" href="/#hours" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>Hours</a><a className="regular-child" href="/#afterimage" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>Afterimage</a>{links.filter(([id]) => id === "process" || id === "about").map(([id, label]) => <a href={`${home}#${id}`} key={id} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}>{label}</a>)}</nav>
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
      {!pathname?.startsWith("/element/demo") && <a className={`shop-link${elementPage ? " header-demo" : ""}`} href={elementPage ? "/element/demo" : "/shop"} aria-current={shop ? "page" : undefined}>{elementPage ? t.demo : t.shop}<svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d="M2 12 12 2M3 2h9v9" fill="none" stroke="currentColor" /></svg></a>}
    </div>
  </header>;
}
