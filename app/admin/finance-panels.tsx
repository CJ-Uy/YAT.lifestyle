"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { PRODUCTS } from "../../lib/shop";
import { StyledQr } from "./styled-qr";
import { amount, cents, date, hkToday, money, request } from "./admin-api";

export type PanelProps = { busy: boolean; perform: (work: () => Promise<void>) => void; notify: (message: string) => void };
type Rate = { effective_from: number; airwallex_bp: number | null; airwallex_fixed_cents: number; partner_bp: number; created_by?: string; created_at?: number };
type OnsiteDayRow = { id: string; place: string; day: string; stall_fee_cents: number; status: "open" | "closed"; sales: number; bottles: number; sales_cents: number; usual_price_cents?: number | null };
type MoneyData = {
  from: string; to: string; grossCents: number; keptCents: number; monthly: boolean; rate: Rate;
  online: { salesCents: number; orders: number; feeCents: number; feeUnset: number; partnerCents: number; shippingCents: number; awaitingDispatch: number; missingShipping: string[]; keptCents: number };
  onsite: { salesCents: number; bottles: number; stallCents: number; keptCents: number; days: OnsiteDayRow[] };
  series: { key: string; cents: number; orders: number }[];
  bestSellers: { slug: string; name: string; quantity: number }[];
  previous: { from: string; to: string; keptCents: number };
  partner: { month: string; owedCents: number; paidCents: number | null; paidAt: number | null; paidBy: string | null }[];
};
type Sale = { id: string; slug: string; quantity: number; unit_price_cents: number; payment_method: Method; created_at: number };
type Method = "cash" | "fps" | "payme" | "octopus" | "card" | "other";
export type Voucher = { code: string; kind: "percent" | "fixed"; amount: number; min_subtotal_cents: number; expires_at: number | null; max_uses: number | null; active: number; redeemed: number; reserved: number; batch: string | null };

