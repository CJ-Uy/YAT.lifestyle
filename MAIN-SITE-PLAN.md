# YAT.lifestyle main-site plan

Updated 12 October 2026. This is the concrete plan from the meeting, supplied product material and the owner's written corrections. The storefront, checkout, protected admin and incoming-inbox Worker are deployed. A real verification email, its private archive, the HKD hosted payment page, a test voucher and unpaid cancellation/webhook delivery have been checked. No charge or refund was performed; a completed paid order, receipt and settlement still require the owner's live payment test.

## Current completion status

Built: the real-photo home, all twelve HK$228 gift offers, scent-family catalogue filters, individual product pages, a persistent cart, required email-code verification, Hong Kong address validation/review/edit, server-priced orders and Airwallex hosted checkout. English, Traditional Chinese and Simplified Chinese cover the shopping surfaces. Twelve built-in imagegen WebPs illustrate the scents, with exact-prompt provenance; real in-hand, evening and blue-package photographs anchor product truth. Opening/Heart/Dry-down stages are visible draft inferences pending maker confirmation, without wear-time claims.

Checkout stores the contact/address and immutable product/price/delivery snapshot in D1 before opening payment. Signed notifications and provider reconciliation determine paid status; the browser return does not. The protected admin includes orders, vouchers, an incoming inbox and delivery planning notes. Original incoming email and attachments are archived privately, with optional Gmail forwarding pending destination verification. Remote migrations `0001`–`0009` are applied; the approved Airwallex webhook now subscribes to four payment events and its signing secret is stored privately in Cloudflare. Local automated checks pass, with the verified live checks below. The owner has deferred Element until later; its routes, implementation and artwork are preserved, with no entry from the ordinary storefront. `DESIGN.md` records the owner-approved ivory/charcoal/bronze variant alongside the separate Element and retained legacy systems.

Initial live checks on 12 October recorded main Worker version `b4e07779-f885-497e-9ecf-796736be88c3` and inbox Worker version `d87348a8-37fb-4ac1-96eb-ad85cb6e66ee`. Shop/admin pages and authenticated orders/vouchers/inbox/settings returned 200. Anonymous admin and unverified-email order creation returned 401; the main-site host refused admin APIs with 403. A one-perfume quote was HK$258. All three incoming routes are active. A real verification-code message was received in the private admin Inbox, its raw archive retrieved, the code verified and proof status checked; consumed-code replay was blocked.

The final main Worker deployment succeeded as `69f7d660-a82f-4add-8197-bf7669f15cfd`, including the support-email privacy disclosure, voucher contrast fix and `fflate` patch. All 146/146 tests, TypeScript and the production build passed. A scan of 87 public build files found no configured private credentials. Post-deployment live checks again returned the expected 200/401/403 responses.

The real HKD payment page listed Visa, Mastercard, American Express, UnionPay, Google Pay, AlipayHK, FPS, WeChat Pay, Alipay and Airwallex Pay. Apple Pay is enabled in the account but untested on a compatible device; PayMe and Octopus are not enabled. A single-use HK$10 test voucher reduced HK$258 to HK$248, and the UI stored the order with one reserved use. The untouched `REQUIRES_PAYMENT_METHOD` test intent was cancelled through the authenticated admin API; reserved/redeemed counts returned to 0/0. The test voucher was disabled and subsequently rejected with 422. Airwallex reported the real `payment_intent.cancelled` webhook delivery as `Succeeded`, confirming provider-event delivery to the deployed app.

Remaining launch work: an accepted alcohol-perfume carrier route and final delivery terms, launch stock/made-to-order handling, the owner's live payment test for paid confirmation/receipt/settlement, compatible-device Apple Pay, Gmail destination verification, legal/customer-care details and owner-managed Cloudflare Access/MFA. The owner intentionally deferred Gmail verification; the stored admin Inbox works independently. The deployed password gate protects admin independently; Access/MFA is not yet complete.

## Direction and decisions

