"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { PRICE_CENTS, formatDelivery, formatPrice, productBySlug, type CartItem } from "../../lib/shop";
import { useCart } from "../shop/cart";
import { useLocale } from "../site-header";
import { StoreShell } from "../storefront";
import { EmailVerification } from "./email-verification";
import { payWithAirwallex, type Payment } from "./airwallex-client";
import "./checkout-controls.css";

type DeliveryFields = { name: string; email: string; phone: string; district: string; building: string; street: string; notes: string };
type FieldErrors = Partial<Record<keyof DeliveryFields, string>>;
type Review = { items: CartItem[]; subtotal: number; delivery: DeliveryFields };
class VoucherRejected extends Error {}
type Quote = { subtotalCents: number; deliveryCents: number; discountCents: number; totalCents: number; voucherCode: string | null };

const liveCopy = {
  en: { intro: "Verify your email, add your address, then review your order.", preview: "Secure payment with Airwallex", privacy: "We use your details to verify your email, fulfill your order and send updates. See our Privacy Policy.", bag: "Cart", loading: "Loading your cart…", empty: "Add a fragrance before checkout.", reviewButton: "Review order", reviewIntro: "Check your details before continuing to secure payment.", confirm: "Continue to payment", confirmationHint: "Card details are handled by Airwallex. Your order is confirmed after payment succeeds.", editBag: "Edit cart", total: "Total", delivery: "Home delivery", timing: "Free Hong Kong delivery. Arrives within 2 weeks.", voucher: "Voucher code", apply: "Apply", discount: "Voucher", remove: "Remove", calculating: "Checking total…", paying: "Opening secure payment…", verifyError: "Verify your email with a code before continuing.", paymentError: "Payment could not be opened. Try again; your cart is saved.", voucherError: "This voucher cannot be applied. Check the code, or remove it to continue.", voucherRejected: "{code} can't be used. It may be inactive, expired, used up or mistyped.", applied: "applied", quoteError: "We could not check your total. Please try again.", retry: "Try again" },
  "zh-Hant": { intro: "驗證電郵、填寫地址，再核對訂單。", preview: "Airwallex 安全付款", privacy: "我們使用你的資料驗證電郵、處理訂單及傳送通知。詳情請參閱私隱政策。", bag: "購物車", loading: "正在載入購物車…", empty: "請先加入香水，再結帳。", reviewButton: "核對訂單", reviewIntro: "繼續安全付款前，請核對資料。", confirm: "前往付款", confirmationHint: "付款卡資料由 Airwallex 處理。付款成功後，訂單才會確認。", editBag: "修改購物車", total: "總額", delivery: "送貨上門", timing: "香港免費送貨，兩星期內送達。", voucher: "優惠碼", apply: "套用", discount: "優惠", remove: "移除", calculating: "正在核對總額…", paying: "正在開啟安全付款…", verifyError: "請先用驗證碼驗證電郵。", paymentError: "無法開啟付款。請再試一次；購物車已保留。", voucherError: "無法使用此優惠碼。請核對，或移除後繼續。", voucherRejected: "{code} 無法使用，可能已停用、過期、用完或輸入有誤。", applied: "已套用", quoteError: "無法核對總額，請再試一次。", retry: "再試一次" },
  "zh-Hans": { intro: "验证邮箱、填写地址，再核对订单。", preview: "Airwallex 安全付款", privacy: "我们使用你的资料验证邮箱、处理订单及发送通知。详情请参阅隐私政策。", bag: "购物车", loading: "正在加载购物车…", empty: "请先加入香水，再结账。", reviewButton: "核对订单", reviewIntro: "继续安全付款前，请核对资料。", confirm: "前往付款", confirmationHint: "付款卡资料由 Airwallex 处理。付款成功后，订单才会确认。", editBag: "修改购物车", total: "总额", delivery: "送货上门", timing: "香港免费配送，两星期内送达。", voucher: "优惠码", apply: "应用", discount: "优惠", remove: "移除", calculating: "正在核对总额…", paying: "正在打开安全付款…", verifyError: "请先用验证码验证邮箱。", paymentError: "无法打开付款。请重试；购物车已保留。", voucherError: "无法使用此优惠码。请核对，或移除后继续。", voucherRejected: "{code} 无法使用，可能已停用、过期、用完或输入有误。", applied: "已应用", quoteError: "无法核对总额，请重试。", retry: "重试" },
};

