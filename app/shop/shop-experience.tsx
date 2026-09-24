"use client";

import SiteHeader, { useLocale } from "../site-header";

const copy = {
  en: { title: "Still in the making.", status: "Coming soon", body: "Our first fragrances are taking shape. We're not accepting orders yet, but you can explore the ideas behind them.", delivery: "When the shop opens, delivery will initially be available to Hong Kong addresses.", explore: "Explore the collections", story: "Our beginning", caption: "Glass, light, and a little curiosity. Generated illustration.", home: "Back to home", skip: "Skip to content" },
  "zh-Hant": { title: "香氣，仍在醞釀。", status: "即將推出", body: "首批香水正在開發中，暫未接受訂購。你可以先認識每個系列背後的構想。", delivery: "商店開放初期，只會送貨到香港地址。", explore: "探索系列", story: "我們的起點", caption: "玻璃、光與一點好奇心。生成概念圖。", home: "返回首頁", skip: "跳至內容" },
  "zh-Hans": { title: "香气，仍在酝酿。", status: "即将推出", body: "首批香水正在开发中，暂未接受订购。你可以先认识每个系列背后的构想。", delivery: "商店开放初期，只会送货到香港地址。", explore: "探索系列", story: "我们的起点", caption: "玻璃、光与一点好奇心。生成概念图。", home: "返回首页", skip: "跳至内容" },
};

export default function ShopExperience() {
  const [locale, setLocale] = useLocale();
  const t = copy[locale];
  return <>
    <a className="skip-link" href="#shop-content">{t.skip}</a>
    <SiteHeader locale={locale} onLocaleChange={setLocale} shop />
    <main className="shop-page" id="shop-content">
      <div className="shop-copy">
        <h1>{t.title}</h1>
        <p className="shop-status">{t.status}</p>
        <p className="shop-intro">{t.body}</p>
        <div className="shop-actions"><a className="action action-primary" href="/#collections">{t.explore}</a><a className="shop-story" href="/#about">{t.story}</a></div>
        <p className="shop-delivery">{t.delivery}</p>
      </div>
      <figure className="shop-image"><img src="/media/element-lab.webp" alt="" /><figcaption>{t.caption}</figcaption></figure>
    </main>
    <footer className="shop-footer"><span>YAT.lifestyle</span><a href="/">{t.home}</a></footer>
  </>;
}
