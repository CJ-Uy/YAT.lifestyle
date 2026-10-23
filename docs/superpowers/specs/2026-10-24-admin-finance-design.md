# Admin finance, onsite selling and printable vouchers

Date: 24 October 2026. Agreed in a brainstorm with CJ; mockups in `.superpowers/brainstorm/20063-1792788734/content/finance-v4.html`.

## Why

Natasha runs YAT.LIFESTYLE from the private admin at admin.yatlifestyle.com. She sells online (Airwallex checkout, HK$258 gift box, free Hong Kong delivery) and in person at markets and pop-ups, where prices change by place and day. She needs one place that tells her what she sold and what she keeps, logs onsite sales quickly on her phone, tracks the 5% she owes CJ, and produces printable voucher cards.

## Goals

- **Money page** for a month, year or custom range (Hong Kong time):
  - Month total at the top: online kept + onsite kept, with the change from the previous period.
  - A composition bar showing where gross sales went: onsite kept, online kept, shipping, stall fees, CJ share, Airwallex.
  - **Online**: paid live orders only (`status = 'paid' AND mode = 'prod'`, dated by `paid_at`). Daily bar chart, then sales minus shipping she paid, CJ 5% and estimated Airwallex fees, down to online kept. A warning lists dispatched orders without a shipping cost.
  - **Onsite**: one row per selling day (place, date, bottles, total) minus stall fees, down to onsite kept.
  - **Owed to CJ**: 5% of what customers paid (order `total_cents`, after vouchers, before Airwallex) for each Hong Kong calendar month. Paid monthly; she marks a month paid, which snapshots the amount.
  - CSV download: one row per sale (online order line and onsite sale) for the range.
- **Onsite selling** (phone first): start a day (place, date, optional usual price) → record sales (scent thumbnail, quantity, price each, payment method; each tap saves immediately, with undo) → review the day (edit or delete any sale, add a missed one, stall fee) → save and close. Days can be reopened to correct.
- **Shipping cost at dispatch**: the Dispatched step requires the cost she paid the courier. On the first move to Dispatched the customer receives a "your order has shipped" email from orders@yatlifestyle.com in the order's language, with courier, tracking number and items.
- **Settings**: Airwallex percentage plus fixed fee per payment, and the CJ share (default 5%). Changes apply from the moment they are saved, so earlier months keep their numbers.
- **Vouchers**: the existing single-code form, plus batch generation (count, optional prefix, % or HK$ amount, minimum spend, uses per code, expiry), a live "HK$258 → HK$X at checkout" preview, and a printable A4 sheet of cards. Each card carries the site's dropper emblem and wordmark, the discount, the code, terms, `yatlifestyle.com` and a QR code to the site.
- One visual language across admin: the ivory/charcoal/bronze admin palette, Bodoni for words, the device UI sans with tabular figures for every money amount.

## Non-goals

- Restocking purchases, ingredient/bottle cost of goods, general expenses (planned later).
- Exact Airwallex fees from the Airwallex API; the set rate is an estimate and is labelled "est.".
- Offline queueing of onsite sales; a failed save keeps the form filled with an error.
- Chinese translations of the admin itself (customer email is trilingual).
- Changing the storefront or checkout.

## Anti-goals

- Counting sandbox, unpaid, failed or cancelled orders as sales.
- Recomputing past orders from today's constants: online amounts come from stored order snapshots.
- Invented figures: no Airwallex rate is assumed; until it is set, the fee row says "Set rate".

## Decisions

- Data (migration `0011_admin_finance.sql`):
  - `admin_rates` rows with `effective_from`; each order uses the latest rate at its `paid_at`.
  - `admin_partner_payouts(month PK 'YYYY-MM', amount_cents, paid_at, paid_by)`.
  - `admin_onsite_days` and `admin_onsite_sales`. Sale ids are client-generated UUIDs, so a retried save is idempotent.
  - `admin_order_fulfillment` gains `shipping_cents` (nullable for earlier orders) and `shipped_email_at`.
  - `commerce_vouchers` gains `batch` to group a printed set.
- Fees and shares are computed per order in integer cents, rounded half up: `round(total × bp / 10000) + fixed`.
- Onsite payment methods are a fixed list: Cash, FPS, PayMe, Octopus, Card, Other.
- Batch codes use an unambiguous alphabet (no 0/O/1/I/L), 8 characters after an optional prefix, and are inserted with `ON CONFLICT DO NOTHING`.
- Server code lives in `lib/admin-finance.server.ts`. It is routed from `handleAdmin`, behind the same session, host and same-origin checks.
- The QR on printed cards points to `https://yatlifestyle.com`. The code is typed at checkout as today.

## Builder's calls (marked)

- Money is the admin's first tab and default view. Onsite follows.
- Year view charts by month. Month and custom ranges chart by day.
- The shipped email is sent once and is not resent when tracking is edited later.