Make YAT.lifestyle a distinctive, easy-to-use perfume shop: customers can understand the scents, see the actual bottle and package, choose a fragrance, pay, and receive it. Keep the laboratory identity and Hong Kong story, with a direct shopping path visible from the first screen.

- Launch delivery: Hong Kong only.
- Confirmed preview offer: one 10 mL perfume, blue gift box and artificial decorative flowers matching the owner's package photograph, at HK$228. No bottle-only offer is implemented.
- Proposed home delivery: HK$30; dispatch within 1–1.5 weeks and expected receipt within two weeks. These are estimates; courier acceptance of the alcohol-based finished product remains pending.
- Payment provider: the existing YAT.LIFESTYLE Airwallex account.
- Twelve supplied names: Midnight, Golden, Forest, Dark, Sunday, Freshly, Ocean, Quiet, Pure, White, High Tea, and 6am. Launch stock remains to be confirmed.
- High Tea and 6am: corrected to 1.4 mL fragrance blend plus 8.6 mL alcohol = 10 mL, 14%/86%. No water.
- Keep English, Traditional Chinese, and Simplified Chinese fully functional.
- Element is deferred until later, with no entry from the ordinary storefront. Preserve its separate routes and implementation; ordinary perfumes do not inherit its prototype scientific claims or onboarding.

### Gift box versus bottle only

Recommend starting with the gift-box offer. One clearly presented package makes photography, stock, packing, and checkout simpler. It also makes the brand's gift proposition tangible.

A bottle-only option makes sense for repeat purchasers and customers buying for themselves, provided the saving is meaningful. Set its price from measured packaging and fulfillment costs rather than choosing an arbitrary discount. Even without the presentation box, the bottle needs a protective, labeled pack and a considered opening experience; bubble wrap is transit protection.

