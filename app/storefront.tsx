"use client";

import { type ReactNode, useEffect, useState } from "react";
import SiteHeader, { type Locale, useLocale } from "./site-header";
import { MAX_BAG_COUNT, MAX_PER_SCENT, PRICE_CENTS, formatPrice, type Product } from "../lib/shop";
import { useCart } from "./shop/cart";
import { SOLD_OUT_COPY, useStock } from "./shop/stock";
import { DropletJourney } from "./droplet-journey";
import { ScentFinder } from "./scent-finder";

export const storeCopy = {
  en: { skip: "Skip to content", home: "Home", shop: "Shop fragrances", all: "All fragrances", title: "A little scent.\nA whole feeling.", intro: "Twelve fragrances for the everyday moments you want to keep. Choose a scent for yourself, or someone on your mind.", inclusion: "10 mL perfume · gift box with flowers", gift: "Gift-boxed, every time.", giftBody: "Every 10 mL perfume arrives in our blue gift box, arranged with artificial flowers. Nothing left to wrap.", choose: "Find your scent.", chooseBody: "From dark tea to soft musk. Start with a note you love.", tea: "Tea & green", woody: "Warm woods", fruity: "Fruit & flowers", about: "Behind the bottle.", aboutBody: "Natasha, a biotechnology student at HKUST, started YAT.LIFESTYLE in Hong Kong to bring lab curiosity to perfume.", element: "Curious about your own scent?", elementBody: "Explore Element, our project around personal scent and discovery.", elementAction: "Explore Element", view: "View", addTo: "Add to cart", added: "Added", unisex: "Unisex", care: "Customer care", orders: "Orders & delivery", privacy: "Privacy", delivery: "Hong Kong delivery", shipping: "Free Hong Kong delivery. Arrives within 2 weeks.", preview: "Free Hong Kong delivery · Secure payment by Airwallex.", familyLabel: "Explore by scent", photo: "YAT.LIFESTYLE bottle collection", boxAlt: "Blue YAT.LIFESTYLE gift box with a perfume and artificial decorative flowers", handAlt: "A YAT.LIFESTYLE perfume held in the hand", eveningAlt: "An evening mirror photograph with a YAT.LIFESTYLE perfume", footnote: "Where science meets scent." },
  "zh-Hant": { skip: "跳至內容", home: "首頁", shop: "選購香水", all: "全部香水", title: "一點香氣，\n一整個感覺。", intro: "十二款香氣，留住你想珍藏的日常時刻。為自己，或心裡的那個人，選一款香水。", inclusion: "10 mL 香水 · 附花禮盒", gift: "每一瓶，都已包好。", giftBody: "每瓶 10 mL 香水都放進藍色禮盒，配上人造花，收到即可送出。", choose: "找到你的香氣。", chooseBody: "由深沉茶香到柔和麝香。從你喜歡的香調開始。", tea: "茶香與綠意", woody: "溫暖木質", fruity: "花果香", about: "香氣背後的人。", aboutBody: "Natasha 是香港科技大學生物科技學生，在香港創立 YAT.LIFESTYLE，把實驗室的好奇心帶進香水。", element: "想探索自己的香氣？", elementBody: "認識 Element，我們關於個人香氣與探索的計劃。", elementAction: "探索 Element", view: "查看", addTo: "加入購物車", added: "已加入", unisex: "男女皆宜", care: "顧客服務", orders: "訂購與送貨", privacy: "私隱政策", delivery: "香港送貨", shipping: "香港免費送貨，兩星期內送達。", preview: "香港免費送貨 · 由 Airwallex 安全付款。", familyLabel: "按香調探索", photo: "YAT.LIFESTYLE 香水瓶系列", boxAlt: "藍色 YAT.LIFESTYLE 禮盒，內有香水與人造裝飾花", handAlt: "手中握著一瓶 YAT.LIFESTYLE 香水", eveningAlt: "夜間鏡中照片與一瓶 YAT.LIFESTYLE 香水", footnote: "科學與香氣相遇。" },
  "zh-Hans": { skip: "跳至内容", home: "首页", shop: "选购香水", all: "全部香水", title: "一点香气，\n一整个感觉。", intro: "十二款香气，留住你想珍藏的日常时刻。为自己，或心里的那个人，选一款香水。", inclusion: "10 mL 香水 · 附花礼盒", gift: "每一瓶，都已包好。", giftBody: "每瓶 10 mL 香水都放进蓝色礼盒，配上人造花，收到即可送出。", choose: "找到你的香气。", chooseBody: "由深沉茶香到柔和麝香。从你喜欢的香调开始。", tea: "茶香与绿意", woody: "温暖木质", fruity: "花果香", about: "香气背后的人。", aboutBody: "Natasha 是香港科技大学生物科技学生，在香港创立 YAT.LIFESTYLE，把实验室的好奇心带进香水。", element: "想探索自己的香气？", elementBody: "认识 Element，我们关于个人香气与探索的计划。", elementAction: "探索 Element", view: "查看", addTo: "加入购物车", added: "已加入", unisex: "男女皆宜", care: "客户服务", orders: "订购与配送", privacy: "隐私政策", delivery: "香港配送", shipping: "香港免费配送，两星期内送达。", preview: "香港免费配送 · 由 Airwallex 安全付款。", familyLabel: "按香调探索", photo: "YAT.LIFESTYLE 香水瓶系列", boxAlt: "蓝色 YAT.LIFESTYLE 礼盒，内有香水与人造装饰花", handAlt: "手中握着一瓶 YAT.LIFESTYLE 香水", eveningAlt: "夜间镜中照片与一瓶 YAT.LIFESTYLE 香水", footnote: "科学与香气相遇。" },
};