const METHODS: [Method, string][] = [["cash", "Cash"], ["fps", "FPS"], ["payme", "PayMe"], ["octopus", "Octopus"], ["card", "Card"], ["other", "Other"]];
const methodName = Object.fromEntries(METHODS) as Record<Method, string>;
const scentName = (slug: string) => PRODUCTS.find((product) => product.slug === slug)?.name ?? slug;
const scentImage = (slug: string) => `/media/scents/${slug}.webp`;
const utcDay = (utc: number) => new Date(utc).toISOString().slice(0, 10);
const monthName = (month: string, style: "long" | "short" = "long") => new Intl.DateTimeFormat("en-HK", { month: style, year: "numeric", timeZone: "UTC" }).format(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1));
const dayName = (day: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-HK", { ...options, timeZone: "UTC" }).format(Date.parse(`${day}T00:00:00Z`));

/** One stroke weight for every admin icon. */
const ICONS = {
  left: "M15 5l-7 7 7 7", right: "M9 5l7 7-7 7", download: "M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19.5h14", check: "M5 12.5l4.5 4.5L19 7.5",
  alert: "M12 4l9 16H3L12 4zm0 6v4.5m0 2.5v.5", print: "M7 9V4h10v5M7 17H5a1 1 0 01-1-1v-6a1 1 0 011-1h14a1 1 0 011 1v6a1 1 0 01-1 1h-2M7 14h10v6H7z",
  tag: "M3.5 12.5V3.5h9l8.5 8.5-9 9-8.5-8.5zM8 8h.01",
  minus: "M5 12h14", plus: "M12 5v14M5 12h14", undo: "M9 7L5 11l4 4M5 11h9.5a4.5 4.5 0 010 9H11", close: "M6 6l12 12M18 6L6 18",
  chart: "M5 20V11M12 20V5M19 20v-6M3 20h18", store: "M4 10v10h16V10M3 10l2-6h14l2 6zM9 20v-6h6v6", box: "M3 7.5l9-4.5 9 4.5-9 4.5-9-4.5zm0 0V17l9 4.5 9-4.5V7.5M12 12v9.5",
  ticket: "M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4V7zm10 0v10", mail: "M3.5 6h17v12h-17zM3.5 7l8.5 6 8.5-6", truck: "M2.5 6.5h11v9h-11zM13.5 10h4l3 3v2.5h-7M7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z",
  sliders: "M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4", more: "M5 11.2h1.6v1.6H5zM11.2 11.2h1.6v1.6h-1.6zM17.4 11.2H19v1.6h-1.6z",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10", refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7", eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z",
  bell: "M6 16v-5a6 6 0 1112 0v5l1.5 2h-15zM10 20.5a2 2 0 004 0",
};
export type IconName = keyof typeof ICONS;
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths = ICONS;
  return <svg className="admin-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

/* ---------------- Money ---------------- */

type Period = { mode: "month" | "year" | "custom"; anchor: string; from: string; to: string };
function periodRange(period: Period) {
  const year = Number(period.anchor.slice(0, 4)), month = Number(period.anchor.slice(5, 7));
  if (period.mode === "month") return { from: utcDay(Date.UTC(year, month - 1, 1)), to: utcDay(Date.UTC(year, month, 0)) };
  if (period.mode === "year") return { from: `${year}-01-01`, to: `${year}-12-31` };
  return { from: period.from, to: period.to };
}
function shift(period: Period, step: number): Period {
  const year = Number(period.anchor.slice(0, 4)), month = Number(period.anchor.slice(5, 7));
  return { ...period, anchor: period.mode === "year" ? `${year + step}-01-01` : utcDay(Date.UTC(year, month - 1 + step, 1)) };
}
function periodTitle(period: Period, range: { from: string; to: string }) {
  if (period.mode === "month") return monthName(range.from);
  if (period.mode === "year") return range.from.slice(0, 4);
  return `${dayName(range.from, { day: "numeric", month: "short" })} – ${dayName(range.to, { day: "numeric", month: "short", year: "numeric" })}`;
}

function Bars({ data }: { data: MoneyData }) {
  const max = Math.max(...data.series.map((point) => point.cents), 1), width = data.series.length * 10, best = data.series.reduce((top, point) => point.cents > top.cents ? point : top, data.series[0]);
  const label = (key: string) => key.length === 7 ? monthName(key, "short").split(" ")[0] : dayName(key, { day: "numeric", month: "short" });
  const ticks = data.series.length > 1 ? [data.series[0], data.series[Math.floor((data.series.length - 1) / 2)], data.series[data.series.length - 1]] : data.series;
  return <figure className="money-chart">
    <div className="money-chart-max admin-figure" aria-hidden="true">{money(max === 1 ? 0 : max)}</div>
    <svg viewBox={`0 0 ${width} 100`} preserveAspectRatio="none" role="img" aria-label={`Online sales ${data.monthly ? "by month" : "by day"}. ${best?.cents ? `Highest ${money(best.cents)} on ${label(best.key)}.` : "No online sales in this period."}`}>
      <line x1="0" x2={width} y1="2" y2="2" className="money-chart-grid" vectorEffect="non-scaling-stroke" />
      <line x1="0" x2={width} y1="51" y2="51" className="money-chart-grid" vectorEffect="non-scaling-stroke" />
      {data.series.map((point, index) => point.cents
        ? <rect key={point.key} x={index * 10 + 2} width="6" y={100 - point.cents / max * 98} height={point.cents / max * 98} className="money-chart-bar"><title>{`${label(point.key)}: ${money(point.cents)} · ${point.orders} order${point.orders === 1 ? "" : "s"}`}</title></rect>
        : <rect key={point.key} x={index * 10 + 2} width="6" y="99" height="1" className="money-chart-empty" />)}
    </svg>
    <figcaption>{ticks.map((point) => <span key={point.key}>{label(point.key)}</span>)}</figcaption>
  </figure>;
}

function Ledger({ rows, total, totalLabel }: { rows: { label: ReactNode; cents: number; scale: number; muted?: boolean; note?: ReactNode }[]; total: number; totalLabel: string }) {
  return <dl className="money-ledger">
    {rows.map((row, index) => <div key={index} className={row.muted ? "is-deduction" : undefined}>
      <dt>{row.label}{row.note && <small>{row.note}</small>}</dt>
      <dd><span className="money-ledger-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, row.scale * 100)}%` }} /></span><span className="admin-figure">{row.muted ? "− " : ""}{money(row.cents)}</span></dd>
    </div>)}
    <div className="money-ledger-total"><dt>{totalLabel}</dt><dd className="admin-figure">{money(total)}</dd></div>
  </dl>;
}

export function MoneyPanel({ busy, perform, notify, onOpenOrders, onOpenDay, onOpenSettings }: PanelProps & { onOpenOrders: () => void; onOpenDay: (id: string) => void; onOpenSettings: () => void }) {
  const [period, setPeriod] = useState<Period>(() => ({ mode: "month", anchor: hkToday(), from: `${hkToday().slice(0, 8)}01`, to: hkToday() }));
  const [data, setData] = useState<MoneyData | null>(null), [revision, setRevision] = useState(0);
  const range = periodRange(period), query = `from=${range.from}&to=${range.to}`;
  const validCustom = period.mode !== "custom" || (period.from && period.to && period.from <= period.to);
  useEffect(() => {
    if (!validCustom) return;
    perform(async () => setData(await request<MoneyData>(`money?${query}`)));
    // perform is recreated each render; reload only when the range changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, revision, validCustom]);

  const title = periodTitle(period, range), current = data && data.from === range.from && data.to === range.to ? data : null;
  const change = current ? current.keptCents - current.previous.keptCents : 0;
  const previousName = period.mode === "month" ? monthName(current?.previous.from ?? range.from) : period.mode === "year" ? current?.previous.from.slice(0, 4) : "the previous period";
  const parts = current ? [
    { key: "onsite", label: "Onsite kept", cents: current.onsite.keptCents }, { key: "online", label: "Online kept", cents: current.online.keptCents },
    { key: "shipping", label: "Shipping", cents: current.online.shippingCents }, { key: "stall", label: "Stall fees", cents: current.onsite.stallCents },
    { key: "partner", label: "CJ share", cents: current.online.partnerCents }, { key: "fee", label: "Airwallex", cents: current.online.feeCents },
  ].filter((part) => part.cents > 0) : [];
  const partsTotal = parts.reduce((sum, part) => sum + part.cents, 0);
  const year = hkToday().slice(0, 4), open = current?.partner.filter((row) => row.owedCents > (row.paidCents ?? 0)) ?? [];
  const openCents = open.reduce((sum, row) => sum + row.owedCents - (row.paidCents ?? 0), 0);
  const paidThisYear = current?.partner.filter((row) => row.month.startsWith(year)).reduce((sum, row) => sum + (row.paidCents ?? 0), 0) ?? 0;
  const thisMonth = hkToday().slice(0, 7);

  function payout(month: string, paid: boolean) {
    perform(async () => {
      await request(paid ? "partner-paid" : "partner-unpaid", { month });
      setRevision((value) => value + 1); notify(paid ? `${monthName(month)} marked paid to CJ.` : `${monthName(month)} marked unpaid.`);
    });
  }

  return <div className="money">
    <div className="money-top">
      <h1>{title}</h1>
      <div className="money-controls">
        <div className="admin-segmented" role="group" aria-label="Period">
          {(["month", "year", "custom"] as const).map((mode) => <button key={mode} type="button" aria-pressed={period.mode === mode} disabled={busy} onClick={() => setPeriod({ ...period, mode, from: range.from, to: range.to })}>{mode === "month" ? "Month" : mode === "year" ? "Year" : "Custom"}</button>)}
        </div>
        {period.mode !== "custom" && <div className="admin-stepper">
          <button type="button" disabled={busy} aria-label={`Previous ${period.mode}`} onClick={() => setPeriod(shift(period, -1))}><Icon name="left" /></button>
          <button type="button" disabled={busy || range.to >= hkToday()} aria-label={`Next ${period.mode}`} onClick={() => setPeriod(shift(period, 1))}><Icon name="right" /></button>
        </div>}
        <a className="admin-outline" href={`/api/admin/money-csv?${query}`} download><Icon name="download" />CSV</a>
      </div>
    </div>
    {period.mode === "custom" && <div className="admin-filters money-custom">
      <label>From<input type="date" value={period.from} max={period.to || undefined} onChange={(event) => setPeriod({ ...period, from: event.target.value })} /></label>
      <label>To<input type="date" value={period.to} min={period.from || undefined} onChange={(event) => setPeriod({ ...period, to: event.target.value })} /></label>
    </div>}

    {!current ? (busy || validCustom ? <div className="money-skeleton" role="status" aria-label="Loading money"><span className="admin-skeleton is-hero" /><div className="money-columns"><span className="admin-skeleton is-panel" /><span className="admin-skeleton is-panel" /></div></div> : <p className="admin-empty">Choose a start date on or before the end date.</p>) : <>
      <section className="money-hero" aria-label="Total kept">
        <div>
          <p className="money-label">Kept {period.mode === "month" ? "this month" : period.mode === "year" ? "this year" : "in this period"}</p>
          <p className="money-total admin-figure">{money(current.keptCents)}</p>
          <p className={change >= 0 ? "money-change is-up" : "money-change is-down"}>{change === 0 ? `Same as ${previousName}` : `${change > 0 ? "+" : "−"}${money(Math.abs(change))} vs ${previousName}`}</p>
        </div>
        <div className="money-split">
          <p className="money-label">Where {money(current.grossCents)} of sales went</p>
          {partsTotal ? <>
            <div className="money-split-bar" aria-hidden="true">{parts.map((part) => <i key={part.key} className={`is-${part.key}`} style={{ width: `${part.cents / partsTotal * 100}%` }} />)}</div>
            <ul className="money-legend">{parts.map((part) => <li key={part.key}><i className={`is-${part.key}`} aria-hidden="true" />{part.label} <b className="admin-figure">{money(part.cents)}</b></li>)}</ul>
          </> : <p className="admin-muted">No sales in this period yet.</p>}
        </div>
      </section>

      <div className="money-columns">
        <section className="admin-panel" aria-labelledby="money-online">
          <div className="admin-panel-head"><h2 id="money-online">Online</h2><span>{current.online.orders} paid order{current.online.orders === 1 ? "" : "s"}</span></div>
          <p className="money-sales admin-figure">{money(current.online.salesCents)}<small>sales</small></p>
          <Bars data={current} />
          <Ledger totalLabel="Online kept" total={current.online.keptCents} rows={[
            { label: "Sales", cents: current.online.salesCents, scale: 1 },
            { label: "Shipping she paid", cents: current.online.shippingCents, scale: current.online.shippingCents / (current.online.salesCents || 1), muted: true },
            { label: `CJ share`, note: `${current.rate.partner_bp / 100}% of what customers paid`, cents: current.online.partnerCents, scale: current.online.partnerCents / (current.online.salesCents || 1), muted: true },
            { label: "Airwallex fees", note: current.online.feeUnset ? <>est. · <button type="button" className="admin-link" onClick={onOpenSettings}>set the rate</button> for {current.online.feeUnset} order{current.online.feeUnset === 1 ? "" : "s"}</> : "est. at the rate in Settings", cents: current.online.feeCents, scale: current.online.feeCents / (current.online.salesCents || 1), muted: true },
          ]} />
          {current.online.missingShipping.length > 0 && <div className="admin-flag" role="note"><Icon name="alert" /><span>{current.online.missingShipping.length} dispatched order{current.online.missingShipping.length === 1 ? " has" : "s have"} no shipping cost yet.</span><button type="button" className="admin-link" onClick={onOpenOrders}>Add costs</button></div>}
          {current.online.awaitingDispatch > 0 && <p className="admin-muted money-note">{current.online.awaitingDispatch} paid order{current.online.awaitingDispatch === 1 ? " is" : "s are"} not dispatched yet; their shipping cost comes off when you dispatch.</p>}
        </section>

        <section className="admin-panel" aria-labelledby="money-onsite">
          <div className="admin-panel-head"><h2 id="money-onsite">Onsite</h2><span>{current.onsite.days.length} day{current.onsite.days.length === 1 ? "" : "s"} · {current.onsite.bottles} bottle{current.onsite.bottles === 1 ? "" : "s"}</span></div>
          <p className="money-sales admin-figure">{money(current.onsite.salesCents)}<small>sales</small></p>
          {!current.onsite.days.length ? <p className="admin-muted">No selling days in this period.</p> : <ul className="money-days">{current.onsite.days.map((day) => <li key={day.id}>
            <button type="button" onClick={() => onOpenDay(day.id)} aria-label={`Open ${day.place}, ${dayName(day.day, { day: "numeric", month: "long" })}`}>
              <span className="money-date"><b className="admin-figure">{Number(day.day.slice(8))}</b><small>{dayName(day.day, { weekday: "short" })}</small></span>
              <span className="money-day-place">{day.place}<small>{day.bottles} bottle{day.bottles === 1 ? "" : "s"}{day.bottles ? ` · avg ${money(Math.round(day.sales_cents / day.bottles))}` : ""}{day.status === "open" ? " · still open" : ""}</small></span>
              <span className="admin-figure">{money(day.sales_cents)}</span>
            </button>
          </li>)}</ul>}
          <Ledger totalLabel="Onsite kept" total={current.onsite.keptCents} rows={[{ label: "Stall fees", cents: current.onsite.stallCents, scale: current.onsite.stallCents / (current.onsite.salesCents || 1), muted: true }]} />
        </section>
      </div>

      {current.bestSellers.length > 0 && <section className="money-best" aria-labelledby="money-best">
        <h2 id="money-best">Best sellers</h2>
        <ol>{current.bestSellers.map((row) => <li key={row.slug}><img src={scentImage(row.slug)} alt="" width="44" height="44" /><span>{row.name}</span><span className="money-best-bar" aria-hidden="true"><i style={{ width: `${row.quantity / current.bestSellers[0].quantity * 100}%` }} /></span><b className="admin-figure">{row.quantity}</b></li>)}</ol>
      </section>}

      <section className="money-partner" aria-labelledby="money-partner">
        <h2 id="money-partner">CJ share</h2>
        <div className="money-partner-grid">
          <div><p className="money-label">Open to pay</p><p className="money-partner-figure admin-figure">{money(openCents)}</p><p className="admin-muted">{open.length ? `${open.length} month${open.length === 1 ? "" : "s"}` : "Nothing open"}</p></div>
          <div><p className="money-label">Paid in {year}</p><p className="money-partner-figure admin-figure">{money(paidThisYear)}</p><p className="admin-muted">{current.rate.partner_bp / 100}% of online sales, paid monthly</p></div>
          <ul className="money-partner-months">{!current.partner.length ? <li className="admin-muted">No online sales yet.</li> : current.partner.map((row) => {
            const due = row.owedCents - (row.paidCents ?? 0);
            return <li key={row.month}>
              <span>{monthName(row.month)}</span>
              <span className="admin-figure">{money(row.owedCents)}</span>
              {row.paidAt && due <= 0 ? <span className="admin-pill is-paid"><Icon name="check" size={14} />Paid {new Intl.DateTimeFormat("en-HK", { day: "numeric", month: "short", timeZone: "Asia/Hong_Kong" }).format(row.paidAt)}</span>
                : <span className="admin-pill is-open">{row.paidAt ? `${money(due)} more` : row.month === thisMonth ? "This month" : "Open"}</span>}
              {due > 0 ? <button type="button" className="admin-small" disabled={busy || row.month > thisMonth} onClick={() => payout(row.month, true)}>Mark paid</button>
                : <button type="button" className="admin-link" disabled={busy} onClick={() => { if (window.confirm(`Mark ${monthName(row.month)} as unpaid?`)) payout(row.month, false); }}>Undo</button>}
            </li>;
          })}</ul>
        </div>
      </section>
      <p className="admin-muted money-footnote">Only paid live orders count, by payment date in Hong Kong. Sandbox, unpaid, failed and cancelled orders stay out.</p>
    </>}
  </div>;
}

/* ---------------- Onsite ---------------- */

type DayDetail = { day: { id: string; place: string; day: string; usual_price_cents: number | null; stall_fee_cents: number; status: "open" | "closed" }; sales: Sale[] };
type Draft = { id: string; slug: string; quantity: number; price: string; method: Method | "" };
const newDraft = (price = ""): Draft => ({ id: crypto.randomUUID(), slug: "", quantity: 1, price, method: "" });

function ScentPicker({ value, onChange, name }: { value: string; onChange: (slug: string) => void; name: string }) {
  return <fieldset className="onsite-scents"><legend>Scent</legend><div>
    {PRODUCTS.map((product) => <label key={product.slug} className={value === product.slug ? "is-selected" : undefined}>
      <input type="radio" name={name} value={product.slug} checked={value === product.slug} onChange={() => onChange(product.slug)} />
      <img src={scentImage(product.slug)} alt="" width="64" height="64" loading="lazy" /><span>{product.name}</span>
    </label>)}
  </div></fieldset>;
}
function MethodPicker({ value, onChange, name }: { value: string; onChange: (method: Method) => void; name: string }) {
  return <fieldset className="onsite-methods"><legend>Paid by</legend><div>
    {METHODS.map(([method, label]) => <label key={method} className={value === method ? "is-selected" : undefined}><input type="radio" name={name} value={method} checked={value === method} onChange={() => onChange(method)} />{label}</label>)}
  </div></fieldset>;
}
function Quantity({ value, onChange }: { value: number; onChange: (quantity: number) => void }) {
  return <div className="onsite-quantity" role="group" aria-label="Quantity">
    <button type="button" aria-label="One fewer" disabled={value <= 1} onClick={() => onChange(value - 1)}><Icon name="minus" /></button>
    <output aria-live="polite" className="admin-figure">{value}</output>
    <button type="button" aria-label="One more" disabled={value >= 100} onClick={() => onChange(value + 1)}><Icon name="plus" /></button>
  </div>;
}

export function OnsitePanel({ busy, perform, notify, dayId, onDayChange }: PanelProps & { dayId: string | null; onDayChange: (id: string | null) => void }) {
  const [list, setList] = useState<{ days: OnsiteDayRow[]; places: string[]; today: string } | null>(null);
  const [detail, setDetail] = useState<DayDetail | null>(null), [view, setView] = useState<"record" | "review">("record");
  const [draft, setDraft] = useState<Draft>(() => newDraft()), [recorded, setRecorded] = useState<{ id: string; text: string } | null>(null), [recordError, setRecordError] = useState("");
  const [editing, setEditing] = useState<Draft | null>(null), [dayForm, setDayForm] = useState({ place: "", day: "", usual: "", stall: "" });

  const loadDay = async (id: string) => {
    const loaded = await request<DayDetail>(`onsite-day?id=${id}`);
    setDetail(loaded);
    setDayForm({ place: loaded.day.place, day: loaded.day.day, usual: amount(loaded.day.usual_price_cents), stall: loaded.day.stall_fee_cents ? amount(loaded.day.stall_fee_cents) : "" });
    return loaded;
  };
  useEffect(() => {
    perform(async () => {
      if (!dayId) { setDetail(null); setList(await request("onsite-days")); return; }
      const loaded = await loadDay(dayId);
      setView(loaded.day.status === "closed" ? "review" : "record");
      setDraft(newDraft(amount(loaded.sales[0]?.unit_price_cents ?? loaded.day.usual_price_cents ?? null)));
      setRecorded(null); setRecordError(""); setEditing(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayId]);

  const totals = useMemo(() => {
    const sales = detail?.sales ?? [], byMethod = new Map<Method, number>();
    for (const sale of sales) byMethod.set(sale.payment_method, (byMethod.get(sale.payment_method) ?? 0) + sale.quantity * sale.unit_price_cents);
    return { cents: sales.reduce((sum, sale) => sum + sale.quantity * sale.unit_price_cents, 0), bottles: sales.reduce((sum, sale) => sum + sale.quantity, 0), count: sales.length, byMethod: [...byMethod].sort((a, b) => b[1] - a[1]) };
  }, [detail]);
  const quickPrices = useMemo(() => [...new Set([detail?.day.usual_price_cents, ...(detail?.sales ?? []).map((sale) => sale.unit_price_cents)].filter((value): value is number => typeof value === "number"))].slice(0, 4).sort((a, b) => a - b), [detail]);

  function startDay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = new FormData(event.currentTarget);
    perform(async () => {
      const created = await request<{ id: string }>("onsite-day-create", { place: fields.get("place"), day: fields.get("day"), usualPrice: fields.get("usual") });
      onDayChange(created.id); notify("Selling day opened.");
    });
  }
  const draftPrice = cents(draft.price), canRecord = !!draft.slug && !!draft.method && draftPrice !== null;
  function record(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!detail || !canRecord) return;
    const sent = draft;
    perform(async () => {
      setRecordError("");
      try { await request("onsite-sale-save", { id: sent.id, dayId: detail.day.id, slug: sent.slug, quantity: sent.quantity, unitPrice: sent.price, method: sent.method }); }
      catch (problem) { setRecordError(problem instanceof Error ? problem.message : "The sale could not be saved."); throw problem; }
      // A retry after a failure reuses the same id, so the sale can never be counted twice.
      setRecorded({ id: sent.id, text: `${scentName(sent.slug)} × ${sent.quantity} · ${money(sent.quantity * draftPrice!)} · ${methodName[sent.method as Method]}` });
      setDraft(newDraft(sent.price)); await loadDay(detail.day.id);
    });
  }
  function removeSale(id: string, text: string) {
    if (!detail) return;
    perform(async () => { await request("onsite-sale-delete", { id }); setRecorded(null); setEditing(null); await loadDay(detail.day.id); notify(`${text} removed.`); });
  }
  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!detail || !editing || !editing.method) return;
    perform(async () => { await request("onsite-sale-save", { id: editing.id, dayId: detail.day.id, slug: editing.slug, quantity: editing.quantity, unitPrice: editing.price, method: editing.method }); setEditing(null); await loadDay(detail.day.id); notify("Sale updated."); });
  }
  function saveDay(status: "open" | "closed") {
    if (!detail) return;
    perform(async () => {
      await request("onsite-day-update", { id: detail.day.id, place: dayForm.place, day: dayForm.day, usualPrice: dayForm.usual, stallFee: dayForm.stall, status });
      await loadDay(detail.day.id);
      if (status === "closed") { notify("Day saved and closed."); onDayChange(null); } else { setView("record"); notify(detail.day.status === "closed" ? "Day reopened." : "Day details saved."); }
    });
  }

  if (!dayId) return <div className="onsite">
    <div className="admin-page-head"><div><h1>Onsite selling</h1><p>Markets and pop-ups. Start a day, then record each sale as it happens.</p></div></div>
    <form className="admin-panel onsite-start" onSubmit={startDay}>
      <h2>Start selling</h2>
      <label>Place or event<input name="place" list="onsite-places" required maxLength={120} autoComplete="off" placeholder="PMQ weekend market" /></label>
      <datalist id="onsite-places">{list?.places.map((place) => <option key={place} value={place} />)}</datalist>
      <div className="onsite-start-row">
        <label>Date<input name="day" type="date" required defaultValue={list?.today ?? hkToday()} key={list?.today} /></label>
        <label>Usual price <span>(HK$, optional)</span><input name="usual" inputMode="decimal" pattern="\d{1,6}(\.\d{1,2})?" placeholder="240" /></label>
      </div>
      <button className="admin-primary" disabled={busy}>Open selling day</button>
    </form>
    <h2 className="onsite-list-title">Selling days</h2>
    {!list ? <div className="onsite-days" role="status" aria-label="Loading selling days"><span className="admin-skeleton is-row" /><span className="admin-skeleton is-row" /></div> : !list.days.length ? <div className="admin-empty"><Icon name="store" size={28} /><p>No selling days yet. Start your first one above.</p></div>
      : <ul className="onsite-days">{list.days.map((day) => <li key={day.id}><button type="button" onClick={() => onDayChange(day.id)}>
        <span className="money-date"><b className="admin-figure">{Number(day.day.slice(8))}</b><small>{dayName(day.day, { month: "short" })}</small></span>
        <span className="money-day-place">{day.place}<small>{day.bottles} bottle{day.bottles === 1 ? "" : "s"} · {day.sales} sale{day.sales === 1 ? "" : "s"}</small></span>
        <span className="onsite-day-side"><b className="admin-figure">{money(day.sales_cents)}</b>{day.status === "open" ? <span className="admin-pill is-live">Open</span> : <span className="admin-pill">Closed</span>}</span>
      </button></li>)}</ul>}
  </div>;

  if (!detail) return <div className="onsite" role="status" aria-label="Loading the selling day"><span className="admin-skeleton is-hero" /><span className="admin-skeleton is-panel" /></div>;
  return <div className="onsite onsite-day">
    <div className="onsite-head">
      <button type="button" className="admin-link onsite-back" onClick={() => onDayChange(null)}><Icon name="left" size={16} />All days</button>
      <div className="onsite-head-row">
        <h1>{detail.day.place}</h1>
        {detail.day.status === "open" ? <span className="admin-pill is-live">Selling</span> : <span className="admin-pill">Closed</span>}
      </div>
      <p className="onsite-tally"><b className="admin-figure">{money(totals.cents)}</b><span>{dayName(detail.day.day, { weekday: "short", day: "numeric", month: "short" })} · {totals.count} sale{totals.count === 1 ? "" : "s"} · {totals.bottles} bottle{totals.bottles === 1 ? "" : "s"}</span></p>
      <div className="admin-segmented onsite-views" role="group" aria-label="Selling day view">
        <button type="button" aria-pressed={view === "record"} onClick={() => setView("record")}>Record</button>
        <button type="button" aria-pressed={view === "review"} onClick={() => { setView("review"); setRecorded(null); }}>Review the day</button>
      </div>
    </div>

    {view === "record" ? <form className="onsite-record" onSubmit={record}>
      <p className="onsite-recorded" role="status">{recorded && <><Icon name="check" /><span>Recorded {recorded.text}</span><button type="button" className="admin-link" disabled={busy} onClick={() => removeSale(recorded.id, recorded.text)}><Icon name="undo" size={16} />Undo</button></>}</p>
      <ScentPicker name="record-scent" value={draft.slug} onChange={(slug) => setDraft({ ...draft, slug })} />
      <div className="onsite-qp">
        <div><span className="onsite-field-label" id="record-quantity">Quantity</span><Quantity value={draft.quantity} onChange={(quantity) => setDraft({ ...draft, quantity })} /></div>
        <label className="onsite-price"><span className="onsite-field-label">Price each (HK$)</span><input className="admin-figure" inputMode="decimal" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="0" aria-invalid={draft.price !== "" && draftPrice === null} /></label>
      </div>
      {quickPrices.length > 0 && <div className="onsite-quick" role="group" aria-label="Recent prices">{quickPrices.map((price) => <button key={price} type="button" aria-pressed={draftPrice === price} onClick={() => setDraft({ ...draft, price: amount(price) })} className="admin-figure">{amount(price)}</button>)}</div>}
      <MethodPicker name="record-method" value={draft.method} onChange={(method) => setDraft({ ...draft, method })} />
      <div className="onsite-cta">
        {recordError && <p className="admin-error" role="alert">{recordError} Your entry is kept; tap Record again.</p>}
        <button className="admin-primary onsite-record-button" disabled={busy || !canRecord}>
          <span>{!draft.slug ? "Choose a scent" : !draft.method ? "Choose how they paid" : draftPrice === null ? "Enter the price" : busy ? "Saving…" : "Record sale"}</span>
          {canRecord && <b className="admin-figure">{money(draft.quantity * draftPrice!)}</b>}
        </button>
        <button type="button" className="admin-link onsite-done" onClick={() => { setView("review"); setRecorded(null); }}>Done selling · review the day</button>
      </div>
    </form> : <div className="onsite-review">
      <section className="admin-panel onsite-summary" aria-label="Day summary">
        <p className="onsite-summary-total"><b className="admin-figure">{money(totals.cents)}</b><span>{totals.bottles} bottle{totals.bottles === 1 ? "" : "s"} · {totals.count} sale{totals.count === 1 ? "" : "s"}</span></p>
        {totals.cents > 0 && <><div className="onsite-split" aria-hidden="true">{totals.byMethod.map(([method, value], index) => <i key={method} className={`is-${index}`} style={{ width: `${value / totals.cents * 100}%` }} />)}</div>
          <ul className="onsite-split-legend">{totals.byMethod.map(([method, value], index) => <li key={method}><i className={`is-${index}`} aria-hidden="true" />{methodName[method]} <b className="admin-figure">{money(value)}</b></li>)}</ul></>}
      </section>
      {!detail.sales.length ? <p className="admin-empty">No sales recorded for this day.</p> : <ul className="onsite-sales">{detail.sales.map((sale) => editing?.id === sale.id ? <li key={sale.id} className="is-editing">
        <form onSubmit={saveEdit} className="admin-form">
          <ScentPicker name={`edit-scent-${sale.id}`} value={editing.slug} onChange={(slug) => setEditing({ ...editing, slug })} />
          <div className="onsite-qp">
            <div><span className="onsite-field-label">Quantity</span><Quantity value={editing.quantity} onChange={(quantity) => setEditing({ ...editing, quantity })} /></div>
            <label className="onsite-price"><span className="onsite-field-label">Price each (HK$)</span><input className="admin-figure" inputMode="decimal" required pattern="\d{1,6}(\.\d{1,2})?" value={editing.price} onChange={(event) => setEditing({ ...editing, price: event.target.value })} /></label>
          </div>
          <MethodPicker name={`edit-method-${sale.id}`} value={editing.method} onChange={(method) => setEditing({ ...editing, method })} />
          <div className="onsite-edit-actions">
            <button type="button" className="admin-link is-danger" disabled={busy} onClick={() => { if (window.confirm("Delete this sale?")) removeSale(sale.id, `${scentName(sale.slug)} × ${sale.quantity}`); }}>Delete sale</button>
            <button type="button" className="admin-link" onClick={() => setEditing(null)}>Cancel</button>
            <button className="admin-primary" disabled={busy || cents(editing.price) === null}>Save sale</button>
          </div>
        </form>
      </li> : <li key={sale.id}>
        <button type="button" className="onsite-sale" onClick={() => setEditing({ id: sale.id, slug: sale.slug, quantity: sale.quantity, price: amount(sale.unit_price_cents), method: sale.payment_method })} aria-label={`Edit ${scentName(sale.slug)} × ${sale.quantity}, ${money(sale.quantity * sale.unit_price_cents)}`}>
          <img src={scentImage(sale.slug)} alt="" width="44" height="44" />
          <span>{scentName(sale.slug)} × {sale.quantity}<small>{methodName[sale.payment_method]} · {new Intl.DateTimeFormat("en-HK", { timeStyle: "short", timeZone: "Asia/Hong_Kong" }).format(sale.created_at)}</small></span>
          <span className="admin-figure">{money(sale.quantity * sale.unit_price_cents)}<small>{money(sale.unit_price_cents)} each</small></span>
        </button>
      </li>)}</ul>}
      <button type="button" className="admin-link onsite-add" onClick={() => setView("record")}><Icon name="plus" size={16} />Add a missed sale</button>
      <form className="admin-panel admin-form onsite-close" onSubmit={(event) => { event.preventDefault(); saveDay("closed"); }}>
        <h2>Day details</h2>
        <label>Place or event<input value={dayForm.place} required maxLength={120} onChange={(event) => setDayForm({ ...dayForm, place: event.target.value })} /></label>
        <div className="onsite-start-row">
          <label>Date<input type="date" required value={dayForm.day} onChange={(event) => setDayForm({ ...dayForm, day: event.target.value })} /></label>
          <label>Stall fee <span>(HK$)</span><input inputMode="decimal" pattern="\d{1,6}(\.\d{1,2})?" placeholder="0" value={dayForm.stall} onChange={(event) => setDayForm({ ...dayForm, stall: event.target.value })} /></label>
        </div>
        <p className="onsite-kept"><span>Kept after stall fee</span><b className="admin-figure">{money(totals.cents - (cents(dayForm.stall) ?? 0))}</b></p>
        <div className="onsite-edit-actions">
          {!detail.sales.length && <button type="button" className="admin-link is-danger" disabled={busy} onClick={() => { if (window.confirm("Delete this empty selling day?")) perform(async () => { await request("onsite-day-delete", { id: detail.day.id }); notify("Selling day deleted."); onDayChange(null); }); }}>Delete day</button>}
          {detail.day.status === "closed" ? <button type="button" className="admin-link" disabled={busy} onClick={() => saveDay("open")}>Reopen to sell</button> : null}
          <button className="admin-primary" disabled={busy}>{detail.day.status === "closed" ? "Save changes" : "Save and close the day"}</button>
        </div>
      </form>
    </div>}
  </div>;
}

/* ---------------- Settings ---------------- */

type Notify = { digest_enabled: number; digest_time: string; digest_email: string | null; default_email: string | null; last_sent_day: string | null; last_run_at: number | null; last_count: number | null; last_error: string | null; unseen: number };

function NotifyCard({ busy, perform, notify }: PanelProps) {
  const [data, setData] = useState<Notify | null>(null), [form, setForm] = useState({ enabled: true, time: "19:00", email: "" });
  const load = (next: Notify) => { setData(next); setForm({ enabled: next.digest_enabled === 1, time: next.digest_time, email: next.digest_email ?? "" }); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { perform(async () => load(await request<Notify>("notify-settings"))); }, []);
  if (!data) return <section className="admin-card"><span className="admin-skeleton is-line" /><span className="admin-skeleton is-line is-short" /></section>;
  const to = form.email.trim() || data.default_email || "no address";
  const last = data.last_run_at ? `Last checked ${date(data.last_run_at)}: ${data.last_count ? `${data.last_count} unopened order${data.last_count === 1 ? "" : "s"}${data.last_error ? "" : ", email sent"}` : "nothing new, no email needed"}.` : "Not run yet.";
  return <form className="admin-card admin-form settings-notify" onSubmit={(event) => { event.preventDefault(); perform(async () => { load(await request<Notify>("notify-settings", { enabled: form.enabled, time: form.time, email: form.email })); notify("Order email settings saved."); }); }}>
    <div className="settings-card-head"><span className="settings-icon"><Icon name="bell" /></span><div><h2>Daily new-order email</h2><p className="admin-muted">Once a day, if paid orders are waiting that Natasha hasn't opened in the admin, an email lists them. Opening an order counts as seen.</p></div></div>
    <label className="admin-toggle"><input type="checkbox" role="switch" checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /><span>{form.enabled ? "On" : "Off"}</span></label>
    <div className="settings-grid">
      <label>Send at (Hong Kong time)<input type="time" required value={form.time} disabled={!form.enabled} onChange={(event) => setForm({ ...form, time: event.target.value })} /></label>
      <label>Send to<input type="email" maxLength={254} value={form.email} placeholder={data.default_email ?? "you@example.com"} disabled={!form.enabled} onChange={(event) => setForm({ ...form, email: event.target.value })} /><span className="admin-hint">Blank uses {data.default_email ?? "the forwarding address"}</span></label>
    </div>
    <p className="settings-status"><span className={`admin-pill is-${data.unseen ? "info" : "neutral"}`}>{data.unseen} not seen now</span><span className="admin-muted">{last}</span>{data.last_error && <span className="admin-pill is-bad">{data.last_error}</span>}</p>
    <div className="settings-actions">
      <button className="admin-primary" disabled={busy}>Save</button>
      <button type="button" className="admin-secondary" disabled={busy} onClick={() => perform(async () => { const sent = await request<{ count: number }>("notify-test", {}); notify(`Test email sent to ${to}${sent.count ? ` listing ${sent.count} order${sent.count === 1 ? "" : "s"}` : ""}.`); })}><Icon name="mail" />Send a test now</button>
    </div>
  </form>;
}

export function SettingsPanel({ busy, perform, notify }: PanelProps) {
  const [data, setData] = useState<{ current: Rate; history: Rate[] } | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { perform(async () => setData(await request("settings"))); }, []);
  const percent = (bp: number | null) => bp === null ? "" : String(bp / 100);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = new FormData(event.currentTarget);
    perform(async () => {
      setData(await request("settings-save", { airwallexPercent: String(fields.get("airwallex") ?? "").trim(), airwallexFixed: String(fields.get("fixed") ?? "").trim(), partnerPercent: String(fields.get("partner") ?? "").trim(), from: fields.get("from") }));
      notify("Rates saved. Money uses them from the date you chose.");
    });
  }
  const describe = (rate: Rate) => `${rate.airwallex_bp === null ? "Airwallex not set" : `Airwallex ${rate.airwallex_bp / 100}%${rate.airwallex_fixed_cents ? ` + ${money(rate.airwallex_fixed_cents)}` : ""}`} · CJ ${rate.partner_bp / 100}%`;
  return <div className="settings">
    <div className="admin-page-head"><div><h1>Settings</h1><p>Order emails and the rates Money uses.</p></div></div>
    <NotifyCard busy={busy} perform={perform} notify={notify} />
    {!data ? <section className="admin-card"><span className="admin-skeleton is-line" /><span className="admin-skeleton is-line is-short" /></section> : <>
      <form className="admin-card admin-form settings-form" onSubmit={save} key={data.history.length}>
        <div className="settings-card-head"><span className="settings-icon"><Icon name="chart" /></span><div><h2>Fees and shares</h2><p className="admin-muted">Money estimates each online order's costs from these. Copy the Airwallex numbers from your Airwallex pricing page.</p></div></div>
        <div className="settings-grid">
          <label>Airwallex fee (%)<input name="airwallex" inputMode="decimal" pattern="\d{1,2}(\.\d{1,2})?" defaultValue={percent(data.current.airwallex_bp)} placeholder="Not set" /></label>
          <label>Plus per payment (HK$)<input name="fixed" inputMode="decimal" pattern="\d{1,6}(\.\d{1,2})?" defaultValue={amount(data.current.airwallex_fixed_cents || null)} placeholder="0" /></label>
          <label>CJ share (%)<input name="partner" inputMode="decimal" required pattern="\d{1,2}(\.\d{1,2})?" defaultValue={percent(data.current.partner_bp)} /></label>
          <label>Applies from<input name="from" type="date" required defaultValue={hkToday()} /></label>
        </div>
        <p className="admin-muted">Orders paid before this date keep their earlier rate. Leave the Airwallex fee blank if you don't have it yet.</p>
        <button className="admin-primary" disabled={busy}>Save rates</button>
      </form>
      <h2 className="settings-history-title">Rate history</h2>
      <ol className="settings-history">{data.history.map((rate, index) => <li key={index}><span>{rate.effective_from ? `From ${dayName(new Date(rate.effective_from + 8 * 3600_000).toISOString().slice(0, 10), { day: "numeric", month: "short", year: "numeric" })}` : "From the start"}</span><span>{describe(rate)}</span><small>{rate.created_by === "migration" ? "Initial setting" : `${rate.created_by} · ${date(rate.created_at!)}`}</small></li>)}</ol>
    </>}
  </div>;
}