Price context checked on 12 October: [Jo Malone Hong Kong lists a 9 mL fragrance at HK$200](https://www.jomalone.com.hk/product/25946/74342/colognes/english-pear-freesia-cologne-9ml/9ml). That is a reference point, not proof of YAT's demand or product equivalence. HK$228 with the gift presentation is a plausible offer to test; its viability still depends on actual costs and customer response.

Before enabling the confirmed HK$228 offer for live sales, record perfume/blending, bottle/sprayer/cap, box, flowers, labels, packing material, labor, payment fee, courier subsidy, and damage/replacement allowance. The owner's 5% share discussed in the meeting is an open business term, not an assumed tax or automatic transfer.

## What the meeting actually establishes

The automatic local transcript is retained privately in ignored `.tmp/main-site-review/`. It has not been uploaded. Proper names and some informal scent remarks may be inaccurate; no speaker identification or listening pass was performed.

| Time | Requirement or open discussion | Treatment |
| --- | --- | --- |
| 00:00–01:06 | Identical bottles need distinguishable scent imagery and understandable information; a second notes/stat image is proposed | Use accurate bottle photography with scent-specific art direction and a simple accord graphic. Recipes do not establish a measured top/heart/base pyramid. |
| 03:37–04:42 | Public, stage, beta, and admin environments; private surfaces protected by Cloudflare Access | Admin is scoped to `admin.yatlifestyle.com` with Natasha's server-verified credentials. Owner-managed Access/MFA and any additional review environments remain to be configured. |
| 04:42–09:09 | Orders, production queue, delivery/tracking, support, expenses, offline/cash sales, payouts, reports | Start with the order/fulfillment view needed to sell; expand the private business ledger next. |
| 13:18–13:54; 16:16–16:29 | Bottle dimensions and recipes needed for images/descriptions | Supplied. Preserve the actual bottle shape/branding and check uncertain supplier aliases. |
| 13:58–14:23; 19:39–20:12 | Five possible groups | Proposal only; later discussion reopens whether to group at all. |
| 25:58–26:23; 27:10–28:15 | Themes versus all products, individual products versus sets, other sizes | Open merchandising choices. No bundle or extra bottle size should be assumed. |
| 28:22–28:28 | Review, plan, then build the website | This document is the review and build scope. |

The five proposed themes were High Tea + Quiet; Pure + Freshly; Forest + Ocean; Golden + White + Dark; Midnight + Sunday + 6am. Theme names remain open. Recommend a usable all-fragrances catalogue first, with optional theme storytelling after names are settled. Do not turn these suggestions into compulsory bundles.

## Public experience

### Home

1. First screen: brand, a clear perfume introduction, real product/lifestyle photography, and a visible **Shop fragrances** action. The implemented preview shows the 10 mL gift presentation and HK$228, with Hong Kong delivery and preview limits elsewhere in the flow.
2. A small selection of fragrances leading to the complete catalogue. Use names plus scent subtitles so an evocative name does not have to explain the smell alone.
3. Show the actual gift box and included decorative flowers.
4. Keep a shorter Hong Kong/laboratory story. Element is deferred without a storefront entry. The existing long scroll film is retained as legacy implementation/media; shopping does not require completing it.
5. Delivery/help/returns and monitored contact information.

Use the existing warm white, ink, restrained gold, serif typography, and photographic rhythm. The distinction comes from the real product, honest scent detail, and considered compositions. Shopping controls should use ordinary labels and familiar placement.

`DESIGN-RESEARCH.md` records the deeper Mobbin reference study and Impeccable planning pass. The owner's later request for easier light-surface reading governs the implemented ordinary shop: warm ivory, charcoal and restrained bronze, retaining Bodoni and real product evidence in the first viewport. The carbon/ink/gold legacy and Element's white/slate system remain recorded separately. Selected references inform catalogue hierarchy, product purchase controls, add-to-bag feedback, editable summaries and address correction. Their brand imagery, reviews, promotions and unrelated complexity do not transfer to YAT.

### Navigation and catalogue

Visible ordinary-storefront navigation: **Shop**, **Our story**, language and **Cart**. Element has no ordinary-shop entry. `/shop` remains the catalogue destination, preserving existing inbound links and newsletter anchors; Cart retains `/bag` as its internal route and leads to verified-email checkout.

For twelve fragrances, an all-products grid and a few useful scent-family filters are sufficient. No search engine or quiz is needed for launch. Each entry shows a consistent bottle image, name, scent subtitle, 10 mL size, price, and availability. A cap color is supporting information, not the only way to distinguish products.

### Product detail

Give each fragrance a shareable product address and a consistent layout:

- Actual bottle and scent-specific scene, plus in-hand size and gift-box gallery images.
- Name, concise scent subtitle, plain description, main accords and 10 mL size. Cap colours in imagery are supporting references, not selectable product variants; Quiet/Pure/White can use any available cap.
- Included package and final HKD price; visible delivery charge/timing before payment.
- Quantity, availability, and one clear **Add to cart** action.
- Use/care, verified ingredient/allergen information, delivery and returns, and customer care.

Use a simple accord list and the owner-requested Opening/Heart/Dry-down guidance. The implemented stages are explicitly inferred drafts pending maker confirmation on finished perfumes. Do not present them as a validated pyramid or invent performance scores, longevity, natural ingredient claims, affiliations with supplier “type” brands or historical best-seller badges.

### Draft fragrance descriptions

These are short customer-copy drafts derived from the supplied accords, not a perfumer's validated sensory evaluation. `FRAGRANCE-COPY.md` now contains fuller key-note and overall-smell descriptions for all twelve in English, Traditional Chinese and Simplified Chinese, with official supplier evidence. Recommend all twelve as unisex, with scent-family browsing. Conventional gender leanings are tentative internal positioning notes, not restrictions on who can wear them.

| Fragrance | Plain scent subtitle | Draft description | Cap |
| --- | --- | --- | --- |
| Midnight | Jasmine black tea | Black tea with jasmine and neroli floral accents. | Silver |
| Golden | Peach, pear and freesia | Peach and pear meet a freesia floral accord. | Gold |
| Forest | Sandalwood | A sandalwood-led fragrance with a focused woody character. | Black |
| Dark | Black tea | A black tea fragrance that keeps the tea accord at its center. | Silver |
| Sunday | Pear and freesia | Pear and freesia bring fruit and flowers together in an orchard-inspired scent. | Gold |
| Freshly | Jasmine and mint | Jasmine and mint bring a floral and green character. | Gold |
| Ocean | Sea salt and orchid | An airy marine floral with sea-salt, freesia and green-leaf accents. | Silver |
| Quiet | Green tea and citrus | Green tea layered with a green-tea citrus accord. | Any available; image black |
| Pure | White tea and white musk | White tea and white musk form a soft tea-and-musk pairing. | Any available; image silver |
| White | Lily of the valley and white musk | Green muguet florals softened by powdery white musk. | Any available; image gold |
| High Tea | White tea, woods and flowers | White tea and sandalwood meet white musk, neroli, jasmine, pear and freesia. | Gold |
| 6am | Sandalwood, tea and coastal accords | Sandalwood and white tea with green-tea citrus, white musk, and sea salt-and-orchid accords. | Silver |

The owner confirmed Ocean uses CS Sea Salt and Orchid and White uses TDB Lily of the Valley. Use 鈴蘭 / 铃兰 for White, not 百合. Still confirm Midnight's neroli/jasmine blend identity: the recipe says CW while the invoice identifies CS Neroli & White Jasmine. Supplier screenshots and precise formulation records remain internal.

## Photography prepared

Four optimized real-photo WebP assets are retained in `public/media/`, with original color and framing preserved:

| Asset | Role |
| --- | --- |
| `yat-official-in-hand.webp` | Main product/lifestyle hero and size context |
| `yat-official-three-bottles.webp` | Rendered home gift-section bottle/cap reference |
| `yat-official-evening.webp` | Rendered home origin photograph; person's role is unconfirmed |
| `yat-official-gift-box.webp` | Exact package presentation and included flowers |

Keep the original files untouched. The dimensional reference includes three different geometries; the real slim faceted travel bottle is the image authority. Twelve built-in imagegen still lifes now render as 4:5 scent imagery in home featured cards, catalogue and product pages. Their optimized WebPs total 1,147,194 bytes and each has exact-prompt provenance in `public/media/scents/*.webp.json`. Props illustrate fragrance accords rather than natural ingredient content; the real blue package remains the delivered-presentation reference.

## Payments and order handling

Airwallex is selected. During the earlier owner-approved credential setup, a new account-scoped `yat-lifestyle-checkout-prod` key was created for YAT.LIFESTYLE with Payment Acceptance access, including its provider-grouped read/write/refund permissions. Other finance/treasury permissions were not selected. The key has no IP whitelist; its secret must remain in ignored local configuration or private server secrets, never public source. The existing admin key was not opened or changed. Current live secret and provider configuration checks are separate from that earlier credential approval.

The earlier read-only production authentication and merchant Config API check, filtered to active Hong Kong/HKD one-off payments, returned **card, airwallex_pay, alipaycn, alipayhk, applepay, fps, googlepay and wechatpay**, with pagination complete. The real HKD hosted page subsequently listed Visa/Mastercard/American Express/UnionPay, Google Pay, AlipayHK, FPS, WeChat Pay, Alipay and Airwallex Pay. Apple Pay is account-enabled but awaits a compatible-device check; PayMe/Octopus are not enabled. These checks establish available options, not a successful charge or settlement/fee terms. The approved four-event webhook and private Cloudflare signing secret are configured, and a real cancellation-event delivery succeeded. No charge or refund was performed; paid-order confirmation, receipt and settlement remain untested.

The implemented flow opens Airwallex's established hosted payment page from the site cart and verified-email checkout, then returns to a YAT order-confirmation page. Server requests create/retrieve the payment intent and reconcile its state. It does not depend on early-access Checkout Sessions.

Implemented integration safeguards:

1. Store an order and immutable product/price/delivery snapshot before opening payment. HKD prices, quantity limits, Hong Kong eligibility and voucher totals are validated on the server.
2. Use an account-scoped checkout credential with only the required Payment Acceptance permission. The provider's grouped write permission can include refunds; avoid unrelated transfers, payouts, FX, and finance access. Keep secrets in local ignored development files and Cloudflare secrets, never public code or screenshots.
3. Separate sandbox and production events; the HTTPS endpoint verifies provider signatures and durably deduplicates events. The provider subscription and secret are configured; a real `payment_intent.cancelled` delivery succeeded. Paid-event acceptance still requires the owner's live payment test.
4. Reconcile provider amount/currency/order/status, including repeated and out-of-order updates. A successful browser redirect alone is not proof of payment. Bounded reconciliation also recovers payments when the buyer closes the browser.
5. Keep voucher capacity reserved during uncertain payments. Explicit staff cancellation retrieves provider state first and releases capacity only after confirmed cancellation; paid or pending payments are refused. Stock inventory and refund tooling remain outside this implementation.
6. Save audited make/pack/dispatch status and courier/tracking details. Send transactional confirmations only for paid production orders through the configured sender; marketing consent remains separate.
7. Complete merchant activation, final payment methods/fees, sender/webhook/runtime verification, legal business identity and required website policies, then perform acceptance checks before treating the launch flow as operational.

The earlier credential audit created no payment, refund, payment link or transfer. Screenshots of the selected permissions and final key list, plus the safe readiness report, are retained privately in ignored `.tmp/main-site-review/` without the secret. Subsequent live setup and its acceptance evidence must be recorded separately; the audit is not proof of a successful purchase.

## Private admin and environments

The implemented admin at `admin.yatlifestyle.com` uses server-verified username/password credentials for Natasha and an eight-hour secure, revocable session. Every order, voucher, inbox and delivery-notes API authenticates before accessing data; mutations require same-origin requests. Credentials are private server configuration. The owner will add Cloudflare Access/MFA later; it is not claimed enabled by this password implementation.

Orders include paid/unpaid filters, customer/address detail, an actionable make/pack/dispatch workflow, courier/tracking fields and durable status history. Staff can create/deactivate vouchers and explicitly cancel an unpaid order subject to provider confirmation. No stock ledger, refund console or business accounting is implemented.

The **Delivery planning notes** area exposes an authenticated summary of the research saved privately as `.tmp/main-site-review/DELIVERY-EXPANSION-NOTES.md`. It covers local benchmarks, mainland/international options, acceptance prerequisites, quote assumptions and dates, without enabling additional checkout countries. Hongkong Post excludes alcohol perfume. SF's ordinary published parcel rates are benchmarks only; product/service acceptance needs a written carrier decision and suitable finished-product safety documentation. Published perfume-base percentages are not a verified finished ethanol concentration or flash point. International costs remain quote-dependent, so no usable perfume rate is invented. See the sourced private notes for details.

The **Inbox** stores incoming `hello`, `care` and `orders` messages as plain-text previews and authenticated original-email downloads. Full originals, including attachments, are archived privately before mail acceptance. Forwarding is optional and defaults on to `A66454385@gmail.com`; it requires destination verification. The owner intentionally skipped that verification for now, so forwarding can fail while inbox/archive receipt still works. All three receiving routes are active on the deployed inbox Worker; a real checkout code was received in the private Inbox and its original archive fetched. `element` and `press` need separate alias configuration. There is no reply composer. The public privacy policy discloses support-message storage, administrator access, optional forwarding and retention/deletion requests in all three languages.

The meeting's next admin phase is a small business ledger: offline/cash sales, expenses, payment fees, cash on hand, settlement/payout reconciliation, invoices, monthly reports, and support cases. Keep sale totals, fees, net receipts, cash, and pending settlements distinguishable. Specify any 5% share before calculating it. AI support categorization is optional later work, not a launch dependency.

## Cloudflare and implementation scope

Read-only live audit confirmed account `28aa5d214ab31fc266ffde3ba169711d` belongs to **A66454385@gmail.com's Account**. `yat-lifestyle-prod` serves both main domains. Its current D1, R2, Vectorize, AI, email, asset, and rate-limit bindings are present. There is no relocation to do.

Preserve newsletter and Element data. Additive migrations `0006`–`0009` provide checkout email verification, immutable orders/vouchers/payment reconciliation, admin sessions/fulfillment history and inbox/settings; remote migrations `0001`–`0009` are applied. Private R2 email archives share the existing bucket under their own namespace. Main/admin/inbox deployment, receiving routes and the approved webhook subscription/signing secret are configured, with the remaining acceptance work stated above. Keep private stage/test data isolated from production; no copying real customer data into review environments by default.

Dependency audit updates and the `fflate@0.7.5` override fixed the addressed advisory and are included in deployment `69f7d660-a82f-4add-8197-bf7669f15cfd`. A `braces@3.0.3` finding through build glob tooling remains, with no patched registry version available at the 12 October 2026 check. This is not a clean audit.

Expected source scope when building: homepage and shop experience, product routes/data, scoped home/shop styles, shared navigation, page metadata, checkout/payment endpoints and checks, additive commerce migrations, private admin routes/authorization, deployment configuration for protected environments, and documentation. Preserve the current locale interface, accessible language control, newsletter consent/API, `#newsletter`/source-link compatibility, and inbound Element links.

## Build order and completion checks

1. Confirmed for preview: twelve HK$228 gift offers, Hong Kong-only launch, proposed HK$30 delivery and dispatch/receipt estimates; courier acceptance and production prerequisites remain open.
2. Built and reviewed locally: real-photo homepage, twelve-item catalogue, product details, imagery and translations in the approved light storefront variant.
3. Deployed: persistent cart, required email verification, Hong Kong address validation/review, server-priced durable orders, vouchers, hosted payment integration, signed-notification endpoint and protected fulfillment. Local commerce/admin/inbox tests and TypeScript checks pass; real-code receipt/verification/replay protection, quote/authentication, HKD hosted page, voucher reservation/cancellation/release and cancellation webhook checks pass. A paid order, receipt and settlement still require the owner's live payment test.
4. Deployed: authenticated delivery notes and stored inbox with private original-email downloads and optional forwarding. All three receiving routes are active; real code receipt and archive retrieval are checked. Gmail destination verification is intentionally deferred. Keep ledger/support features for a separate bounded pass.
5. Complete keyboard/mobile/language review, merchant and courier requirements, paid outcomes/retries and signed paid-event delivery, compatible-device Apple Pay, order privacy, paid confirmations and tracking before calling the launch operational. Cloudflare Access/MFA is a later owner setup step. Final deployment `69f7d660-a82f-4add-8197-bf7669f15cfd` and its post-deployment access checks are recorded above.

Open decisions: live launch stock/made-to-order handling, courier acceptance and final delivery terms, returns, final theme names, maker review of scent descriptions and inferred stages, payment fees/settlement terms and tested checkout behavior, business legal/contact details, any additional admin users/review environments and the accounting basis of the discussed share. Natasha's admin hostname and password access are implemented; owner Access/MFA and Gmail verification remain pending. HK$228, twelve products and the gift presentation are established; Quiet/Pure/White may use any available cap.

Deployed now: the storefront, verified-email checkout, server-priced commerce, protected order/voucher/inbox admin, delivery notes, twelve scent drafts and inferred stages in three languages, twelve imagegen still lifes with provenance and four optimized real photos. The earlier meeting/source/Cloudflare audits and approved Airwallex credential/configuration evidence remain available. Local tests and recorded live checks verify real-code receipt/archive/verification/replay protection, the hosted HKD payment page, voucher reservation/cancellation/release and a delivered cancellation event. Final main version `69f7d660-a82f-4add-8197-bf7669f15cfd` passed the recorded test/build/public-file-scan and post-deployment access checks. No charge/refund was performed; paid confirmation, receipt and settlement await the owner's live payment test. Compatible-device Apple Pay, Gmail verification, an accepted carrier route and owner Access/MFA remain pending, and the dependency audit retains the stated build-tool finding.