export function Arrow() { return <svg aria-hidden="true" width="22" height="12" viewBox="0 0 22 12"><path d="M1 6h19m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>; }

export function StoreShell({ locale, onLocaleChange, children }: { locale: Locale; onLocaleChange: (locale: Locale) => void; children: ReactNode }) {
  const cart = useCart();
  const t = storeCopy[locale];
  return <div className="storefront" id="top" lang={locale}>
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
// Matches the 3-column grid that stacks to 2 below 760px and 1 below 370px.
export const CARD_SIZES = "(max-width: 370px) 100vw, (max-width: 760px) 50vw, 33vw";

// `priority` marks above-the-fold photos: eager and fetched first. Everything else waits until scrolled near.
export function ProductPhoto({ product, locale, priority = false, sizes = CARD_SIZES }: { product: Product; locale: Locale; priority?: boolean; sizes?: string }) {
  const alt = locale === "en" ? `AI scent still life for ${product.name}: ${product.copy.en.notes}` : locale === "zh-Hant" ? `${product.name} AI 香氣意象：${product.copy[locale].notes}` : `${product.name} AI 香气意象：${product.copy[locale].notes}`;
  const src = `/media/scents/${product.slug}`;
  return <div className="store-product-photo"><img src={`${src}-800.webp`} srcSet={`${src}-480.webp 480w, ${src}-800.webp 800w, ${src}.webp 1024w`} sizes={sizes} width="1120" height="1400" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding={priority ? undefined : "async"} alt={alt} /></div>;
}

export function ProductCard({ product, locale, priority, sizes }: { product: Product; locale: Locale; priority?: boolean; sizes?: string }) {
  const t = storeCopy[locale];
  const cart = useCart();
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 2200);
    return () => clearTimeout(timer);
  }, [added]);
  const full = (cart.items.find((item) => item.slug === product.slug)?.quantity ?? 0) >= MAX_PER_SCENT || cart.count >= MAX_BAG_COUNT;
  const soldOut = useStock().isSoldOut(product.slug);
  return <article className="store-product-card">
    <a href={`/shop/${product.slug}`} className="store-product-image-link" aria-label={`${t.view}: ${product.name}`}><ProductPhoto product={product} locale={locale} priority={priority} sizes={sizes} /></a>
    <div className="store-product-card-top"><h3><a href={`/shop/${product.slug}`}>{product.name}</a></h3><span className="store-product-card-price">{formatPrice(PRICE_CENTS)}</span></div>
    <p>{product.copy[locale].subtitle}</p>
    {soldOut ? <button className="store-card-add" type="button" disabled data-sold-out aria-label={`${SOLD_OUT_COPY[locale].soldOut}: ${product.name}`}>{SOLD_OUT_COPY[locale].soldOut}</button>
      : <button className="store-card-add" type="button" data-added={added || undefined} disabled={!cart.ready || full} aria-label={`${t.addTo}: ${product.name}`} onClick={() => { cart.add(product.slug, 1); setAdded(true); }}>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14"><path d={added ? "m2 7 3.5 3.5L12 4" : "M7 1v12M1 7h12"} fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>{added ? t.added : t.addTo}
    </button>}
  </article>;
}

export function StoreHome({ initialLocale }: { initialLocale?: Locale }) {
  const [locale, setLocale] = useLocale(initialLocale);
  const t = storeCopy[locale];
  return <StoreShell locale={locale} onLocaleChange={setLocale}>
    <main id="store-content">
      <DropletJourney locale={locale} />
      <section className="store-selection" id="collections">
        <ScentFinder locale={locale} />
      </section>
      <section className="store-gift" id="gift-box" aria-labelledby="gift-heading">
        <figure className="store-photo-frame"><img src="/media/yat-official-gift-box.webp" width="896" height="1195" loading="lazy" decoding="async" alt={t.boxAlt} /></figure>
        <div className="store-gift-copy">
          <p className="store-gift-eyebrow">YAT.LIFESTYLE · {t.unisex}</p>
          <h2 id="gift-heading">{t.gift}</h2><p className="store-gift-description">{t.giftBody}</p>
          <div className="store-gift-details"><span>{t.inclusion}</span><strong className="store-gift-price">{formatPrice(PRICE_CENTS)}</strong></div>
          <a className="store-btn" href="/shop">{t.shop}<Arrow /></a>
          <p className="store-gift-delivery">{t.shipping}</p>
        </div>
      </section>
      <section className="store-about" id="about"><div><h2>{t.about}</h2><p>{t.aboutBody}</p></div><div className="store-about-photos"><figure className="store-photo-frame"><img src="/media/yat-official-evening.webp" width="1206" height="1570" loading="lazy" decoding="async" alt={t.eveningAlt} /></figure><figure className="store-photo-frame"><img src="/media/yat-official-in-hand-800.webp" srcSet="/media/yat-official-in-hand-800.webp 800w, /media/yat-official-in-hand.webp 1600w" sizes="(max-width: 760px) 40vw, 310px" width="1600" height="2400" loading="lazy" decoding="async" alt={t.handAlt} /></figure></div></section>
    </main>
  </StoreShell>;
}
