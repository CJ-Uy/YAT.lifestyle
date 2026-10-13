"use client";

import { type ReactNode } from "react";
import SiteHeader, { type Locale, useLocale } from "./site-header";
import { PRICE_CENTS, formatPrice, type Product } from "../lib/shop";
import { useCart } from "./shop/cart";
import { DropletJourney } from "./droplet-journey";
import { ScentFinder } from "./scent-finder";

export const storeCopy = {
  en: { skip: "Skip to content", home: "Home", shop: "Shop fragrances", all: "All fragrances", title: "A little scent.\nA whole feeling.", intro: "Twelve fragrances for the everyday moments you want to keep. Choose a scent for yourself, or someone on your mind.", inclusion: "10 mL perfume + flower gift box", gift: "Ready to give.", giftBody: "Your 10 mL perfume, in a blue gift box with artificial decorative flowers.", choose: "Find your scent.", chooseBody: "Dark tea, soft flowers, warm woods. Start with what you love, and meet the rest along the way.", tea: "Tea & green", woody: "Warm woods", fruity: "Fruit & flowers", about: "Meet Natasha.", aboutBody: "An HKUST Biotechnology student, Natasha founded YAT.LIFESTYLE in Hong Kong.", element: "Curious about your own scent?", elementBody: "Explore Element, our project around personal scent and discovery.", elementAction: "Explore Element", view: "Meet the scent", unisex: "Unisex", care: "Customer care", orders: "Orders & delivery", privacy: "Privacy", delivery: "Hong Kong delivery", shipping: "Hong Kong delivery: HK$30. Estimated dispatch in 1–1.5 weeks; expected delivery within two weeks.", preview: "Hong Kong delivery · Payments handled by Airwallex.", familyLabel: "Explore by scent", photo: "YAT.LIFESTYLE bottle collection", boxAlt: "Blue YAT.LIFESTYLE gift box with a perfume and artificial decorative flowers", handAlt: "A YAT.LIFESTYLE perfume held in the hand", eveningAlt: "An evening mirror photograph with a YAT.LIFESTYLE perfume", footnote: "Where science meets scent." },
  "zh-Hant": { skip: "跳至內容", home: "首頁", shop: "選購香水", all: "全部香水", title: "一點香氣，\n一整個感覺。", intro: "十二款香氣，留住你想珍藏的日常時刻。為自己，或心裡的那個人，選一款香水。", inclusion: "10 mL 香水 + 花禮盒", gift: "心意，已備好。", giftBody: "10 mL 香水，配上藍色禮盒與人造裝飾花。", choose: "找到你的香氣。", chooseBody: "深沉茶香、柔和花香、溫暖木質。從你喜歡的氣味開始，再慢慢認識其餘香氣。", tea: "茶香與綠意", woody: "溫暖木質", fruity: "花果香", about: "認識 Natasha。", aboutBody: "香港科技大學生物科技學生 Natasha，在香港創立 YAT.LIFESTYLE。", element: "想探索自己的香氣？", elementBody: "認識 Element，我們關於個人香氣與探索的計劃。", elementAction: "探索 Element", view: "認識香氣", unisex: "男女皆宜", care: "顧客服務", orders: "訂購與送貨", privacy: "私隱政策", delivery: "香港送貨", shipping: "香港送貨費 HK$30。預計 1–1.5 星期內寄出，兩星期內送達。", preview: "香港送貨 · 付款由 Airwallex 處理。", familyLabel: "按香調探索", photo: "YAT.LIFESTYLE 香水瓶系列", boxAlt: "藍色 YAT.LIFESTYLE 禮盒，內有香水與人造裝飾花", handAlt: "手中握著一瓶 YAT.LIFESTYLE 香水", eveningAlt: "夜間鏡中照片與一瓶 YAT.LIFESTYLE 香水", footnote: "科學與香氣相遇。" },
  "zh-Hans": { skip: "跳至内容", home: "首页", shop: "选购香水", all: "全部香水", title: "一点香气，\n一整个感觉。", intro: "十二款香气，留住你想珍藏的日常时刻。为自己，或心里的那个人，选一款香水。", inclusion: "10 mL 香水 + 花礼盒", gift: "心意，已备好。", giftBody: "10 mL 香水，配上蓝色礼盒与人造装饰花。", choose: "找到你的香气。", chooseBody: "深沉茶香、柔和花香、温暖木质。从你喜欢的气味开始，再慢慢认识其余香气。", tea: "茶香与绿意", woody: "温暖木质", fruity: "花果香", about: "认识 Natasha。", aboutBody: "香港科技大学生物科技学生 Natasha，在香港创立 YAT.LIFESTYLE。", element: "想探索自己的香气？", elementBody: "认识 Element，我们关于个人香气与探索的计划。", elementAction: "探索 Element", view: "认识香气", unisex: "男女皆宜", care: "客户服务", orders: "订购与配送", privacy: "隐私政策", delivery: "香港配送", shipping: "香港配送费 HK$30。预计 1–1.5 星期内寄出，两星期内送达。", preview: "香港配送 · 付款由 Airwallex 处理。", familyLabel: "按香调探索", photo: "YAT.LIFESTYLE 香水瓶系列", boxAlt: "蓝色 YAT.LIFESTYLE 礼盒，内有香水与人造装饰花", handAlt: "手中握着一瓶 YAT.LIFESTYLE 香水", eveningAlt: "夜间镜中照片与一瓶 YAT.LIFESTYLE 香水", footnote: "科学与香气相遇。" },
};

