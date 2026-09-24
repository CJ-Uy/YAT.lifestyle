"use client";

import SiteHeader, { useLocale } from "../site-header";
import NewsletterForm from "./newsletter-form";
import { newsletterCopy } from "../../lib/newsletter";

const copy = {
  en: { title: "Still in the making.", status: "Coming soon", body: "Our first fragrances are taking shape. We're not accepting orders yet, but you can explore the ideas behind them.", delivery: "When the shop opens, delivery will initially be available to Hong Kong addresses.", explore: "Explore the collections", story: "Our beginning", caption: "Generated concept image. Not the final bottle design.", home: "Back to home", skip: "Skip to content" },
  "zh-Hant": { title: "香氣，仍在醞釀。", status: "即將推出", body: "首批香水正在開發中，暫未接受訂購。你可以先認識每個系列背後的構想。", delivery: "商店開放初期，只會送貨到香港地址。", explore: "探索系列", story: "我們的起點", caption: "生成概念圖，並非最終瓶身設計。", home: "返回首頁", skip: "跳至內容" },
  "zh-Hans": { title: "香气，仍在酝酿。", status: "即将推出", body: "首批香水正在开发中，暂未接受订购。你可以先认识每个系列背后的构想。", delivery: "商店开放初期，只会送货到香港地址。", explore: "探索系列", story: "我们的起点", caption: "生成概念图，并非最终瓶身设计。", home: "返回首页", skip: "跳至内容" },
};

const contactCopy = {
  en: { care: "Customer care", orders: "Order & delivery questions", general: "General inquiries" },
  "zh-Hant": { care: "顧客服務", orders: "訂購與送貨查詢", general: "一般查詢" },
  "zh-Hans": { care: "客户服务", orders: "订购与配送咨询", general: "一般咨询" },
};

export default function ShopExperience() {
  const [locale, setLocale] = useLocale();
  const t = copy[locale];
  const contact = contactCopy[locale];
  return <>
    <a className="skip-link" href="#shop-content">{t.skip}</a>
    <SiteHeader locale={locale} onLocaleChange={setLocale} shop />
    <main className="shop-page" id="shop-content">
      <div className="shop-copy">
        <h1>{t.title}</h1>
        <p className="shop-status">{t.status}</p>
        <p className="shop-intro">{t.body}</p>
        <NewsletterForm locale={locale} />
        <div className="shop-actions"><a className="action action-primary" href="/#collections">{t.explore}</a><a className="shop-story" href="/#about">{t.story}</a></div>
        <p className="shop-delivery">{t.delivery}</p>
        <div className="shop-contacts">
          <a className="email-link" href="mailto:care@yatlifestyle.com"><span>{contact.care}</span><span>care@yatlifestyle.com</span></a>
          <a className="email-link" href="mailto:orders@yatlifestyle.com"><span>{contact.orders}</span><span>orders@yatlifestyle.com</span></a>
        </div>
      </div>
      <figure className="shop-image"><img src="/media/shop-first-edition.webp" width="1152" height="2048" alt="" /><figcaption>{t.caption}</figcaption></figure>
    </main>
    <footer className="shop-footer"><span>YAT.lifestyle</span><a className="email-link" href="mailto:hello@yatlifestyle.com"><span>{contact.general}</span><span>hello@yatlifestyle.com</span></a><a href="/privacy">{newsletterCopy[locale].privacy}</a><a href="/">{t.home}</a></footer>
  </>;
}
