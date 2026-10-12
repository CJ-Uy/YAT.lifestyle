"use client";

import { useRef, useState } from "react";
import { DELIVERY_CENTS, MAX_BAG_COUNT, MAX_PER_SCENT, PRICE_CENTS, formatPrice, productBySlug } from "../../lib/shop";
import { useCart } from "../shop/cart";
import { useLocale } from "../site-header";
import { StoreShell } from "../storefront";
import "./cart-refinements.css";

const copy = {
  en: {
    title: "Your cart", intro: "A small collection of scents, ready to review.", loading: "Loading your cart…",
    empty: "Your cart is empty.", emptyBody: "Explore the twelve fragrances and find a scent for your day.", shop: "Shop fragrances",
    pack: "10 mL perfume · blue gift box · artificial flowers", each: "each", lineTotal: "Line total", quantity: "Quantity", increase: "Increase quantity", decrease: "Decrease quantity", remove: "Remove", limits: "Up to 10 per scent, 30 items in your cart.",
    summary: "Cart summary", subtotal: "Items subtotal", delivery: "Hong Kong delivery", total: "Total before vouchers", checkout: "Continue to checkout",
    preview: "Verify your email, review delivery, then continue to payment.", timing: "Estimated dispatch: 1–1.5 weeks. Expected delivery within two weeks. Timing is not guaranteed.",
    storage: "Your browser cannot save this cart. Keep this tab open; it may not carry over to another page.", changed: "Quantity updated for", removed: "Removed from your cart:",
  },
  "zh-Hant": {
    title: "購物車", intro: "查看你選好的香氣。", loading: "正在載入購物車…",
    empty: "購物車暫時沒有商品。", emptyBody: "探索十二款香水，尋找適合今天的香氣。", shop: "選購香水",
    pack: "10 mL 香水 · 藍色禮盒 · 人造花", each: "／件", lineTotal: "商品合計", quantity: "數量", increase: "增加數量", decrease: "減少數量", remove: "移除", limits: "每款最多 10 件，購物車合共最多 30 件。",
    summary: "購物車明細", subtotal: "商品小計", delivery: "香港送貨", total: "優惠前總額", checkout: "繼續結帳",
    preview: "驗證電郵、核對送貨資料，再繼續付款。", timing: "預計 1–1.5 週內出貨，兩週內收貨。以上為估算，並非保證。",
    storage: "瀏覽器無法儲存購物車。請保持此分頁開啟；轉到其他頁面後，商品可能不會保留。", changed: "已更新數量：", removed: "已從購物車移除：",
  },
  "zh-Hans": {
    title: "购物车", intro: "查看你选好的香气。", loading: "正在加载购物车…",
    empty: "购物车暂时没有商品。", emptyBody: "探索十二款香水，寻找适合今天的香气。", shop: "选购香水",
    pack: "10 mL 香水 · 蓝色礼盒 · 人造花", each: "／件", lineTotal: "商品合计", quantity: "数量", increase: "增加数量", decrease: "减少数量", remove: "移除", limits: "每款最多 10 件，购物车合共最多 30 件。",
    summary: "购物车明细", subtotal: "商品小计", delivery: "香港配送", total: "优惠前总额", checkout: "继续结账",
    preview: "验证邮箱、核对配送资料，再继续付款。", timing: "预计 1–1.5 周内发货，两周内收货。以上为估算，并非保证。",
    storage: "浏览器无法保存购物车。请保持此标签页打开；转到其他页面后，商品可能不会保留。", changed: "已更新数量：", removed: "已从购物车移除：",
  },
};

