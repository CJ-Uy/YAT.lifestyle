"use client";

import { useEffect, useState, type FormEvent } from "react";
import { HK_DISTRICTS, formatPrice } from "../../lib/shop";
import { RequestError, amount, cents, date, request } from "./admin-api";
import { Icon, MoneyPanel, OnsitePanel, SettingsPanel, VoucherSheet, voucherTerms, voucherValue, type IconName, type Voucher } from "./finance-panels";
import "./admin.css";

type Tab = "money" | "onsite" | "orders" | "vouchers" | "inbox" | "delivery" | "settings";
const TABS: [Tab, string, IconName][] = [["money", "Money", "chart"], ["onsite", "Onsite", "store"], ["orders", "Orders", "box"], ["vouchers", "Vouchers", "ticket"], ["inbox", "Inbox", "mail"], ["delivery", "Delivery notes", "truck"], ["settings", "Settings", "sliders"]];
// The phone tab bar keeps the four daily sections in reach; the rest sit behind More.
const PRIMARY: Tab[] = ["money", "onsite", "orders", "vouchers"];
type Stage = "new" | "making" | "packed" | "dispatched";
const STAGES: Stage[] = ["new", "making", "packed", "dispatched"];
const stageName = { new: "To make", making: "Making", packed: "Packed", dispatched: "Dispatched" };
const paymentName: Record<string, string> = { paid: "Paid", unpaid: "Awaiting payment", failed: "Failed", cancelled: "Cancelled" };
type OrderRow = { id: string; payment_status: string; mode: string; total_cents: number; created_at: number; fulfillment_status: Stage; seen_at: number | null };
type Order = OrderRow & {
  subtotal_cents: number; delivery_cents: number; discount_cents: number; voucher_code: string | null; provider_status: string | null;
  details: { name: string; email: string; phone: string; district: string; building: string; street: string; notes: string; country: string };
  details_edited_at: number | null; details_edited_by: string | null;
  items: { slug: string; name: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
  fulfillment: { status: Stage; courier: string; tracking_number: string; note: string; version: number; shipping_cents: number | null; shipped_email_at: number | null };
  history: { previous_status: Stage | null; status: Stage; courier: string; tracking_number: string; note: string; actor: string; created_at: number }[];
};
type Notes = { checkedAt: string; introduction: string; sections: { title: string; points: string[] }[]; sources: { label: string; url: string }[]; limitations: string };
type Draft = { status: Stage; courier: string; trackingNumber: string; note: string; shippingCost: string };
type DetailsDraft = { name: string; phone: string; district: string; building: string; street: string; notes: string };
const districtName = (id: string) => HK_DISTRICTS.find(([key]) => key === id)?.[1] ?? id;
type InboxRow = { id: string; from_email: string; to_email: string; subject: string; received_at: number; forwarded_at: number | null; forward_error: number };
type InboxEmail = InboxRow & { text_body: string; attachment_names: string[] };
type MailSettings = { forwardingEnabled: boolean; destination: string };
const SHIPPED_EMAIL = { sent: "The customer was emailed their tracking details.", already: "", unavailable: "Email sending is not configured here, so no shipped email was sent.", failed: "The shipped email could not be sent. Use Resend shipped email to try again." };
const isNew = (order: Pick<OrderRow, "payment_status" | "mode" | "seen_at">) => order.payment_status === "paid" && order.mode === "prod" && !order.seen_at;

function PaymentPill({ status, mode }: { status: string; mode: string }) {
  return <span className="admin-pills">
    <span className={`admin-pill is-${status === "paid" ? "ok" : status === "unpaid" ? "warn" : status === "failed" ? "bad" : "neutral"}`}>{paymentName[status] ?? status}</span>
    {mode !== "prod" && <span className="admin-pill is-violet">Test payment</span>}
  </span>;
}
const StagePill = ({ stage }: { stage: Stage }) => <span className={`admin-pill is-stage-${stage}`}>{stageName[stage]}</span>;
const SkeletonRows = ({ columns, rows = 4 }: { columns: number; rows?: number }) => <>{Array.from({ length: rows }, (_, row) => <tr key={row} className="admin-skeleton-row" aria-hidden="true">{Array.from({ length: columns }, (_, column) => <td key={column}><span className="admin-skeleton" /></td>)}</tr>)}</>;

export default function AdminExperience() {
  const [username, setUsername] = useState<string | null>(), [owner, setOwner] = useState(false), [unseen, setUnseen] = useState(0);
  const [tab, setTab] = useState<Tab>("money"), [moreOpen, setMoreOpen] = useState(false);
  const [onsiteDay, setOnsiteDay] = useState<string | null>(null), [sheet, setSheet] = useState<Voucher[] | null>(null), [voucherMode, setVoucherMode] = useState<"set" | "single">("set");
  const [voucherPreview, setVoucherPreview] = useState({ amount: "", minimum: "0" });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [orders, setOrders] = useState<OrderRow[] | null>(null), [selected, setSelected] = useState<Order | null>(null);
  const [payment, setPayment] = useState("all"), [fulfillment, setFulfillment] = useState("all"), [onlyNew, setOnlyNew] = useState(false), [page, setPage] = useState(1), [hasMore, setHasMore] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[] | null>(null), [voucherKind, setVoucherKind] = useState("percent"), [notes, setNotes] = useState<Notes | null>(null);
  const [draft, setDraft] = useState<Draft>({ status: "new", courier: "", trackingNumber: "", note: "", shippingCost: "" });
  const [detailsDraft, setDetailsDraft] = useState<DetailsDraft | null>(null);
  const [emails, setEmails] = useState<InboxRow[] | null>(null), [email, setEmail] = useState<InboxEmail | null>(null);
  const [inboxPage, setInboxPage] = useState(1), [inboxHasMore, setInboxHasMore] = useState(false), [mailSettings, setMailSettings] = useState<MailSettings | null>(null);
  const [revision, setRevision] = useState(0);

  function signedOut() {
    setUsername(null); setOrders(null); setSelected(null); setVouchers(null); setNotes(null);
    setEmails(null); setEmail(null); setMailSettings(null); setSheet(null); setOnsiteDay(null); setUnseen(0);
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
    request<{ username: string; owner: boolean; unseen: number }>("status").then((data) => { if (active) { setUsername(data.username); setOwner(data.owner); setUnseen(data.unseen); } }).catch((problem) => {
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
    const loading = tab === "orders" ? request<{ orders: OrderRow[]; hasMore: boolean; unseen: number }>(`orders?payment=${payment}&fulfillment=${fulfillment}&seen=${onlyNew ? "unseen" : "all"}&page=${page}`).then((data) => {
      if (active) { setOrders(data.orders); setHasMore(data.hasMore); setUnseen(data.unseen); }
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
  }, [username, tab, payment, fulfillment, onlyNew, page, inboxPage, revision]);

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget, fields = new FormData(form);
    void perform(async () => {
      await request("login", { username: fields.get("username"), password: fields.get("password") });
      const status = await request<{ username: string; owner: boolean; unseen: number }>("status");
      form.reset(); setUsername(status.username); setOwner(status.owner); setUnseen(status.unseen); setTab("money");
    });
  }
  async function loadOrder(id: string) {
    const { order } = await request<{ order: Order }>(`order?id=${encodeURIComponent(id)}`);
    setSelected(order);
    // Opening an order as the owner marks it seen on the server; mirror that in the list without a reload.
    if (owner && order.seen_at) { setOrders((rows) => rows?.map((row) => row.id === id ? { ...row, seen_at: order.seen_at } : row) ?? rows); setUnseen((count) => orders?.find((row) => row.id === id && isNew(row)) ? Math.max(0, count - 1) : count); }
    return order;
  }
  function openOrder(id: string) {
    void perform(async () => {
      const order = await loadOrder(id);
      setDetailsDraft(null);
      setDraft({ status: order.fulfillment.status, courier: order.fulfillment.courier, trackingNumber: order.fulfillment.tracking_number, note: order.fulfillment.note, shippingCost: amount(order.fulfillment.shipping_cents) });
      requestAnimationFrame(() => document.getElementById("order-heading")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    });
  }
  async function reloadOrder(id: string) { await loadOrder(id); setRevision((value) => value + 1); }
  function saveFulfillment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    const from = STAGES.indexOf(selected.fulfillment.status), to = STAGES.indexOf(draft.status);
    if (to < from && !window.confirm(`Move this order back from ${stageName[selected.fulfillment.status]} to ${stageName[draft.status]}? The change is kept in its history.`)) return;
    void perform(async () => {
      const saved = await request<{ shippedEmail: keyof typeof SHIPPED_EMAIL | null }>("fulfillment", { id: selected.id, version: selected.fulfillment.version, ...draft });
      await reloadOrder(selected.id);
      setMessage(`Fulfillment saved.${saved.shippedEmail ? ` ${SHIPPED_EMAIL[saved.shippedEmail]}` : ""}`);
    });
  }
  function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || !detailsDraft) return;
    void perform(async () => {
      const saved = await request<{ changed: string[] }>("order-details", { id: selected.id, details: detailsDraft });
      await reloadOrder(selected.id); setDetailsDraft(null);
      setMessage(saved.changed.length ? "Delivery details saved." : "No delivery details changed.");
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
  const openTab = (item: Tab) => { setTab(item); setMoreOpen(false); setSelected(null); setEmail(null); setMessage(""); setSheet(null); if (item !== "onsite") setOnsiteDay(null); window.scrollTo({ top: 0 }); };
  const navItem = (item: Tab, label: string, icon: IconName) => <button type="button" key={item} className="admin-nav-item" aria-current={tab === item ? "page" : undefined} onClick={() => openTab(item)}>
    <Icon name={icon} /><span>{label}</span>{item === "orders" && unseen > 0 && <b className="admin-badge" aria-label={`${unseen} not seen yet`}>{unseen}</b>}
  </button>;
  const signOut = () => void perform(async () => { await request("logout", {}); signedOut(); });
  const filterChip = (label: string, active: boolean, onClick: () => void, count?: number) => <button type="button" className="admin-chip" aria-pressed={active} disabled={busy} onClick={onClick}>{label}{count ? <b>{count}</b> : null}</button>;

  if (!username) return <div className="admin-shell admin-signin-shell">
    <main id="admin-content" className="admin-signin" aria-busy={busy}>
      <div className="admin-signin-brand"><img src="/brand-emblem.svg" alt="" width="28" height="44" /><span>YAT.lifestyle</span><small>Admin</small></div>
      <p className="admin-alert is-bad" role="alert" hidden={!error}>{error}</p>
      {username === undefined ? <p className="admin-muted" role="status">Checking your sign-in…</p> : <>
        <h1>Sign in</h1><p className="admin-muted">Orders, money and onsite selling for YAT.lifestyle.</p>
        <form onSubmit={signIn} className="admin-form">
          <label>Username<input name="username" autoComplete="username" defaultValue="natasha" required maxLength={64} /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256} /></label>
          <button className="admin-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </>}
    </main>
  </div>;

  return <div className="admin-shell">
    <a className="admin-skip" href="#admin-content">Skip to content</a>
    <aside className="admin-sidebar" aria-label="Admin">
      <a className="admin-brand" href="/admin"><img src="/brand-emblem.svg" alt="" width="20" height="31" /><span>YAT.lifestyle</span><small>Admin</small></a>
      <nav aria-label="Admin sections">{TABS.map(([item, label, icon]) => navItem(item, label, icon))}</nav>
      <div className="admin-account"><span>Signed in as <b>{username}</b></span><button type="button" className="admin-nav-item" disabled={busy} onClick={signOut}><Icon name="logout" /><span>Sign out</span></button></div>
    </aside>
    <header className="admin-topbar">
      <a className="admin-brand" href="/admin"><img src="/brand-emblem.svg" alt="" width="18" height="28" /><span>YAT.lifestyle</span><small>Admin</small></a>
      <span className="admin-topbar-user">{username}</span>
    </header>
    <main id="admin-content" className="admin-main" aria-busy={busy}>
      <div className="admin-alerts">
        <p className="admin-alert is-bad" role="alert" hidden={!error}><Icon name="alert" />{error}</p>
        <p className="admin-alert is-ok" role="status" aria-live="polite" hidden={!message}><Icon name="check" />{message}</p>
      </div>
      {tab === "money" ? <MoneyPanel busy={busy} perform={(work) => void perform(work)} notify={setMessage} onOpenOrders={() => { openTab("orders"); setFulfillment("dispatched"); setOnlyNew(false); setPage(1); }} onOpenDay={(id) => { openTab("onsite"); setOnsiteDay(id); }} onOpenSettings={() => openTab("settings")} />
      : tab === "onsite" ? <OnsitePanel busy={busy} perform={(work) => void perform(work)} notify={setMessage} dayId={onsiteDay} onDayChange={setOnsiteDay} />
      : tab === "settings" ? <SettingsPanel busy={busy} perform={(work) => void perform(work)} notify={setMessage} />
      : tab === "orders" ? <>
        <div className="admin-page-head">
          <div><h1>Orders</h1><p>{unseen ? `${unseen} paid order${unseen === 1 ? "" : "s"} Natasha hasn't opened yet.` : "Every paid order has been opened."}</p></div>
          <div className="admin-head-actions">
            {owner && unseen > 0 && <button type="button" className="admin-secondary" disabled={busy} onClick={() => { if (window.confirm(`Mark all ${unseen} unopened orders as seen?`)) void perform(async () => { await request("orders-seen", {}); setRevision((value) => value + 1); setMessage("All paid orders marked as seen."); }); }}><Icon name="eye" />Mark all seen</button>}
            <button type="button" className="admin-secondary" disabled={busy} onClick={() => setRevision((value) => value + 1)}><Icon name="refresh" />Refresh</button>
          </div>
        </div>
        <div className="admin-toolbar">
          <div className="admin-chips" role="group" aria-label="Fulfillment stage">
            {filterChip("Not seen", onlyNew, () => { setOnlyNew(!onlyNew); setPage(1); }, unseen)}
            <span className="admin-chip-divider" aria-hidden="true" />
            {filterChip("All stages", fulfillment === "all", () => { setFulfillment("all"); setPage(1); })}
            {STAGES.map((stage) => <span key={stage}>{filterChip(stageName[stage], fulfillment === stage, () => { setFulfillment(stage); setPage(1); })}</span>)}
          </div>
          <label className="admin-select">Payment<select value={payment} disabled={busy} onChange={(event) => { setPayment(event.target.value); setPage(1); }}><option value="all">All</option><option value="paid">Paid</option><option value="unpaid">Awaiting payment</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select></label>
        </div>
        <div className="admin-card admin-table-scroll" tabIndex={0} role="region" aria-label="Order list">
          <table className="admin-table is-orders"><thead><tr><th scope="col">Order</th><th scope="col">Placed (Hong Kong)</th><th scope="col">Payment</th><th scope="col">Fulfillment</th><th scope="col" className="is-number">Total</th><th scope="col"><span className="visually-hidden">Review</span></th></tr></thead>
            <tbody>{orders === null ? <SkeletonRows columns={6} /> : orders.map((order) => <tr key={order.id} className={[isNew(order) ? "is-new" : "", selected?.id === order.id ? "is-selected" : ""].join(" ").trim() || undefined}>
              <td><span className="admin-order-id">{isNew(order) && <i className="admin-dot" aria-label="Not seen yet" />}#{order.id.slice(0, 8)}</span></td>
              <td>{date(order.created_at)}</td><td><PaymentPill status={order.payment_status} mode={order.mode} /></td><td><StagePill stage={order.fulfillment_status} /></td>
              <td className="is-number admin-figure">{formatPrice(order.total_cents)}</td>
              <td className="is-action"><button type="button" className="admin-secondary is-compact" disabled={busy} aria-label={`Review order ${order.id.slice(0, 8)}`} onClick={() => openOrder(order.id)}>Review</button></td>
            </tr>)}</tbody>
          </table>
          {orders !== null && !orders.length && <div className="admin-empty"><Icon name="box" size={28} /><p>{onlyNew ? "Nothing new. Every paid order has been opened." : "No orders match these filters."}</p></div>}
        </div>
        <div className="admin-pagination"><button type="button" className="admin-secondary is-compact" disabled={busy || page === 1} onClick={() => setPage(page - 1)}><Icon name="left" size={16} />Previous</button><span>Page {page}</span><button type="button" className="admin-secondary is-compact" disabled={busy || !hasMore} onClick={() => setPage(page + 1)}>Next<Icon name="right" size={16} /></button></div>
        {selected && <section className="admin-detail" aria-labelledby="order-heading">
          <div className="admin-page-head">
            <div><h2 id="order-heading">Order #{selected.id.slice(0, 8)}</h2><p className="admin-reference">{selected.id} · placed {date(selected.created_at)}</p></div>
            <div className="admin-head-actions"><PaymentPill status={selected.payment_status} mode={selected.mode} /><button type="button" className="admin-secondary is-compact" onClick={() => setSelected(null)}><Icon name="close" size={16} />Close</button></div>
          </div>
          {selected.mode !== "prod" && <p className="admin-alert is-violet"><Icon name="alert" />Test payment from the sandbox. It cannot enter fulfillment.</p>}
          {selected.payment_status !== "paid" && <p className="admin-alert is-warn"><Icon name="alert" />Payment is {(paymentName[selected.payment_status] ?? selected.payment_status).toLowerCase()}. Fulfillment opens once a live payment is confirmed.
            {selected.payment_status !== "cancelled" && <button type="button" className="admin-link is-danger" disabled={busy} onClick={() => {
              if (!window.confirm("Cancel this unpaid order? After provider confirmation, its payment closes and its voucher reservation is released. Any uncaptured authorization may be released.")) return;
              void perform(async () => {
                try { await request("order-cancel", { id: selected.id }); setMessage("Order cancellation confirmed."); }
                finally { await reloadOrder(selected.id); }
              });
            }}>Cancel unpaid order</button>}</p>}
          <ol className="admin-steps" aria-label="Fulfillment progress">{STAGES.map((stage, index) => {
            const at = STAGES.indexOf(selected.fulfillment.status);
            return <li key={stage} className={index < at ? "is-done" : index === at ? "is-current" : undefined} aria-current={index === at ? "step" : undefined}><span>{index < at ? <Icon name="check" size={14} /> : index + 1}</span>{stageName[stage]}</li>;
          })}</ol>
          <div className="admin-detail-grid">
            <div className="admin-card">
              <h3>Fragrances</h3>
              <ul className="admin-items">{selected.items.map((item) => <li key={item.slug}><span>{item.name} <small>× {item.quantity}</small></span><span className="admin-figure">{formatPrice(item.lineTotalCents)}</span></li>)}</ul>
              <dl className="admin-totals"><div><dt>Items subtotal</dt><dd className="admin-figure">{formatPrice(selected.subtotal_cents)}</dd></div><div><dt>Delivery</dt><dd className="admin-figure">{selected.delivery_cents ? formatPrice(selected.delivery_cents) : "Free"}</dd></div>{selected.discount_cents > 0 && <div><dt>Voucher {selected.voucher_code}</dt><dd className="admin-figure">−{formatPrice(selected.discount_cents)}</dd></div>}<div><dt>Paid</dt><dd className="admin-figure">{formatPrice(selected.total_cents)}</dd></div></dl>
              <div className="admin-card-head"><h3>Customer & delivery</h3>{!detailsDraft && <button type="button" className="admin-link" disabled={busy} onClick={() => setDetailsDraft({ name: selected.details.name, phone: selected.details.phone, district: selected.details.district, building: selected.details.building, street: selected.details.street, notes: selected.details.notes })}>Edit</button>}</div>
              {detailsDraft ? <form className="admin-form" onSubmit={saveDetails}><fieldset disabled={busy}>
                <label>Recipient name<input value={detailsDraft.name} maxLength={120} required onChange={(event) => setDetailsDraft({ ...detailsDraft, name: event.target.value })} /></label>
                <div className="admin-form-row">
                  <label>Hong Kong phone<input type="tel" value={detailsDraft.phone} maxLength={32} required onChange={(event) => setDetailsDraft({ ...detailsDraft, phone: event.target.value })} /></label>
                  <label>District<select value={detailsDraft.district} onChange={(event) => setDetailsDraft({ ...detailsDraft, district: event.target.value })}>{HK_DISTRICTS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
                </div>
                <label>Flat, floor & building<input value={detailsDraft.building} maxLength={300} required onChange={(event) => setDetailsDraft({ ...detailsDraft, building: event.target.value })} /></label>
                <label>Street<input value={detailsDraft.street} maxLength={300} onChange={(event) => setDetailsDraft({ ...detailsDraft, street: event.target.value })} /></label>
                <label>Customer note<textarea value={detailsDraft.notes} rows={2} maxLength={1000} onChange={(event) => setDetailsDraft({ ...detailsDraft, notes: event.target.value })} /></label>
                <p className="admin-hint">Email stays as verified at checkout: {selected.details.email}</p>
                <div className="admin-form-actions"><button className="admin-primary">Save details</button><button type="button" className="admin-secondary" onClick={() => setDetailsDraft(null)}>Cancel</button></div>
              </fieldset></form> : <>
              <address><strong>{selected.details.name}</strong><a href={`mailto:${selected.details.email}`}>{selected.details.email}</a><a href={`tel:${selected.details.phone}`}>{selected.details.phone}</a><span>{selected.details.building}</span>{selected.details.street && <span>{selected.details.street}</span>}<span>{districtName(selected.details.district)}, Hong Kong</span></address>
              {selected.details.notes && <p className="admin-note"><b>Customer note</b>{selected.details.notes}</p>}
              {selected.details_edited_at !== null && <p className="admin-hint">Corrected by {selected.details_edited_by} · {date(selected.details_edited_at)}. The checkout record keeps the original.</p>}
              </>}
            </div>
            <div className="admin-card">
              <h3>Fulfillment</h3>
              <form className="admin-form" onSubmit={saveFulfillment}>
                <fieldset disabled={busy || selected.payment_status !== "paid" || selected.mode !== "prod"}>
                  <label>Stage<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Stage })}>{STAGES.map((stage, index) => <option key={stage} value={stage} disabled={index > STAGES.indexOf(selected.fulfillment.status) + 1}>{stageName[stage]}</option>)}</select></label>
                  <div className="admin-form-row">
                    <label>Courier<input value={draft.courier} maxLength={80} required={draft.status === "dispatched"} onChange={(event) => setDraft({ ...draft, courier: event.target.value })} /></label>
                    <label>Tracking number<input value={draft.trackingNumber} maxLength={120} required={draft.status === "dispatched"} onChange={(event) => setDraft({ ...draft, trackingNumber: event.target.value })} /></label>
                  </div>
                  <label>Shipping cost you paid (HK$)<input className="admin-figure" value={draft.shippingCost} inputMode="decimal" pattern="\d{1,6}(\.\d{1,2})?" required={draft.status === "dispatched"} onChange={(event) => setDraft({ ...draft, shippingCost: event.target.value })} /><span className="admin-hint">Needed to dispatch. Money subtracts it from this order.</span></label>
                  <label>Private note<textarea value={draft.note} rows={3} maxLength={2000} onChange={(event) => setDraft({ ...draft, note: event.target.value })} /></label>
                  {draft.status === "dispatched" && selected.fulfillment.shipped_email_at === null && <p className="admin-alert is-info"><Icon name="mail" />Saving as Dispatched emails the customer their courier and tracking number.</p>}
                  <button className="admin-primary">Save fulfillment</button>
                </fieldset>
              </form>
              {selected.fulfillment.status === "dispatched" && <p className="admin-shipped-email">{selected.fulfillment.shipped_email_at !== null ? <><Icon name="check" size={16} />Shipped email sent {date(selected.fulfillment.shipped_email_at)}</> : "The shipped email has not been sent."}{" "}
                <button type="button" className="admin-link" disabled={busy} onClick={() => void perform(async () => { await request("shipped-email", { id: selected.id }); await reloadOrder(selected.id); setMessage("Shipped email sent to the customer."); })}>{selected.fulfillment.shipped_email_at !== null ? "Resend" : "Send now"}</button></p>}
            </div>
          </div>
          <details className="admin-card admin-history"><summary>Status history{selected.history.length >= 100 ? " · latest 100 updates" : ""}</summary>{!selected.history.length ? <p className="admin-muted">No fulfillment updates yet.</p> : <ol>{selected.history.map((entry, index) => <li key={`${entry.created_at}-${index}`}><div><b>{stageName[entry.previous_status ?? "new"]} → {stageName[entry.status]}</b><span>{date(entry.created_at)} · {entry.actor}</span></div>{entry.courier && <p>{entry.courier}{entry.tracking_number ? ` · ${entry.tracking_number}` : ""}</p>}{entry.note && <p className="admin-muted">{entry.note}</p>}</li>)}</ol>}</details>
        </section>}
      </> : tab === "vouchers" ? <>
        <div className="admin-page-head"><div><h1>Vouchers</h1><p>Codes customers type at checkout. The discount comes off the items subtotal; delivery is free.</p></div></div>
        <form className="admin-card admin-voucher-form admin-form" onSubmit={createVoucher}>
          <div className="admin-segmented admin-voucher-mode" role="group" aria-label="What to create">
            <button type="button" aria-pressed={voucherMode === "set"} onClick={() => setVoucherMode("set")}>Printable set</button>
            <button type="button" aria-pressed={voucherMode === "single"} onClick={() => setVoucherMode("single")}>One code</button>
          </div>
          {voucherMode === "set" ? <>
            <label>How many cards<input name="count" type="number" inputMode="numeric" required min={1} max={200} step={1} defaultValue={8} /></label>
            <label>Code prefix<input name="prefix" maxLength={12} pattern="[A-Za-z0-9]{0,12}" autoCapitalize="characters" autoComplete="off" placeholder="PMQ" /><span className="admin-hint">Optional</span></label>
          </> : <label>Voucher code<input name="code" required minLength={3} maxLength={32} pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" autoCapitalize="characters" autoComplete="off" /></label>}
          <label>Discount type<select value={voucherKind} disabled={busy} onChange={(event) => setVoucherKind(event.target.value)}><option value="percent">Percentage off</option><option value="fixed">HK$ off</option></select></label>
          <label>{voucherKind === "percent" ? "Discount (%)" : "Discount (HK$)"}<input name="amount" type="number" inputMode="decimal" required min={voucherKind === "percent" ? 1 : .01} max={voucherKind === "percent" ? 100 : 10000} step={voucherKind === "percent" ? 1 : .01} onChange={(event) => setVoucherPreview({ ...voucherPreview, amount: event.target.value })} /></label>
          <label>Minimum items subtotal (HK$)<input name="minimum" type="number" inputMode="decimal" required min={0} max={10000} step="0.01" defaultValue="0" onChange={(event) => setVoucherPreview({ ...voucherPreview, minimum: event.target.value })} /></label>
          <label>{voucherMode === "set" ? "Uses per code" : "Maximum uses"}<input name="maximum" type="number" inputMode="numeric" min={1} max={1000000} step={1} defaultValue={voucherMode === "set" ? 1 : undefined} key={voucherMode} /><span className="admin-hint">Blank for unlimited</span></label>
          <label>Expires at<input name="expiry" type="datetime-local" /><span className="admin-hint">Optional, your local time</span></label>
          <p className="admin-voucher-preview" aria-live="polite">{previewDiscount === null || previewDiscount < 1 ? "Enter a discount to see what a customer pays." : <>One gift box at checkout: <s className="admin-figure">{formatPrice(25800)}</s> <b className="admin-figure">{formatPrice(Math.max(0, 25800 - Math.min(25800, previewDiscount)))}</b>{previewMinimum > 25800 ? ` · needs ${formatPrice(previewMinimum)} of items first` : ""}</>}</p>
          <button className="admin-primary" disabled={busy}>{voucherMode === "set" ? "Create and print cards" : "Create voucher"}</button>
        </form>
        {sheet && <VoucherSheet vouchers={sheet} onClose={() => setSheet(null)} />}
        <h2 className="admin-section-title">All vouchers</h2>
        <p className="admin-muted">Latest 200. Reserved uses are orders with an open payment; they stay reserved until payment or confirmed cancellation.</p>
        <div className="admin-card admin-table-scroll" tabIndex={0} role="region" aria-label="Voucher list"><table className="admin-table is-stack"><thead><tr><th scope="col">Code</th><th scope="col">Discount</th><th scope="col">Terms</th><th scope="col">Uses</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead><tbody>{vouchers === null ? <SkeletonRows columns={6} /> : vouchers.map((voucher) => {
          const state = !voucher.active ? "Inactive" : voucher.expires_at && voucher.expires_at <= Date.now() ? "Expired" : "Active";
          return <tr key={voucher.code}><td data-label="Code"><span className="admin-code">{voucher.code}</span>{voucher.batch && <small className="admin-muted"> Printed set</small>}</td><td data-label="Discount" className="admin-figure">{voucherValue(voucher)}</td><td data-label="Terms">{voucherTerms(voucher) || "No limits"}</td><td data-label="Uses" className="admin-figure">{voucher.redeemed} paid · {voucher.reserved} reserved{voucher.max_uses ? ` / ${voucher.max_uses}` : ""}</td><td data-label="Status"><span className={`admin-pill is-${state === "Active" ? "ok" : "neutral"}`}>{state}</span></td><td className="is-action"><span className="admin-row-actions">{!!voucher.active && <button type="button" className="admin-link" disabled={busy} aria-label={voucher.batch ? `Print the set with ${voucher.code}` : `Print ${voucher.code}`} onClick={() => printSet(voucher)}>{voucher.batch ? "Print set" : "Print"}</button>}{!!voucher.active && <button type="button" className="admin-link is-danger" disabled={busy} aria-label={`Deactivate ${voucher.code}`} onClick={() => void perform(async () => { await request("voucher-deactivate", { code: voucher.code }); setRevision((value) => value + 1); setMessage(`${voucher.code} deactivated for future orders.`); })}>Deactivate</button>}</span></td></tr>;
        })}</tbody></table>{vouchers !== null && !vouchers.length && <div className="admin-empty"><Icon name="ticket" size={28} /><p>No vouchers yet. Create your first code above.</p></div>}</div>
      </> : tab === "inbox" ? <>
        <div className="admin-page-head"><div><h1>Inbox</h1><p>Mail sent to hello@, care@ and orders@yatlifestyle.com.</p></div><div className="admin-head-actions"><button type="button" className="admin-secondary" disabled={busy} onClick={() => setRevision((value) => value + 1)}><Icon name="refresh" />Refresh</button></div></div>
        {mailSettings && <div className="admin-card admin-mail-settings"><label className="admin-toggle"><input type="checkbox" role="switch" checked={mailSettings.forwardingEnabled} disabled={busy} onChange={(event) => {
          const forwardingEnabled = event.target.checked;
          void perform(async () => { setMailSettings(await request<MailSettings>("mail-settings", { forwardingEnabled })); setMessage(`Forwarding ${forwardingEnabled ? "enabled" : "disabled"} for future incoming emails.`); });
        }} /><span>Forward incoming emails to {mailSettings.destination}</span></label><p className="admin-muted">Forwarding needs a verified destination; the inbox keeps every message either way. Download the original to keep attachments.</p></div>}
        <div className="admin-card admin-table-scroll" tabIndex={0} role="region" aria-label="Inbox"><table className="admin-table is-stack"><thead><tr><th scope="col">From</th><th scope="col">Subject</th><th scope="col">Received (Hong Kong)</th><th scope="col">Forwarding</th><th scope="col"><span className="visually-hidden">Open email</span></th></tr></thead><tbody>{emails === null ? <SkeletonRows columns={5} /> : emails.map((item) => <tr key={item.id} className={email?.id === item.id ? "is-selected" : undefined}><td data-label="From">{item.from_email}</td><td data-label="Subject" className="admin-email-subject" title={item.subject}>{item.subject || "(No subject)"}</td><td data-label="Received">{date(item.received_at)}</td><td data-label="Forwarding"><span className={`admin-pill is-${item.forwarded_at ? "ok" : item.forward_error ? "bad" : "neutral"}`}>{item.forwarded_at ? "Forwarded" : item.forward_error ? "Forward failed" : "Stored"}</span></td><td className="is-action"><button type="button" className="admin-secondary is-compact" disabled={busy} aria-label={`Open email ${item.subject || "without a subject"}`} onClick={() => void perform(async () => { setEmail((await request<{ email: InboxEmail }>(`inbox?id=${encodeURIComponent(item.id)}`)).email); })}>Open</button></td></tr>)}</tbody></table>{emails !== null && !emails.length && <div className="admin-empty"><Icon name="mail" size={28} /><p>No incoming emails yet.</p></div>}</div>
        <div className="admin-pagination"><button type="button" className="admin-secondary is-compact" disabled={busy || inboxPage === 1} onClick={() => setInboxPage(inboxPage - 1)}><Icon name="left" size={16} />Previous</button><span>Page {inboxPage}</span><button type="button" className="admin-secondary is-compact" disabled={busy || !inboxHasMore} onClick={() => setInboxPage(inboxPage + 1)}>Next<Icon name="right" size={16} /></button></div>
        {email && <section className="admin-detail admin-email-detail" aria-labelledby="email-heading"><div className="admin-page-head"><div><h2 id="email-heading">{email.subject || "(No subject)"}</h2><p>From {email.from_email} · to {email.to_email} · {date(email.received_at)}</p></div><div className="admin-head-actions"><a className="admin-secondary" href={`/api/admin/inbox-raw?id=${encodeURIComponent(email.id)}`} download><Icon name="download" />Original (.eml)</a><button type="button" className="admin-secondary is-compact" onClick={() => setEmail(null)}><Icon name="close" size={16} />Close</button></div></div><pre className="admin-card admin-email-body">{email.text_body || "No plain-text body was supplied."}</pre>{email.attachment_names.length > 0 && <div className="admin-card"><h3>Attachments</h3><ul>{email.attachment_names.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul><p className="admin-muted">The original email download includes its attachments.</p></div>}</section>}
      </> : <>
        <div className="admin-page-head"><div><h1>Delivery notes</h1>{notes && <p>Research checked {notes.checkedAt}.</p>}</div></div>
        {!notes ? <div className="admin-card"><span className="admin-skeleton is-line" /><span className="admin-skeleton is-line" /><span className="admin-skeleton is-line is-short" /></div> : <div className="admin-delivery-notes"><p className="admin-alert is-info"><Icon name="alert" />{notes.introduction}</p>{notes.sections.map((section) => <section key={section.title} className="admin-card"><h2>{section.title}</h2><ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul></section>)}<section className="admin-card"><h2>Official references</h2><ul>{notes.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul><p className="admin-muted">{notes.limitations}</p></section></div>}
      </>}
    </main>
    <nav className="admin-tabbar" aria-label="Admin sections">
      {TABS.filter(([item]) => PRIMARY.includes(item)).map(([item, label, icon]) => navItem(item, label, icon))}
      <button type="button" className="admin-nav-item" aria-expanded={moreOpen} aria-controls="admin-more" aria-current={!PRIMARY.includes(tab) ? "page" : undefined} onClick={() => setMoreOpen(!moreOpen)}><Icon name="more" /><span>More</span></button>
    </nav>
    {moreOpen && <div className="admin-more-backdrop" onClick={() => setMoreOpen(false)}>
      <div id="admin-more" className="admin-more" aria-label="More sections" onClick={(event) => event.stopPropagation()}>
        {TABS.filter(([item]) => !PRIMARY.includes(item)).map(([item, label, icon]) => navItem(item, label, icon))}
        <button type="button" className="admin-nav-item" disabled={busy} onClick={signOut}><Icon name="logout" /><span>Sign out</span></button>
      </div>
    </div>}
  </div>;
}