const districts = [
  ["central-western", "Central & Western", "中西區", "中西区"], ["eastern", "Eastern", "東區", "东区"],
  ["southern", "Southern", "南區", "南区"], ["wan-chai", "Wan Chai", "灣仔區", "湾仔区"],
  ["kowloon-city", "Kowloon City", "九龍城區", "九龙城区"], ["kwun-tong", "Kwun Tong", "觀塘區", "观塘区"],
  ["sham-shui-po", "Sham Shui Po", "深水埗區", "深水埗区"], ["wong-tai-sin", "Wong Tai Sin", "黃大仙區", "黄大仙区"],
  ["yau-tsim-mong", "Yau Tsim Mong", "油尖旺區", "油尖旺区"], ["islands", "Islands", "離島區", "离岛区"],
  ["kwai-tsing", "Kwai Tsing", "葵青區", "葵青区"], ["north", "North", "北區", "北区"],
  ["sai-kung", "Sai Kung", "西貢區", "西贡区"], ["sha-tin", "Sha Tin", "沙田區", "沙田区"],
  ["tai-po", "Tai Po", "大埔區", "大埔区"], ["tsuen-wan", "Tsuen Wan", "荃灣區", "荃湾区"],
  ["tuen-mun", "Tuen Mun", "屯門區", "屯门区"], ["yuen-long", "Yuen Long", "元朗區", "元朗区"],
] as const;