export default function BagExperience() {
  const [locale, setLocale] = useLocale();
  const cart = useCart();
  const [message, setMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const t = copy[locale];

  return <StoreShell locale={locale} onLocaleChange={setLocale}>
    <main className="store-page cart-page" id="store-content">
      <header className="store-heading"><h1 tabIndex={-1} ref={headingRef}>{t.title}</h1><p>{t.intro}</p><p className="cart-format">{t.pack} · <span>{formatPrice(PRICE_CENTS)} {t.each}</span></p></header>
      <p className="store-preview-note">{t.preview}</p>
      <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{message}</p>
      {!cart.ready ? <p className="cart-loading" role="status">{t.loading}</p> : cart.items.length === 0 ? <section className="bag-empty">
        <h2>{t.empty}</h2><p className="store-muted">{t.emptyBody}</p><a className="store-btn" href="/shop">{t.shop}</a>
      </section> : <>
        {!cart.storageAvailable && <p className="checkout-error" role="status">{t.storage}</p>}
        <p className="store-muted" id="bag-quantity-limits">{t.limits}</p>
        <div className="bag-layout">
          <ul className="bag-lines" aria-label={t.title}>{cart.items.map((item) => {
            const product = productBySlug(item.slug);
            if (!product) return null;
            const maxQuantity = Math.min(MAX_PER_SCENT, MAX_BAG_COUNT - cart.count + item.quantity);
            const update = (quantity: number) => {
              const next = Math.min(quantity, maxQuantity);
              cart.setQuantity(item.slug, next);
              setMessage(`${t.changed} ${product.name}. ${t.quantity}: ${next}.`);
            };
            return <li className="bag-line" key={item.slug}>
              <a href={`/shop/${item.slug}`} className="bag-item-image" tabIndex={-1} aria-hidden="true"><img src="/media/yat-official-gift-box.webp" alt="" width="896" height="1195" /></a>
              <div className="bag-item-copy">
                <h2><a href={`/shop/${item.slug}`}>{product.name}</a></h2>
                <p>{product.copy[locale].subtitle}</p>
                <div className="bag-item-actions"><div className="bag-quantity" role="group" aria-label={`${t.quantity}: ${product.name}`}>
                  <button type="button" className="store-btn-secondary" disabled={item.quantity <= 1} aria-label={`${t.decrease}: ${product.name}`} onClick={() => update(item.quantity - 1)}>−</button>
                  <label className="visually-hidden" htmlFor={`quantity-${item.slug}`}>{t.quantity}: {product.name}</label>
                  <input id={`quantity-${item.slug}`} type="number" inputMode="numeric" min="1" max={maxQuantity} step="1" aria-describedby="bag-quantity-limits" value={item.quantity} onChange={(event) => {
                    const next = event.currentTarget.valueAsNumber;
                    if (Number.isSafeInteger(next) && next >= 1) update(next);
                  }} />
                  <button type="button" className="store-btn-secondary" disabled={item.quantity >= maxQuantity} aria-label={`${t.increase}: ${product.name}`} onClick={() => update(item.quantity + 1)}>+</button>
                </div>
                <button type="button" className="bag-remove" aria-label={`${t.remove}: ${product.name}`} onClick={(event) => {
                  const row = event.currentTarget.closest("li");
                  const nextFocus = row?.nextElementSibling?.querySelector<HTMLAnchorElement>(".bag-item-copy h2 a") ?? row?.previousElementSibling?.querySelector<HTMLAnchorElement>(".bag-item-copy h2 a") ?? headingRef.current;
                  cart.remove(item.slug);
                  setMessage(`${t.removed} ${product.name}.`);
                  requestAnimationFrame(() => nextFocus?.focus());
                }}>{t.remove}</button></div>
              </div>
              <p className="bag-line-total"><span className="visually-hidden">{t.lineTotal}: </span>{formatPrice(item.quantity * PRICE_CENTS)}</p>
            </li>;
          })}</ul>
          <aside className="bag-summary" aria-labelledby="bag-summary-heading">
            <h2 id="bag-summary-heading">{t.summary}</h2>
            <dl><div><dt>{t.subtotal}</dt><dd>{formatPrice(cart.subtotal)}</dd></div><div><dt>{t.delivery}</dt><dd>{formatPrice(DELIVERY_CENTS)}</dd></div><div className="bag-total"><dt>{t.total}</dt><dd>{formatPrice(cart.subtotal + DELIVERY_CENTS)}</dd></div></dl>
            <p className="store-muted">{t.timing}</p><a className="store-btn" href="/checkout">{t.checkout}</a><a className="store-btn-secondary" href="/shop">{t.shop}</a>
          </aside>
        </div>
      </>}
    </main>
  </StoreShell>;
}