/* ---------------- Voucher cards ---------------- */

export const voucherValue = (voucher: Pick<Voucher, "kind" | "amount">) => voucher.kind === "percent" ? `${voucher.amount}% off` : `${money(voucher.amount)} off`;
export function voucherTerms(voucher: Pick<Voucher, "min_subtotal_cents" | "max_uses" | "expires_at">) {
  return [voucher.min_subtotal_cents ? `Min. spend ${money(voucher.min_subtotal_cents)}` : null, voucher.max_uses === 1 ? "One use" : voucher.max_uses ? `${voucher.max_uses} uses` : null,
    voucher.expires_at ? `Until ${new Intl.DateTimeFormat("en-HK", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Hong_Kong" }).format(voucher.expires_at)}` : null].filter(Boolean).join(" · ");
}

export function VoucherSheet({ vouchers, onClose }: { vouchers: Voucher[]; onClose: () => void }) {
  return <section className="voucher-sheet" aria-labelledby="voucher-sheet-heading">
    <div className="admin-section-heading voucher-sheet-head">
      <div><h2 id="voucher-sheet-heading">Print {vouchers.length} voucher card{vouchers.length === 1 ? "" : "s"}</h2><p>Eight cards fit on each A4 page. Cut along the dashed lines.</p></div>
      <div className="voucher-sheet-actions"><button type="button" className="admin-primary" onClick={() => window.print()}><Icon name="print" />Print cards</button><button type="button" className="admin-link" onClick={onClose}><Icon name="close" size={16} />Close</button></div>
    </div>
    <div className="voucher-cards">{vouchers.map((voucher) => <article key={voucher.code} className="voucher-card">
      <header><img src="/brand-emblem.svg" alt="" width="22" height="34" /><span>YAT.LIFESTYLE</span></header>
      <p className="voucher-card-value">{voucherValue(voucher)}</p>
      <p className="voucher-card-terms">{voucherTerms(voucher) || "Online orders in Hong Kong"}</p>
      <div className="voucher-card-foot">
        <div><span className="voucher-card-label">Code</span><b className="voucher-card-code">{voucher.code}</b><span className="voucher-card-site">Enter at checkout on yatlifestyle.com</span></div>
        <StyledQr value="https://yatlifestyle.com" size={74} color="#292a24" />
      </div>
    </article>)}</div>
  </section>;
}