const copy = {
  en: {
    title: "Hong Kong delivery", intro: "Preview a guest checkout. You can review and edit before continuing.", preview: "Preview checkout — no payment or order will be placed.", privacy: "Your contact and address details are used only for this preview. This site does not save or send them.",
    bag: "Bag", deliveryStep: "Delivery", reviewStep: "Review", loading: "Loading your bag…", empty: "Add a fragrance before previewing checkout.", shop: "Shop fragrances", deliveryHeading: "Contact & delivery address", hongKong: "Delivery region: Hong Kong only",
    name: "Recipient name", email: "Email", phone: "Hong Kong phone number", phoneHint: "Enter eight digits, with or without +852. Spaces and hyphens are accepted.", district: "District", districtPlaceholder: "Select a district", building: "Flat, floor & building", street: "Street / village (optional)", notes: "Delivery notes (optional)", requiredHint: "Name, email, phone, district and building address are required.",
    reviewButton: "Review this preview", errorHeading: "Please check these details", nameError: "Enter the recipient's name.", emailError: "Enter a valid email address.", phoneError: "Enter an eight-digit Hong Kong number, optionally starting with +852.", districtError: "Choose a Hong Kong district.", buildingError: "Enter the flat, floor and building, or a complete village address.",
    summary: "Your order", pack: "10 mL perfume · blue gift box · artificial flowers", quantity: "Quantity", subtotal: "Items subtotal", delivery: "Proposed home delivery", total: "Proposed total", timing: "Estimated to arrive within 2 weeks.",
    reviewHeading: "Review your order", reviewIntro: "These are the items and delivery details selected for this preview.", edit: "Edit delivery details", editBag: "Edit bag", confirm: "Preview confirmation", confirmationHint: "This opens a preview summary. It does not charge you or submit an order.", noScript: "Enable JavaScript to check out securely.", storage: "Your browser cannot save the cart between pages. Review your items before continuing.",
  },
  "zh-Hant": {
    title: "香港送貨", intro: "預覽免登入結帳流程。繼續前可以核對和修改資料。", preview: "結帳預覽 — 不會收取款項或建立訂單。", privacy: "聯絡及地址資料只用於本次預覽，網站不會儲存或傳送。",
    bag: "購物袋", deliveryStep: "送貨", reviewStep: "核對", loading: "正在載入購物袋…", empty: "請先加入香水，再預覽結帳。", shop: "選購香水", deliveryHeading: "聯絡及送貨地址", hongKong: "送貨地區：只限香港",
    name: "收件人姓名", email: "電郵", phone: "香港電話號碼", phoneHint: "輸入八位數字，可加上 +852，亦接受空格及連字號。", district: "地區", districtPlaceholder: "選擇地區", building: "單位、樓層及大廈", street: "街道／村落（選填）", notes: "送貨備註（選填）", requiredHint: "姓名、電郵、電話、地區及大廈地址為必填資料。",
    reviewButton: "核對預覽", errorHeading: "請檢查以下資料", nameError: "請輸入收件人姓名。", emailError: "請輸入有效電郵地址。", phoneError: "請輸入八位香港電話號碼，可加上 +852。", districtError: "請選擇香港地區。", buildingError: "請輸入單位、樓層及大廈，或完整村屋地址。",
    summary: "你的訂單", pack: "10 mL 香水 · 藍色禮盒 · 人造花", quantity: "數量", subtotal: "商品小計", delivery: "暫定送貨上門", total: "暫定總額", timing: "預計兩星期內送達。",
    reviewHeading: "核對訂單", reviewIntro: "以下為本次預覽所選的商品及送貨資料。", edit: "修改送貨資料", editBag: "修改購物袋", confirm: "預覽確認頁", confirmationHint: "只會開啟預覽明細，不會收取款項或提交訂單。", noScript: "請啟用 JavaScript 以安全結帳。", storage: "瀏覽器無法在頁面之間儲存購物車。繼續前請核對商品。",
  },
  "zh-Hans": {
    title: "香港配送", intro: "预览免登录结账流程。继续前可以核对和修改资料。", preview: "结账预览 — 不会收取款项或创建订单。", privacy: "联系及地址资料只用于本次预览，网站不会保存或发送。",
    bag: "购物袋", deliveryStep: "配送", reviewStep: "核对", loading: "正在加载购物袋…", empty: "请先加入香水，再预览结账。", shop: "选购香水", deliveryHeading: "联系及配送地址", hongKong: "配送地区：仅限香港",
    name: "收件人姓名", email: "邮箱", phone: "香港电话号码", phoneHint: "输入八位数字，可加上 +852，也接受空格及连字符。", district: "地区", districtPlaceholder: "选择地区", building: "单元、楼层及大厦", street: "街道／村落（选填）", notes: "配送备注（选填）", requiredHint: "姓名、邮箱、电话、地区及大厦地址为必填资料。",
    reviewButton: "核对预览", errorHeading: "请检查以下资料", nameError: "请输入收件人姓名。", emailError: "请输入有效邮箱地址。", phoneError: "请输入八位香港电话号码，可加上 +852。", districtError: "请选择香港地区。", buildingError: "请输入单元、楼层及大厦，或完整村屋地址。",
    summary: "你的订单", pack: "10 mL 香水 · 蓝色礼盒 · 人造花", quantity: "数量", subtotal: "商品小计", delivery: "暂定送货上门", total: "暂定总额", timing: "预计两星期内送达。",
    reviewHeading: "核对订单", reviewIntro: "以下为本次预览所选的商品及配送资料。", edit: "修改配送资料", editBag: "修改购物袋", confirm: "预览确认页", confirmationHint: "只会打开预览明细，不会收取款项或提交订单。", noScript: "请启用 JavaScript 以安全结账。", storage: "浏览器无法在页面之间保存购物车。继续前请核对商品。",
  },
};

