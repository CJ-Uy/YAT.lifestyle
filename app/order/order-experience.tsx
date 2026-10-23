"use client";

import { useEffect, useState } from "react";
import { formatDelivery, formatPrice } from "../../lib/shop";
import { payWithAirwallex, type Payment } from "../checkout/airwallex-client";
import { useLocale } from "../site-header";
import { StoreShell } from "../storefront";

type Order = {
  id: string; status: "unpaid" | "paid" | "cancelled" | "failed"; mode: "prod" | "sandbox";
  items: { slug: string; name: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
  subtotalCents: number; deliveryCents: number; discountCents: number; totalCents: number; voucherCode: string | null;
};
const copy = {
  en: {
    title: "Your order", paid: "Payment confirmed.", testPaid: "Test payment confirmed.", pending: "Payment awaiting confirmation.", cancelled: "Payment was not completed.", failed: "Payment was not successful.",
    received: "Thank you. Your order is confirmed, and a confirmation email will be sent to your verified address.", pendingBody: "Check the payment status before trying again. A return from the payment page does not confirm payment.",
    sandbox: "Airwallex test mode · No real payment or delivery will take place.", reference: "Order reference", loading: "Checking your order…", missing: "No order is available in this browser.", missingBody: "Open the order link in the browser where you checked out, or contact us with your order reference.",
    summary: "Order summary", quantity: "Quantity", subtotal: "Items subtotal", delivery: "Hong Kong delivery", discount: "Voucher", total: "Total", pack: "10 mL perfume · blue gift box · artificial flowers",
    timing: "Estimated to arrive within 2 weeks.", check: "Check payment status", checking: "Checking…", resume: "Continue to payment", paying: "Opening payment…",
    error: "We could not check your order. Please try again.", paymentError: "Payment could not be opened. Check the status before trying again.", shop: "Return to fragrances", bag: "View cart", help: "Questions about this order?",
  },
  "zh-Hant": {
    title: "你的訂單", paid: "付款已確認。", testPaid: "測試付款已確認。", pending: "正在等候付款確認。", cancelled: "付款尚未完成。", failed: "付款未能成功。",
    received: "謝謝你，訂單已確認。我們會把確認電郵寄到已驗證的地址。", pendingBody: "再次付款前，請先查看付款狀態。從付款頁面返回並不代表付款已確認。",
    sandbox: "Airwallex 測試模式 · 不會收取真實款項或安排送貨。", reference: "訂單編號", loading: "正在檢查訂單…", missing: "此瀏覽器沒有可顯示的訂單。", missingBody: "請在結帳時使用的瀏覽器開啟訂單連結，或提供訂單編號聯絡我們。",
    summary: "訂單明細", quantity: "數量", subtotal: "商品小計", delivery: "香港送貨", discount: "優惠碼", total: "總額", pack: "10 mL 香水 · 藍色禮盒 · 人造花",
    timing: "預計兩星期內送達。", check: "查看付款狀態", checking: "正在檢查…", resume: "繼續付款", paying: "正在開啟付款…",
    error: "未能檢查訂單，請再試一次。", paymentError: "未能開啟付款。再次嘗試前，請先查看付款狀態。", shop: "返回香水選購", bag: "查看購物車", help: "對訂單有疑問？",
  },
  "zh-Hans": {
    title: "你的订单", paid: "付款已确认。", testPaid: "测试付款已确认。", pending: "正在等候付款确认。", cancelled: "付款尚未完成。", failed: "付款未能成功。",
    received: "谢谢你，订单已确认。我们会把确认邮件发送到已验证的地址。", pendingBody: "再次付款前，请先查看付款状态。从付款页面返回并不代表付款已确认。",
    sandbox: "Airwallex 测试模式 · 不会收取真实款项或安排配送。", reference: "订单编号", loading: "正在检查订单…", missing: "此浏览器没有可显示的订单。", missingBody: "请在结账时使用的浏览器打开订单链接，或提供订单编号联系我们。",
    summary: "订单明细", quantity: "数量", subtotal: "商品小计", delivery: "香港配送", discount: "优惠码", total: "总额", pack: "10 mL 香水 · 蓝色礼盒 · 人造花",
    timing: "预计两星期内送达。", check: "查看付款状态", checking: "正在检查…", resume: "继续付款", paying: "正在打开付款…",
    error: "未能检查订单，请再试一次。", paymentError: "未能打开付款。再次尝试前，请先查看付款状态。", shop: "返回香水选购", bag: "查看购物车", help: "对订单有疑问？",
  },
};

export default function OrderExperience() {
  const [locale, setLocale] = useLocale(), t = copy[locale];
  const [order, setOrder] = useState<Order | null>(null), [id, setId] = useState("");
  const [loading, setLoading] = useState(true), [paying, setPaying] = useState(false), [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<"order" | "payment" | null>(null);

  async function check(orderId: string, signal?: AbortSignal) {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/commerce/order?id=${encodeURIComponent(orderId)}`, { credentials: "same-origin", signal });
      if (!response.ok) { if (![401, 403, 404].includes(response.status)) setError("order"); return; }
      const result = await response.json() as Order;
      if (result.id !== orderId || !["paid", "unpaid", "failed", "cancelled"].includes(result.status)) throw new Error("invalid_order");
      setOrder(result);
    } catch { if (!signal?.aborted) setError("order"); }
    finally { if (!signal?.aborted) setLoading(false); }
  }
  useEffect(() => {
    const query = new URLSearchParams(window.location.search), orderId = query.get("id") ?? "";
    setId(orderId); setCancelled(query.get("cancelled") === "1");
    const controller = new AbortController();
    if (/^[a-f0-9-]{36}$/.test(orderId)) void check(orderId, controller.signal); else setLoading(false);
    return () => controller.abort();
  }, []);

  async function resume() {
    if (!order || paying || loading) return;
    setPaying(true); setError(null);
    try {
      const response = await fetch("/api/commerce/resume", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: order.id }) });
      const result = await response.json() as Payment & { error?: string };
      if (!response.ok) { if (result.error === "already_paid") { await check(order.id); return; } throw new Error("payment_unavailable"); }
      await payWithAirwallex(result, locale);
    } catch { setError("payment"); }
    finally { setPaying(false); }
  }

  const title = order?.status === "paid" ? order.mode === "sandbox" ? t.testPaid : t.paid : order?.status === "failed" ? t.failed : order?.status === "cancelled" || cancelled ? t.cancelled : t.pending;
  return <StoreShell locale={locale} onLocaleChange={setLocale}>
    <main className="store-page order-preview" id="store-content">
      <header className="store-heading"><h1>{order ? title : loading ? t.title : t.missing}</h1>{order ? <p>{order.status === "paid" && order.mode === "prod" ? t.received : t.pendingBody}</p> : !loading && <p>{t.missingBody}</p>}</header>
      {loading && <p role="status">{t.loading}</p>}
      {error && <p className="checkout-error" role="alert">{error === "order" ? t.error : t.paymentError}</p>}
      {order && <>
        {order.mode === "sandbox" && <p className="store-preview-note">{t.sandbox}</p>}
        <p className="store-muted">{t.reference}: <span style={{ overflowWrap: "anywhere" }}>{order.id}</span></p>
        <section className="bag-summary" aria-labelledby="order-summary-heading">
          <h2 id="order-summary-heading">{t.summary}</h2>
          <ul className="checkout-items">{order.items.map((item) => <li key={item.slug}><a href={`/shop/${item.slug}`}>{item.name}</a><span>{t.quantity}: {item.quantity}</span><span>{formatPrice(item.lineTotalCents)}</span></li>)}</ul>
          <p className="store-muted">{t.pack}</p><dl><div><dt>{t.subtotal}</dt><dd>{formatPrice(order.subtotalCents)}</dd></div><div><dt>{t.delivery}</dt><dd>{formatDelivery(order.deliveryCents, locale)}</dd></div>
            {order.discountCents > 0 && <div><dt>{t.discount}{order.voucherCode ? ` · ${order.voucherCode}` : ""}</dt><dd>−{formatPrice(order.discountCents)}</dd></div>}
            <div className="bag-total"><dt>{t.total}</dt><dd>{formatPrice(order.totalCents)}</dd></div></dl>
          {order.status === "paid" && order.mode === "prod" && <p className="store-muted">{t.timing}</p>}
        </section>
      </>}
      <div className="order-actions">
        {id && <button className="store-btn-secondary" type="button" disabled={loading || paying} onClick={() => void check(id)}>{loading ? t.checking : t.check}</button>}
        {order && (order.status === "unpaid" || order.status === "failed") && <button className="store-btn" type="button" disabled={loading || paying} onClick={() => void resume()}>{paying ? t.paying : t.resume}</button>}
        <a className="store-btn-secondary" href="/shop">{t.shop}</a><a className="store-btn-secondary" href="/bag">{t.bag}</a>
      </div>
      <p className="store-muted">{t.help} <a className="store-text-link" href="mailto:orders@yatlifestyle.com">orders@yatlifestyle.com</a></p>
    </main>
  </StoreShell>;
}
