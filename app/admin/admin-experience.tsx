"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatPrice } from "../../lib/shop";
import { RequestError, amount, cents, date, request } from "./admin-api";
import { Icon, MoneyPanel, OnsitePanel, SettingsPanel, VoucherSheet, voucherTerms, voucherValue, type Voucher } from "./finance-panels";
import "./admin.css";

type Tab = "money" | "onsite" | "orders" | "vouchers" | "inbox" | "delivery" | "settings";
const TABS: [Tab, string][] = [["money", "Money"], ["onsite", "Onsite"], ["orders", "Orders"], ["vouchers", "Vouchers"], ["inbox", "Inbox"], ["delivery", "Delivery notes"], ["settings", "Settings"]];
type Stage = "new" | "making" | "packed" | "dispatched";
const STAGES: Stage[] = ["new", "making", "packed", "dispatched"];
const stageName = { new: "To make", making: "Making", packed: "Packed", dispatched: "Dispatched" };
type OrderRow = { id: string; payment_status: string; mode: string; total_cents: number; created_at: number; fulfillment_status: Stage };
type Order = OrderRow & {
  subtotal_cents: number; delivery_cents: number; discount_cents: number; voucher_code: string | null; provider_status: string | null;
  details: { name: string; email: string; phone: string; district: string; building: string; street: string; notes: string; country: string };
  items: { slug: string; name: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
  fulfillment: { status: Stage; courier: string; tracking_number: string; note: string; version: number; shipping_cents: number | null; shipped_email_at: number | null };
  history: { previous_status: Stage | null; status: Stage; courier: string; tracking_number: string; note: string; actor: string; created_at: number }[];
};
type Notes = { checkedAt: string; introduction: string; sections: { title: string; points: string[] }[]; sources: { label: string; url: string }[]; limitations: string };
type Draft = { status: Stage; courier: string; trackingNumber: string; note: string; shippingCost: string };
type InboxRow = { id: string; from_email: string; to_email: string; subject: string; received_at: number; forwarded_at: number | null; forward_error: number };
type InboxEmail = InboxRow & { text_body: string; attachment_names: string[] };
type MailSettings = { forwardingEnabled: boolean; destination: string };
const SHIPPED_EMAIL = { sent: "The customer was emailed their tracking details.", already: "", unavailable: "Email sending is not configured here, so no shipped email was sent.", failed: "The shipped email could not be sent. Use Resend shipped email to try again." };

export default function AdminExperience() {
  const [username, setUsername] = useState<string | null>();
  const [tab, setTab] = useState<Tab>("money");
  const [onsiteDay, setOnsiteDay] = useState<string | null>(null), [sheet, setSheet] = useState<Voucher[] | null>(null), [voucherMode, setVoucherMode] = useState<"set" | "single">("set");
  const [voucherPreview, setVoucherPreview] = useState({ amount: "", minimum: "0" });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]), [selected, setSelected] = useState<Order | null>(null);
  const [payment, setPayment] = useState("all"), [fulfillment, setFulfillment] = useState("all"), [page, setPage] = useState(1), [hasMore, setHasMore] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]), [voucherKind, setVoucherKind] = useState("percent"), [notes, setNotes] = useState<Notes | null>(null);
  const [draft, setDraft] = useState<Draft>({ status: "new", courier: "", trackingNumber: "", note: "", shippingCost: "" });
  const [emails, setEmails] = useState<InboxRow[]>([]), [email, setEmail] = useState<InboxEmail | null>(null);
  const [inboxPage, setInboxPage] = useState(1), [inboxHasMore, setInboxHasMore] = useState(false), [mailSettings, setMailSettings] = useState<MailSettings | null>(null);
  const [revision, setRevision] = useState(0);

  function signedOut() {
    setUsername(null); setOrders([]); setSelected(null); setVouchers([]); setNotes(null);
    setEmails([]); setEmail(null); setMailSettings(null); setSheet(null); setOnsiteDay(null);
  }
  async function perform(work: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await work(); } catch (problem) {
      if (problem instanceof RequestError && problem.status === 401) signedOut();
      setError(problem instanceof Error ? problem.message : "The request could not be completed. Please try again.");
    } finally { setBusy(false); }
  }

  useEffect(() => {
    let active = true;
    request<{ username: string }>("status").then((data) => { if (active) setUsername(data.username); }).catch((problem) => {
      if (!active) return;
      setUsername(null);
      if (!(problem instanceof RequestError && problem.status === 401)) setError(problem instanceof Error ? problem.message : "Could not connect to the admin site.");
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    // Money, Onsite and Settings load their own data.
    if (!username || ["money", "onsite", "settings"].includes(tab)) return;
    let active = true;
    setBusy(true); setError("");
    const loading = tab === "orders" ? request<{ orders: OrderRow[]; hasMore: boolean }>(`orders?payment=${payment}&fulfillment=${fulfillment}&page=${page}`).then((data) => {
      if (active) { setOrders(data.orders); setHasMore(data.hasMore); }
    }) : tab === "vouchers" ? request<{ vouchers: Voucher[] }>("vouchers").then((data) => { if (active) setVouchers(data.vouchers); })
      : tab === "inbox" ? Promise.all([request<{ emails: InboxRow[]; hasMore: boolean }>(`inbox?page=${inboxPage}`), request<MailSettings>("mail-settings")]).then(([data, settings]) => {
        if (active) { setEmails(data.emails); setInboxHasMore(data.hasMore); setMailSettings(settings); }
      }) : request<Notes>("delivery-notes").then((data) => { if (active) setNotes(data); });
    loading.catch((problem) => {
      if (!active) return;
      if (problem instanceof RequestError && problem.status === 401) signedOut();
      setError(problem instanceof Error ? problem.message : "Could not load this section.");
    }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [username, tab, payment, fulfillment, page, inboxPage, revision]);

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget, fields = new FormData(form);
    void perform(async () => {
      const data = await request<{ username: string }>("login", { username: fields.get("username"), password: fields.get("password") });
      form.reset(); setUsername(data.username); setTab("money");
    });
  }
  function openOrder(id: string) {
    void perform(async () => {
      const { order } = await request<{ order: Order }>(`order?id=${encodeURIComponent(id)}`);
      setSelected(order); setDraft({ status: order.fulfillment.status, courier: order.fulfillment.courier, trackingNumber: order.fulfillment.tracking_number, note: order.fulfillment.note, shippingCost: amount(order.fulfillment.shipping_cents) });
    });
  }
  async function reloadOrder(id: string) {
    const { order } = await request<{ order: Order }>(`order?id=${encodeURIComponent(id)}`);
    setSelected(order); setRevision((value) => value + 1);
  }
  function saveFulfillment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    void perform(async () => {
      const saved = await request<{ shippedEmail: keyof typeof SHIPPED_EMAIL | null }>("fulfillment", { id: selected.id, version: selected.fulfillment.version, ...draft });
      await reloadOrder(selected.id);
      setMessage(`Fulfillment saved.${saved.shippedEmail ? ` ${SHIPPED_EMAIL[saved.shippedEmail]}` : ""}`);
    });
  }
  function createVoucher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget, fields = new FormData(form);
    void perform(async () => {
      const expiry = String(fields.get("expiry") ?? ""), maximum = String(fields.get("maximum") ?? "");
      const terms = { kind: voucherKind, amount: fields.get("amount"), minSubtotal: fields.get("minimum"), maxUses: maximum ? Number(maximum) : null, expiresAt: expiry ? new Date(expiry).getTime() : null };
      if (voucherMode === "single") {
        await request("voucher-create", { ...terms, code: fields.get("code") });
        setMessage("Voucher created.");
      } else {
        const created = await request<{ batch: string; codes: string[] }>("voucher-set-create", { ...terms, count: Number(fields.get("count")), prefix: fields.get("prefix") });
        setSheet((await request<{ vouchers: Voucher[] }>(`vouchers?batch=${created.batch}`)).vouchers);
        setMessage(`${created.codes.length} codes created. Print the cards below.`);
      }
      form.reset(); setVoucherPreview({ amount: "", minimum: "0" }); setRevision((value) => value + 1);
    });
  }
  function printSet(voucher: Voucher) {
    void perform(async () => setSheet(voucher.batch ? (await request<{ vouchers: Voucher[] }>(`vouchers?batch=${voucher.batch}`)).vouchers.filter((row) => row.active) : [voucher]));
  }
  // One gift box at checkout, after the voucher; mirrors the server's floor rounding for percentages.
  const previewDiscount = voucherKind === "percent" ? (/^\d{1,3}$/.test(voucherPreview.amount) ? Math.floor(25800 * Number(voucherPreview.amount) / 100) : null) : cents(voucherPreview.amount);
  const previewMinimum = cents(voucherPreview.minimum) ?? 0;
  const openTab = (item: Tab) => { setTab(item); setSelected(null); setEmail(null); setMessage(""); setSheet(null); if (item !== "onsite") setOnsiteDay(null); };

  return <div className="admin-shell">
    <a className="admin-skip" href="#admin-content">Skip to content</a>
    <header className="admin-header">
      <a className="admin-brand" href="/admin">YAT.lifestyle <span>Admin</span></a>
      {username && <><nav aria-label="Admin sections">{TABS.map(([item, label]) => <button type="button" key={item} aria-current={tab === item ? "page" : undefined} disabled={busy} onClick={() => openTab(item)}>{label}</button>)}</nav>
        <button type="button" className="admin-quiet" disabled={busy} onClick={() => void perform(async () => { await request("logout", {}); signedOut(); })}>Sign out</button></>}
    </header>
    <main id="admin-content" className={username ? "admin-main" : "admin-main admin-signin"} aria-busy={busy}>
      <p className="admin-error" role="alert">{error}</p><p className="admin-message" role="status" aria-live="polite">{message}</p>
      {username === undefined ? <p role="status">Checking your sign-in…</p> : !username ? <>
        <h1>Welcome back.</h1><p>Sign in to manage your orders and vouchers.</p>
        <form onSubmit={signIn} className="admin-form">
          <label>Username<input name="username" autoComplete="username" defaultValue="natasha" required maxLength={64} /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>
          <button className="admin-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </> : tab === "money" ? <MoneyPanel busy={busy} perform={(work) => void perform(work)} notify={setMessage} onOpenOrders={() => { openTab("orders"); setFulfillment("dispatched"); setPage(1); }} onOpenDay={(id) => { openTab("onsite"); setOnsiteDay(id); }} onOpenSettings={() => openTab("settings")} />
      : tab === "onsite" ? <OnsitePanel busy={busy} perform={(work) => void perform(work)} notify={setMessage} dayId={onsiteDay} onDayChange={setOnsiteDay} />
      : tab === "settings" ? <SettingsPanel busy={busy} perform={(work) => void perform(work)} notify={setMessage} />
      : tab === "orders" ? <>
        <div className="admin-section-heading"><div><h1>Orders</h1><p>Review payment, prepare each fragrance, and track dispatch.</p></div><button type="button" className="admin-quiet" disabled={busy} onClick={() => setRevision((value) => value + 1)}>Refresh</button></div>
        <div className="admin-filters">
          <label>Payment<select value={payment} disabled={busy} onChange={(event) => { setPayment(event.target.value); setPage(1); }}><option value="all">All payment states</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select></label>
          <label>Fulfillment<select value={fulfillment} disabled={busy} onChange={(event) => { setFulfillment(event.target.value); setPage(1); }}><option value="all">All fulfillment stages</option>{STAGES.map((stage) => <option key={stage} value={stage}>{stageName[stage]}</option>)}</select></label>
        </div>
        <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Order list">
          <table className="admin-table"><thead><tr><th scope="col">Order</th><th scope="col">Placed (Hong Kong)</th><th scope="col">Payment</th><th scope="col">Fulfillment</th><th scope="col">Total</th><th scope="col"><span className="visually-hidden">Review</span></th></tr></thead>
            <tbody>{orders.map((order) => <tr key={order.id}><td><span>{order.id.slice(0, 8)}</span>{order.mode !== "prod" && <small>Sandbox</small>}</td><td>{date(order.created_at)}</td><td className="admin-capitalize">{order.payment_status}</td><td>{stageName[order.fulfillment_status]}</td><td className="admin-money">{formatPrice(order.total_cents)}</td><td><button type="button" className="admin-quiet" disabled={busy} aria-label={`Review order ${order.id.slice(0, 8)}`} onClick={() => openOrder(order.id)}>Review</button></td></tr>)}</tbody>
          </table>
          {!orders.length && <p className="admin-empty">{busy ? "Loading orders…" : "No orders match these filters."}</p>}
        </div>
        <div className="admin-pagination"><button type="button" className="admin-quiet" disabled={busy || page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page}</span><button type="button" className="admin-quiet" disabled={busy || !hasMore} onClick={() => setPage(page + 1)}>Next</button></div>
        {selected && <section className="admin-order-detail" aria-labelledby="order-heading">
          <div className="admin-section-heading"><div><h2 id="order-heading">Order {selected.id.slice(0, 8)}</h2><p className="admin-reference">{selected.id}</p></div><button type="button" className="admin-quiet" disabled={busy} onClick={() => setSelected(null)}>Close order</button></div>
          {selected.mode !== "prod" && <p className="admin-notice">Sandbox order. This is a payment test and cannot enter fulfillment.</p>}
          {selected.payment_status !== "paid" && <p className="admin-notice">Payment is {selected.payment_status}. Fulfillment becomes available after a live payment is confirmed.</p>}
          {selected.payment_status !== "paid" && selected.payment_status !== "cancelled" && <button type="button" className="admin-quiet admin-cancel-order" disabled={busy} onClick={() => {
            if (!window.confirm("Cancel this unpaid order? After provider confirmation, its payment closes and its voucher reservation is released. Any uncaptured authorization may be released.")) return;
            void perform(async () => {
              try { await request("order-cancel", { id: selected.id }); setMessage("Order cancellation confirmed."); }
              finally { setSelected((await request<{ order: Order }>(`order?id=${encodeURIComponent(selected.id)}`)).order); setRevision((value) => value + 1); }
            });
          }}>Cancel unpaid order</button>}
          <div className="admin-order-columns"><div>
            <h3>Customer & delivery</h3><address><strong>{selected.details.name}</strong><a href={`mailto:${selected.details.email}`}>{selected.details.email}</a><span>{selected.details.phone}</span><span>{selected.details.building}</span><span>{selected.details.street}</span><span>{selected.details.district}, Hong Kong</span></address>
            {selected.details.notes && <p className="admin-note">Customer note: {selected.details.notes}</p>}
            <h3>Fragrances</h3><ul className="admin-items">{selected.items.map((item) => <li key={item.slug}><span>{item.name} <small>× {item.quantity}</small></span><span>{formatPrice(item.lineTotalCents)}</span></li>)}</ul>
            <dl className="admin-totals"><div><dt>Items subtotal</dt><dd>{formatPrice(selected.subtotal_cents)}</dd></div><div><dt>Delivery</dt><dd>{formatPrice(selected.delivery_cents)}</dd></div><div><dt>Discount{selected.voucher_code ? ` (${selected.voucher_code})` : ""}</dt><dd>{formatPrice(selected.discount_cents)}</dd></div><div><dt>Total</dt><dd>{formatPrice(selected.total_cents)}</dd></div></dl>
          </div><div>
            <h3>Fulfillment</h3><form className="admin-form" onSubmit={saveFulfillment}>
              <fieldset disabled={busy || selected.payment_status !== "paid" || selected.mode !== "prod"}>
                <label>Stage<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Stage })}>{STAGES.map((stage, index) => <option key={stage} value={stage} disabled={index < STAGES.indexOf(selected.fulfillment.status) || index > STAGES.indexOf(selected.fulfillment.status) + 1}>{stageName[stage]}</option>)}</select></label>
                <label>Courier<input value={draft.courier} maxLength={80} required={draft.status === "dispatched"} onChange={(event) => setDraft({ ...draft, courier: event.target.value })} /></label>
                <label>Tracking number<input value={draft.trackingNumber} maxLength={120} required={draft.status === "dispatched"} onChange={(event) => setDraft({ ...draft, trackingNumber: event.target.value })} /></label>
                <label>Shipping cost you paid (HK$) <span>Required to dispatch; counts against this order on Money</span><input className="admin-figure" value={draft.shippingCost} inputMode="decimal" pattern="\d{1,6}(\.\d{1,2})?" required={draft.status === "dispatched"} onChange={(event) => setDraft({ ...draft, shippingCost: event.target.value })} /></label>
                <label>Private fulfillment note<textarea value={draft.note} rows={4} maxLength={2000} onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></label>
                {draft.status === "dispatched" && !selected.fulfillment.shipped_email_at && <p className="admin-muted">Saving as Dispatched emails the customer their courier and tracking number from orders@yatlifestyle.com.</p>}
                <button className="admin-primary">Save fulfillment</button>
              </fieldset>
            </form>
            {selected.fulfillment.status === "dispatched" && <p className="admin-shipped-email">{selected.fulfillment.shipped_email_at !== null ? <><Icon name="check" size={16} />Shipped email sent {date(selected.fulfillment.shipped_email_at)}</> : "The shipped email has not been sent."}{" "}
              <button type="button" className="admin-link" disabled={busy} onClick={() => void perform(async () => { await request("shipped-email", { id: selected.id }); await reloadOrder(selected.id); setMessage("Shipped email sent to the customer."); })}>{selected.fulfillment.shipped_email_at ? "Resend" : "Send now"}</button></p>}
          </div></div>
          <details className="admin-history"><summary>Status history{selected.history.length >= 100 ? " · latest 100 updates" : ""}</summary>{!selected.history.length ? <p>No fulfillment updates yet.</p> : <ol>{selected.history.map((entry, index) => <li key={`${entry.created_at}-${index}`}><div><strong>{stageName[entry.previous_status ?? "new"]} → {stageName[entry.status]}</strong><span>{date(entry.created_at)} · {entry.actor}</span></div>{entry.courier && <p>{entry.courier}{entry.tracking_number ? ` · ${entry.tracking_number}` : ""}</p>}{entry.note && <p className="admin-note">{entry.note}</p>}</li>)}</ol>}</details>
        </section>}
      </> : tab === "vouchers" ? <>
        <div className="admin-section-heading"><div><h1>Vouchers</h1><p>Codes customers type at checkout. The discount comes off the items subtotal; delivery is free.</p></div></div>
        <form className="admin-panel admin-voucher-form admin-form" onSubmit={createVoucher}>
          <div className="admin-segmented admin-voucher-mode" role="group" aria-label="What to create">
            <button type="button" aria-pressed={voucherMode === "set"} onClick={() => setVoucherMode("set")}>Printable set</button>
            <button type="button" aria-pressed={voucherMode === "single"} onClick={() => setVoucherMode("single")}>One code</button>
          </div>
          {voucherMode === "set" ? <>
            <label>How many cards<input name="count" type="number" inputMode="numeric" required min={1} max={200} step={1} defaultValue={8} /></label>
            <label>Code prefix <span>(optional, e.g. PMQ)</span><input name="prefix" maxLength={12} pattern="[A-Za-z0-9]{0,12}" autoCapitalize="characters" autoComplete="off" /></label>
          </> : <label>Voucher code<input name="code" required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" autoCapitalize="characters" autoComplete="off" /></label>}
          <label>Discount type<select value={voucherKind} disabled={busy} onChange={(event) => setVoucherKind(event.target.value)}><option value="percent">Percentage off</option><option value="fixed">HK$ off</option></select></label>
          <label>{voucherKind === "percent" ? "Discount (%)" : "Discount (HK$)"}<input name="amount" type="number" inputMode="decimal" required min={voucherKind === "percent" ? 1 : .01} max={voucherKind === "percent" ? 100 : 10000} step={voucherKind === "percent" ? 1 : .01} onChange={(event) => setVoucherPreview({ ...voucherPreview, amount: event.target.value })} /></label>
          <label>Minimum items subtotal (HK$)<input name="minimum" type="number" inputMode="decimal" required min={0} max={10000} step="0.01" defaultValue="0" onChange={(event) => setVoucherPreview({ ...voucherPreview, minimum: event.target.value })} /></label>
          <label>{voucherMode === "set" ? "Uses per code" : "Maximum uses"} <span>(blank for unlimited)</span><input name="maximum" type="number" inputMode="numeric" min={1} max={1000000} step={1} defaultValue={voucherMode === "set" ? 1 : undefined} key={voucherMode} /></label>
          <label>Expires at <span>(your local time; optional)</span><input name="expiry" type="datetime-local" /></label>
          <p className="admin-voucher-preview" aria-live="polite">{previewDiscount === null || previewDiscount < 1 ? "Enter a discount to see what a customer pays." : <>One gift box at checkout: <s className="admin-figure">{formatPrice(25800)}</s> <b className="admin-figure">{formatPrice(Math.max(0, 25800 - Math.min(25800, previewDiscount)))}</b>{previewMinimum > 25800 ? ` · needs ${formatPrice(previewMinimum)} of items first` : ""}</>}</p>
          <button className="admin-primary" disabled={busy}>{voucherMode === "set" ? "Create and print cards" : "Create voucher"}</button>
        </form>
        {sheet && <VoucherSheet vouchers={sheet} onClose={() => setSheet(null)} />}
        <p className="admin-muted">Latest 200 vouchers. Reserved uses include orders with an open payment; they stay reserved until payment or confirmed cancellation.</p>
        <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Voucher list"><table className="admin-table"><thead><tr><th scope="col">Code</th><th scope="col">Discount</th><th scope="col">Terms</th><th scope="col">Uses</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{vouchers.map((voucher) => <tr key={voucher.code}><td><span className="admin-code">{voucher.code}</span>{voucher.batch && <small>Printed set</small>}</td><td className="admin-figure">{voucherValue(voucher)}</td><td>{voucherTerms(voucher) || "No limits"}</td><td className="admin-figure">{voucher.redeemed} paid · {voucher.reserved} reserved{voucher.max_uses ? ` / ${voucher.max_uses}` : ""}</td><td>{!voucher.active ? "Inactive" : voucher.expires_at && voucher.expires_at <= Date.now() ? "Expired" : "Active"}</td><td><span className="admin-row-actions">{!!voucher.active && <button type="button" className="admin-quiet" disabled={busy} aria-label={voucher.batch ? `Print the set with ${voucher.code}` : `Print ${voucher.code}`} onClick={() => printSet(voucher)}>{voucher.batch ? "Print set" : "Print"}</button>}{!!voucher.active && <button type="button" className="admin-quiet" disabled={busy} aria-label={`Deactivate ${voucher.code}`} onClick={() => void perform(async () => { await request("voucher-deactivate", { code: voucher.code }); setRevision((value) => value + 1); setMessage(`${voucher.code} deactivated for future orders.`); })}>Deactivate</button>}</span></td></tr>)}</tbody></table>{!vouchers.length && <p className="admin-empty">{busy ? "Loading vouchers…" : "No vouchers yet. Create your first code above."}</p>}</div>
      </> : tab === "inbox" ? <>
        <div className="admin-section-heading"><div><h1>Inbox</h1><p>Stored incoming mail for your shop addresses.</p></div><button type="button" className="admin-quiet" disabled={busy} onClick={() => setRevision((value) => value + 1)}>Refresh</button></div>
        {mailSettings && <div className="admin-mail-settings"><label className="admin-toggle"><input type="checkbox" checked={mailSettings.forwardingEnabled} disabled={busy} onChange={(event) => {
          const forwardingEnabled = event.target.checked;
          void perform(async () => { setMailSettings(await request<MailSettings>("mail-settings", { forwardingEnabled })); setMessage(`Forwarding ${forwardingEnabled ? "enabled" : "disabled"} for future incoming emails.`); });
        }} /><span>Forward incoming emails to {mailSettings.destination}</span></label><p>Forwarding requires a verified destination; the inbox and archive still receive messages. Download the original email to keep its full content and attachments.</p></div>}
        <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Inbox"><table className="admin-table"><thead><tr><th scope="col">From</th><th scope="col">Subject</th><th scope="col">Received (Hong Kong)</th><th scope="col">Forwarding</th><th scope="col"><span className="visually-hidden">Open email</span></th></tr></thead><tbody>{emails.map((item) => <tr key={item.id}><td>{item.from_email}</td><td className="admin-email-subject" title={item.subject}>{item.subject || "(No subject)"}</td><td>{date(item.received_at)}</td><td>{item.forwarded_at ? "Forwarded" : item.forward_error ? "Forwarding failed" : "Stored"}</td><td><button type="button" className="admin-quiet" disabled={busy} aria-label={`Open email ${item.subject || "without a subject"}`} onClick={() => void perform(async () => { setEmail((await request<{ email: InboxEmail }>(`inbox?id=${encodeURIComponent(item.id)}`)).email); })}>Open</button></td></tr>)}</tbody></table>{!emails.length && <p className="admin-empty">{busy ? "Loading inbox…" : "No incoming emails yet."}</p>}</div>
        <div className="admin-pagination"><button type="button" className="admin-quiet" disabled={busy || inboxPage === 1} onClick={() => setInboxPage(inboxPage - 1)}>Previous</button><span>Page {inboxPage}</span><button type="button" className="admin-quiet" disabled={busy || !inboxHasMore} onClick={() => setInboxPage(inboxPage + 1)}>Next</button></div>
        {email && <section className="admin-order-detail admin-email-detail" aria-labelledby="email-heading"><div className="admin-section-heading"><div><h2 id="email-heading">{email.subject || "(No subject)"}</h2><p>From {email.from_email}<br />To {email.to_email}<br />{date(email.received_at)}</p></div><button type="button" className="admin-quiet" disabled={busy} onClick={() => setEmail(null)}>Close email</button></div><a className="admin-primary admin-email-download" href={`/api/admin/inbox-raw?id=${encodeURIComponent(email.id)}`} download>Download original email (.eml)</a><pre className="admin-email-body">{email.text_body || "No plain-text body was supplied."}</pre>{email.attachment_names.length > 0 && <><h3>Attachments</h3><ul>{email.attachment_names.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul><p className="admin-muted">The original email download includes its attachments.</p></>}</section>}
      </> : <>
        <div className="admin-section-heading"><div><h1>Delivery notes</h1>{notes && <p>Research checked {notes.checkedAt}.</p>}</div></div>
        {!notes ? <p role="status">Loading delivery notes…</p> : <div className="admin-delivery-notes"><p className="admin-notice">{notes.introduction}</p>{notes.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul></section>)}<section><h2>Official references</h2><ul>{notes.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul><p className="admin-muted">{notes.limitations}</p></section></div>}
      </>}
    </main>
    <footer className="admin-footer">YAT.lifestyle · Private operations</footer>
  </div>;
}