export function Arrow() { return <svg aria-hidden="true" width="22" height="12" viewBox="0 0 22 12"><path d="M1 6h19m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>; }

export function StoreShell({ locale, onLocaleChange, children }: { locale: Locale; onLocaleChange: (locale: Locale) => void; children: ReactNode }) {
  const cart = useCart();
  const t = storeCopy[locale];
  return <div className="storefront" id="top">
    <a className="skip-link" href="#store-content">{t.skip}</a>
    <SiteHeader locale={locale} onLocaleChange={onLocaleChange} brand="yat" bagCount={cart.count} />
    {children}
    <footer className="store-footer">
      <div className="store-footer-brand"><a href="/">YAT.LIFESTYLE</a><p>{t.footnote}</p></div>
      <div><a href="/shop">{t.all}</a><a href="/privacy">{t.privacy}</a></div>
      <div><span>{t.care}</span><a href="mailto:care@yatlifestyle.com">care@yatlifestyle.com</a><span>{t.orders}</span><a href="mailto:orders@yatlifestyle.com">orders@yatlifestyle.com</a></div>
      <p className="store-footer-preview">{t.preview}</p>
    </footer>
  </div>;
}

// shortcut: AI still lifes interpret scent accords; retain the real package photograph as the delivery reference.
export function ProductPhoto({ product, locale }: { product: Product; locale: Locale }) {
  const alt = locale === "en" ? `AI scent still life for ${product.name}: ${product.copy.en.notes}` : locale === "zh-Hant" ? `${product.name} AI 香氣意象：${product.copy[locale].notes}` : `${product.name} AI 香气意象：${product.copy[locale].notes}`;
  return <div className="store-product-photo"><img src={`/media/scents/${product.slug}.webp`} width="1120" height="1400" loading="lazy" alt={alt} /></div>;
}

export function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const t = storeCopy[locale];
  return <article className="store-product-card">
    <a href={`/shop/${product.slug}`} className="store-product-image-link" aria-label={`${t.view}: ${product.name}`}><ProductPhoto product={product} locale={locale} /></a>
    <div className="store-product-card-top"><h3><a href={`/shop/${product.slug}`}>{product.name}</a></h3></div>
    <p>{product.copy[locale].subtitle}</p>
    <div className="store-product-card-bottom"><a href={`/shop/${product.slug}`} aria-label={`${t.view}: ${product.name}`}>{t.view}<Arrow /></a></div>
  </article>;
}

export function StoreHome() {
  const [locale, setLocale] = useLocale();
  const t = storeCopy[locale];
  return <StoreShell locale={locale} onLocaleChange={setLocale}>
    <main id="store-content">
      <DropletJourney locale={locale} />
      <section className="store-selection" id="collections">
        <ScentFinder locale={locale} />
      </section>
      <section className="store-gift" id="gift-box" aria-labelledby="gift-heading">
        <figure><img src="/media/yat-official-gift-box.webp" width="896" height="1195" loading="lazy" alt={t.boxAlt} /></figure>
        <div className="store-gift-copy">
          <p className="store-gift-eyebrow">YAT.LIFESTYLE · {t.unisex}</p>
          <h2 id="gift-heading">{t.gift}</h2><p className="store-gift-description">{t.giftBody}</p>
          <div className="store-gift-details"><span>{t.inclusion}</span><strong className="store-gift-price">{formatPrice(PRICE_CENTS)}</strong></div>
          <a className="store-btn" href="/shop">{t.shop}<Arrow /></a>
          <p className="store-gift-delivery">{t.shipping}</p>
        </div>
      </section>
      <section className="store-about" id="about"><div><h2>{t.about}</h2><p>{t.aboutBody}</p></div><div className="store-about-photos"><figure><img src="/media/yat-official-evening.webp" width="1206" height="1569" loading="lazy" alt={t.eveningAlt} /></figure><figure><img src="/media/yat-official-in-hand.webp" width="1600" height="2400" loading="lazy" alt={t.handAlt} /></figure></div></section>
    </main>
  </StoreShell>;
}