export default function CheckoutExperience() {
  const [locale, setLocale] = useLocale();
  const cart = useCart();
  const t = { ...copy[locale], ...liveCopy[locale] };
  const languageIndex = locale === "en" ? 1 : locale === "zh-Hant" ? 2 : 3;
  const [fields, setFields] = useState<DeliveryFields>({ name: "", email: "", phone: "", district: "", building: "", street: "", notes: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [review, setReview] = useState<Review | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [voucher, setVoucher] = useState("");
  const [voucherNotice, setVoucherNotice] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState(false);
  const [quoteRetry, setQuoteRetry] = useState(0);
  const [paymentError, setPaymentError] = useState(false);
  const [paying, setPaying] = useState(false);
  const requestId = useRef<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (review) reviewRef.current?.focus(); }, [review]);
  const itemsKey = JSON.stringify(review?.items ?? cart.items);
  useEffect(() => {
    if (!cart.ready || itemsKey === "[]") return;
    const controller = new AbortController();
    setQuote(null); setQuoteError(false); requestId.current = null;
    fetch("/api/commerce/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: JSON.parse(itemsKey), voucher }), signal: controller.signal })
      .then(async response => {
        if (!response.ok) {
          const failure = await response.json().catch(() => ({})) as { error?: string };
          if (voucher && (failure.error === "voucher_unavailable" || failure.error === "invalid_voucher")) throw new VoucherRejected();
          throw new Error("quote");
        }
        const value = await response.json() as Quote; if (!controller.signal.aborted) setQuote(value);
      })
      .catch((problem) => {
        if (controller.signal.aborted) return;
        if (problem instanceof VoucherRejected) { setVoucherNotice(voucher); setVoucher(""); setVoucherInput(""); } else setQuoteError(true);
      });
    return () => controller.abort();
  }, [cart.ready, itemsKey, voucher, quoteRetry]);

  const update = (key: keyof DeliveryFields, value: string) => {
    if (key === "email") setVerifiedEmail(null);
    requestId.current = null;
    setFields((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => { const next = { ...previous }; delete next[key]; return next; });
  };
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: FieldErrors = {};
    const emailInput = event.currentTarget.elements.namedItem("email") as HTMLInputElement;
    if (!fields.name.trim()) next.name = t.nameError;
    if (!fields.email.trim() || !emailInput.validity.valid) next.email = t.emailError;
    else if (verifiedEmail !== fields.email.trim().toLowerCase()) next.email = t.verifyError;
    const phone = fields.phone.trim().replace(/[\s()-]/g, "");
    if (!/^(?:\+852|00852)?\d{8}$/.test(phone)) next.phone = t.phoneError;
    if (!districts.some(([id]) => id === fields.district)) next.district = t.districtError;
    if (!fields.building.trim()) next.building = t.buildingError;
    setErrors(next);
    if (Object.keys(next).length) { requestAnimationFrame(() => errorRef.current?.focus()); return; }
    if (!cart.ready || !cart.items.length || !quote) return;
    setReview({ items: cart.items.map((item) => ({ ...item })), subtotal: cart.subtotal, delivery: { ...fields } });
  }
  const selectedItems = review?.items ?? cart.items;
  const errorDescription = (key: keyof DeliveryFields, hint?: string) => [hint, errors[key] ? `${key}-error` : undefined].filter(Boolean).join(" ") || undefined;

  async function pay() {
    if (!review || !quote || paying) return;
    setPaying(true); setPaymentError(false);
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/commerce/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: review.items, details: review.delivery, voucher, locale, requestId: requestId.current }) });
      if (!response.ok) {
        const failure = await response.json().catch(() => ({})) as { error?: string };
        if (voucher && failure.error === "voucher_unavailable") { requestId.current = null; setVoucherNotice(voucher); setVoucher(""); setVoucherInput(""); setPaying(false); return; }
        throw new Error("payment");
      }
      const payment = await response.json() as Payment;
      if (payment.totalCents !== quote.totalCents) { requestId.current = null; setQuoteRetry(n => n + 1); throw new Error("total_changed"); }
      await payWithAirwallex(payment, locale);
    } catch { setPaymentError(true); setPaying(false); }
  }

  return <StoreShell locale={locale} onLocaleChange={setLocale}>
    <main className="store-page" id="store-content">
      <header className="store-heading"><h1>{t.title}</h1><p>{t.intro}</p></header>
      <p className="store-preview-note">{t.preview}</p>
      <noscript><p>{t.noScript}</p></noscript>
      <ol className="checkout-step" aria-label={locale === "en" ? "Checkout steps" : locale === "zh-Hant" ? "結帳步驟" : "结账步骤"}>
        <li><a href="/bag">{t.bag}</a></li><li aria-current={!review ? "step" : undefined}>{t.deliveryStep}</li><li aria-current={review ? "step" : undefined}>{t.reviewStep}</li>
      </ol>
      {!cart.ready ? <p role="status">{t.loading}</p> : !selectedItems.length ? <section className="bag-empty"><h2>{t.empty}</h2><a className="store-btn" href="/shop">{t.shop}</a></section> : <>
        {!cart.storageAvailable && <p className="checkout-error" role="status">{t.storage}</p>}
        <div className="checkout-layout">
          {!review ? <form className="checkout-form" noValidate onSubmit={submit}>
            <h2>{t.deliveryHeading}</h2><p>{t.hongKong}</p><p className="store-muted" id="checkout-required">{t.requiredHint}</p><p className="store-muted">{t.privacy}</p>
            {Object.keys(errors).length > 0 && <div className="checkout-error" ref={errorRef} tabIndex={-1} role="alert"><h3>{t.errorHeading}</h3><ul>{Object.entries(errors).map(([field, message]) => <li key={field}><a href={`#checkout-${field}`}>{message}</a></li>)}</ul></div>}
              <div className="checkout-field"><label htmlFor="checkout-name">{t.name}</label><input ref={nameRef} id="checkout-name" name="name" autoComplete="shipping name" value={fields.name} onChange={(event) => update("name", event.target.value)} required maxLength={120} aria-invalid={!!errors.name} aria-describedby={errorDescription("name")} />{errors.name && <p id="name-error" className="checkout-error">{errors.name}</p>}</div>
              <div className="checkout-field"><label htmlFor="checkout-email">{t.email}</label><input id="checkout-email" name="email" type="email" inputMode="email" autoComplete="email" value={fields.email} onChange={(event) => update("email", event.target.value)} required maxLength={254} aria-invalid={!!errors.email} aria-describedby={errorDescription("email")} />{errors.email && <p id="email-error" className="checkout-error">{errors.email}</p>}</div>
              <EmailVerification email={fields.email} locale={locale} onVerified={setVerifiedEmail} />
              <div className="checkout-field"><label htmlFor="checkout-phone">{t.phone}</label><input id="checkout-phone" name="phone" type="tel" inputMode="tel" autoComplete="shipping tel" value={fields.phone} onChange={(event) => update("phone", event.target.value)} required maxLength={32} aria-invalid={!!errors.phone} aria-describedby={errorDescription("phone", "phone-hint")} /><p id="phone-hint" className="store-muted">{t.phoneHint}</p>{errors.phone && <p id="phone-error" className="checkout-error">{errors.phone}</p>}</div>
              <div className="checkout-field"><label htmlFor="checkout-district">{t.district}</label><select id="checkout-district" name="district" autoComplete="shipping address-level2" value={fields.district} onChange={(event) => update("district", event.target.value)} required aria-invalid={!!errors.district} aria-describedby={errorDescription("district")}><option value="">{t.districtPlaceholder}</option>{districts.map((district) => <option value={district[0]} key={district[0]}>{district[languageIndex]}</option>)}</select>{errors.district && <p id="district-error" className="checkout-error">{errors.district}</p>}</div>
              <div className="checkout-field"><label htmlFor="checkout-building">{t.building}</label><input id="checkout-building" name="building" autoComplete="shipping address-line1" value={fields.building} onChange={(event) => update("building", event.target.value)} required maxLength={250} aria-invalid={!!errors.building} aria-describedby={errorDescription("building")} />{errors.building && <p id="building-error" className="checkout-error">{errors.building}</p>}</div>
              <div className="checkout-field"><label htmlFor="checkout-street">{t.street}</label><input id="checkout-street" name="street" autoComplete="shipping address-line2" value={fields.street} onChange={(event) => update("street", event.target.value)} maxLength={250} /></div>
              <div className="checkout-field"><label htmlFor="checkout-notes">{t.notes}</label><textarea id="checkout-notes" name="notes" value={fields.notes} onChange={(event) => update("notes", event.target.value)} maxLength={500} rows={3} /></div>
              <button className="store-btn" type="submit" disabled={!quote}>{t.reviewButton}</button>
          </form> : <section className="checkout-review" aria-labelledby="review-heading">
            <h2 id="review-heading" tabIndex={-1} ref={reviewRef}>{t.reviewHeading}</h2><p>{t.reviewIntro}</p>
            <dl className="checkout-address"><div><dt>{t.name}</dt><dd>{review.delivery.name}</dd></div><div><dt>{t.email}</dt><dd>{review.delivery.email}</dd></div><div><dt>{t.phone}</dt><dd>{review.delivery.phone}</dd></div><div><dt>{t.district}</dt><dd>{districts.find(([id]) => id === review.delivery.district)?.[languageIndex]}</dd></div><div><dt>{t.building}</dt><dd>{review.delivery.building}</dd></div>{review.delivery.street && <div><dt>{t.street}</dt><dd>{review.delivery.street}</dd></div>}{review.delivery.notes && <div><dt>{t.notes}</dt><dd>{review.delivery.notes}</dd></div>}</dl>
            <button className="store-btn-secondary" type="button" onClick={() => { setReview(null); requestAnimationFrame(() => nameRef.current?.focus()); }}>{t.edit}</button>
            <button className="store-btn" type="button" onClick={pay} disabled={paying || !quote}>{paying ? t.paying : t.confirm}</button><p className="store-muted">{t.confirmationHint}</p>
            {paymentError && <p className="checkout-error" role="alert">{t.paymentError}</p>}
          </section>}
          <aside className="bag-summary" aria-labelledby="checkout-summary-heading">
            <h2 id="checkout-summary-heading">{t.summary}</h2>
            <ul className="checkout-items">{selectedItems.map((item) => { const product = productBySlug(item.slug); return product ? <li key={item.slug}><a href={`/shop/${item.slug}`}>{product.name}</a><span>{t.quantity}: {item.quantity}</span><span>{formatPrice(item.quantity * PRICE_CENTS)}</span></li> : null; })}</ul>
            <p className="checkout-pack">{t.pack}</p>
            {voucher ? <div className="checkout-voucher-applied"><span><b>{voucher}</b> {t.applied}</span><button className="checkout-voucher-remove" type="button" onClick={() => { setVoucher(""); setVoucherInput(""); }}>{t.remove}</button></div>
              : <form className="checkout-voucher" onSubmit={event => { event.preventDefault(); const code = voucherInput.trim().toUpperCase(); if (!code) return; setVoucherNotice(""); setVoucher(code); setQuoteRetry(n => n + 1); }}><label htmlFor="checkout-voucher">{t.voucher}</label><div><input id="checkout-voucher" value={voucherInput} onChange={event => { setVoucherInput(event.target.value); setVoucherNotice(""); }} maxLength={32} autoCapitalize="characters" autoComplete="off" aria-describedby={voucherNotice ? "checkout-voucher-notice" : undefined} /><button className="store-btn-secondary" type="submit">{t.apply}</button></div></form>}
            {voucherNotice && <p className="checkout-voucher-notice" id="checkout-voucher-notice" role="alert">{t.voucherRejected.replace("{code}", voucherNotice)}</p>}
            {quoteError ? <p className="checkout-error" role="alert">{t.quoteError} <button type="button" className="checkout-voucher-remove" onClick={() => setQuoteRetry(n => n + 1)}>{t.retry}</button></p> : !quote ? <p className="checkout-pack" role="status">{t.calculating}</p> : <dl className="checkout-totals"><div><dt>{t.subtotal}</dt><dd>{formatPrice(quote.subtotalCents)}</dd></div>{quote.discountCents > 0 && <div><dt>{t.discount} {quote.voucherCode}</dt><dd>−{formatPrice(quote.discountCents)}</dd></div>}<div><dt>{t.delivery}</dt><dd>{formatDelivery(quote.deliveryCents, locale)}</dd></div><div className="bag-total"><dt>{t.total}</dt><dd>{formatPrice(quote.totalCents)}</dd></div></dl>}
            <p className="checkout-pack">{t.timing}</p><a href="/bag" className="store-btn-secondary checkout-edit-cart">{t.editBag}</a>
          </aside>
        </div>
      </>}
    </main>
  </StoreShell>;
}
