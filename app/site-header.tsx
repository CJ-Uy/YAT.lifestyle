"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ElementSignature } from "./element/element-signature";

export type Locale = "en" | "zh-Hant" | "zh-Hans";
const languages: { id: Locale; name: string }[] = [
  { id: "en", name: "English" }, { id: "zh-Hant", name: "繁體中文" }, { id: "zh-Hans", name: "简体中文" },
];
const navigation = {
  en: { home: "Home", language: "Language", primary: "Primary navigation" },
  "zh-Hant": { home: "首頁", language: "語言", primary: "主要導覽" },
  "zh-Hans": { home: "首页", language: "语言", primary: "主要导航" },
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

export default function SiteHeader({ locale, onLocaleChange, brand }: { locale: Locale; onLocaleChange: (locale: Locale) => void; shop?: boolean; subpage?: boolean; brand?: "yat" | "element" }) {
  const pathname = usePathname();
  const elementPage = pathname?.startsWith("/element") ?? false;
  const elementBrand = brand === "element" || (!brand && elementPage);
  const languageRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !languageRef.current?.contains(event.target)) languageRef.current?.removeAttribute("open");
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  const t = navigation[locale];
  return <header className={`site-header site-header-simple${elementBrand ? " site-header-element" : ""}`}>
    <a className={`wordmark${elementBrand ? " element-wordmark" : ""}`} href={elementBrand ? "/element" : "/#top"} aria-label={elementBrand ? "Element" : `YAT.lifestyle · ${t.home}`}>
      {elementBrand ? <ElementSignature compact /> : <img className="brand-drop" src="/brand-emblem.svg" alt="" width="64" height="100" />}
    </a>
    <nav aria-label={t.primary} className="primary-nav">
      <a href="/#top" aria-current={pathname === "/" ? "page" : undefined}>{t.home}</a>
      <a href="/element" aria-current={elementPage ? (pathname === "/element" ? "page" : "location") : undefined}>Element</a>
    </nav>
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
    </div>
  </header>;
}
