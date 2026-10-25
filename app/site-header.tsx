"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ElementSignature } from "./element/element-signature";

export type Locale = "en" | "zh-Hant" | "zh-Hans";
const languages: { id: Locale; name: string }[] = [
  { id: "en", name: "English" }, { id: "zh-Hant", name: "繁體中文" }, { id: "zh-Hans", name: "简体中文" },
];
const navigation = {
  en: { home: "Home", shop: "Shop", about: "Our story", bag: "Cart", language: "Language", primary: "Primary navigation" },
  "zh-Hant": { home: "首頁", shop: "香水", about: "關於我們", bag: "購物車", language: "語言", primary: "主要導覽" },
  "zh-Hans": { home: "首页", shop: "香水", about: "关于我们", bag: "购物车", language: "语言", primary: "主要导航" },
};

const icons = {
  home: "M3.5 10.5 12 3.5l8.5 7M5.5 9v11.5h13V9M10 20.5v-6h4v6",
  shop: "M9.5 2.5h5v4h-5ZM8.5 8h7a2 2 0 0 1 2 2v9.5a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2ZM9.5 14.5h5",
  language: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3Z",
  cart: "M2 3h3l3 12h11l3-9H6M9 20h.01M19 20h.01",
};
export const lineIcon = (d: string) => <svg className="line-icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;

const isLocale = (value: unknown): value is Locale => languages.some((language) => language.id === value);

// The server renders `initial` from ?lang=; a ?lang= link outranks the saved choice, and the URL follows the language so each edition keeps its own address.
export function useLocale(initial: Locale = "en") {
  const [locale, setLocale] = useState<Locale>(initial);
  useEffect(() => {
    const linked = new URLSearchParams(location.search).get("lang");
    if (isLocale(linked)) setLocale(linked);
    try {
      if (isLocale(linked)) localStorage.setItem("yat-language", linked);
      else {
        const saved = localStorage.getItem("yat-language");
        if (isLocale(saved)) setLocale(saved);
      }
    } catch { /* Private browsing may disable storage. Language changes still work. */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    const url = new URL(location.href);
    if ((url.searchParams.get("lang") ?? "en") === locale) return;
    if (locale === "en") url.searchParams.delete("lang"); else url.searchParams.set("lang", locale);
    history.replaceState(history.state, "", url);
  }, [locale]);
  const changeLocale = (next: Locale) => {
    if (!isLocale(next)) return;
    setLocale(next);
    try { localStorage.setItem("yat-language", next); } catch { /* Keep the in-page choice. */ }
  };
  return [locale, changeLocale] as const;
}

export default function SiteHeader({ locale, onLocaleChange, brand, bagCount }: { locale: Locale; onLocaleChange: (locale: Locale) => void; shop?: boolean; subpage?: boolean; brand?: "yat" | "element"; bagCount?: number }) {
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
      {elementBrand ? <ElementSignature compact /> : <><img className="brand-drop" src={bagCount === undefined ? "/brand-emblem.svg" : "/brand-emblem-light.svg"} alt="" width="64" height="100" />{bagCount !== undefined && <span className="store-wordmark">YAT.LIFESTYLE</span>}</>}
    </a>
    <nav aria-label={t.primary} className="primary-nav">
      {bagCount === undefined ? <a href="/#top" aria-current={pathname === "/" ? "page" : undefined}>{t.home}</a> : <>
        <a href="/" aria-current={pathname === "/" ? "page" : undefined}>{lineIcon(icons.home)}<span className="store-nav-label">{t.home}</span></a>
        <a href="/shop" aria-current={pathname?.startsWith("/shop") ? "page" : undefined}>{lineIcon(icons.shop)}<span className="store-nav-label">{t.shop}</span></a>
      </>}
      {elementPage && <a href="/element" aria-current={pathname === "/element" ? "page" : "location"}>Element</a>}
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
          {bagCount !== undefined && lineIcon(icons.language)}
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
      {bagCount !== undefined && <a className="store-bag-link" href="/bag" aria-current={pathname === "/bag" ? "page" : undefined}>{lineIcon(icons.cart)}<span className="store-nav-label">{t.bag}</span> <span aria-live="polite" aria-atomic="true">({bagCount})</span></a>}
    </div>
  </header>;
}
