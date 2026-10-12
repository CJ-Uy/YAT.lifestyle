"use client";

import { useState } from "react";
import { useLocale } from "../../site-header";
import { StoreShell, storeCopy, ProductPhoto, ProductCard, Arrow } from "../../storefront";
import { PRODUCTS, PRICE_CENTS, MAX_PER_SCENT, MAX_BAG_COUNT, formatPrice, type Product } from "../../../lib/shop";
import { useCart } from "../cart";
import { ScentProfile } from "../scent-profile";
import "../product-controls.css";

const copy = {
  en: { add: "Add to cart", added: "Added to your cart", bag: "View cart", notes: "Key notes", smell: "How it smells", profile: "Scent profile", box: "Your gift box", quantity: "Quantity", limit: `Your cart can hold up to ${MAX_PER_SCENT} of each scent and ${MAX_BAG_COUNT} gift boxes in total.`, delivery: "Delivery", more: "Meet another scent", detail: "Scent descriptions interpret the fragrance accords. They describe the smell, rather than a list of natural ingredients.", noStorage: "Your browser cannot save your cart between pages. Enable storage to keep your choices.", included: "Included with every perfume", preview: "Try the checkout preview. No charge and no order will be placed.", boxBody: "A 10 mL perfume in our blue gift box, with artificial decorative flowers. The presentation shown is our actual gift box." },
  "zh-Hant": { add: "加入購物車", added: "已加入購物車", bag: "查看購物車", notes: "主要香調", smell: "氣味描述", profile: "香氣輪廓", box: "你的禮盒", quantity: "數量", limit: `每款最多可選 ${MAX_PER_SCENT} 件，購物車合共最多 ${MAX_BAG_COUNT} 份禮盒。`, delivery: "送貨", more: "認識另一款香氣", detail: "氣味描述根據香調詮釋，並非天然原料清單。", noStorage: "瀏覽器無法跨頁儲存購物車。請啟用儲存功能以保留選擇。", included: "每瓶香水均附", preview: "體驗結帳預覽，不會扣款或建立訂單。", boxBody: "10 mL 香水放進藍色禮盒，配上人造裝飾花。照片展示的是我們實際的禮盒。" },
  "zh-Hans": { add: "加入购物车", added: "已加入购物车", bag: "查看购物车", notes: "主要香调", smell: "气味描述", profile: "香气轮廓", box: "你的礼盒", quantity: "数量", limit: `每款最多可选 ${MAX_PER_SCENT} 件，购物车合共最多 ${MAX_BAG_COUNT} 份礼盒。`, delivery: "配送", more: "认识另一款香气", detail: "气味描述根据香调诠释，并非天然原料清单。", noStorage: "浏览器无法跨页保存购物车。请启用存储功能以保留选择。", included: "每瓶香水均附", preview: "体验结账预览，不会扣款或创建订单。", boxBody: "10 mL 香水放进蓝色礼盒，配上人造装饰花。照片展示的是我们实际的礼盒。" },
};

export default function ProductExperience({ product }: { product: Product }) {
  const [locale, setLocale] = useLocale();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const cart = useCart();
  const t = copy[locale]; const s = storeCopy[locale]; const p = product.copy[locale];
  const inBag = cart.items.find((item) => item.slug === product.slug)?.quantity ?? 0;
  const limit = inBag + quantity > MAX_PER_SCENT || cart.count + quantity > MAX_BAG_COUNT;
  const related = PRODUCTS.filter((candidate) => candidate.slug !== product.slug && candidate.families.some((family) => product.families.includes(family))).slice(0, 3);
  return <StoreShell locale={locale} onLocaleChange={setLocale}>
    <main className="store-page store-product-page" id="store-content">
      <nav className="store-breadcrumb" aria-label={s.all}><a href="/shop">{s.all}</a><span>/</span><span>{product.name}</span></nav>
      <div className="store-product-layout">
        <header className="store-product-identity"><h1>{product.name}</h1><p className="store-product-subtitle">{p.subtitle}</p><div className="store-product-price-row"><p className="store-product-price">{formatPrice(PRICE_CENTS)}</p><a className="store-profile-link" href="#scent-profile">{t.profile}<Arrow /></a></div><p className="store-inclusion">{s.inclusion}</p></header>
        <figure className="store-product-gallery"><ProductPhoto product={product} locale={locale} /></figure>
        <div className="store-purchase">
          <div className="store-add-row"><label className="store-quantity-label">{t.quantity}<span className="store-quantity-control"><select value={quantity} onChange={(event) => { setQuantity(Number(event.target.value)); setAdded(false); }}>{Array.from({ length: MAX_PER_SCENT }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg></span></label><button className="store-btn" type="button" disabled={!cart.ready || limit} onClick={() => { cart.add(product.slug, quantity); setAdded(true); }}>{t.add}<Arrow /></button></div>
          <div className="store-add-result" role="status" aria-live="polite" aria-atomic="true">{added && <><span>{t.added}</span><a href="/bag">{t.bag}<Arrow /></a></>}</div>
          {limit && <p className="store-muted">{t.limit}</p>}{!cart.storageAvailable && <p className="store-muted">{t.noStorage}</p>}
          <div className="store-product-notes"><h2>{t.smell}</h2><p>{p.description}</p><ScentProfile product={product} locale={locale} title={t.profile} /><h3>{t.notes}</h3><p>{p.notes}</p></div>
        </div>
      </div>
      <section className="store-product-box"><img src="/media/yat-official-gift-box.webp" width="896" height="1195" loading="lazy" alt={s.boxAlt} /><div><h2>{t.box}</h2><p>{t.boxBody}</p><p className="store-inclusion">{t.included}</p><h3>{t.delivery}</h3><p>{s.shipping}</p><p className="store-muted">{t.detail}</p></div></section>
      <section className="store-related"><h2>{t.more}</h2><div className="store-featured-grid">{related.map((candidate) => <ProductCard key={candidate.slug} product={candidate} locale={locale} />)}</div></section>
    </main>
  </StoreShell>;
}
