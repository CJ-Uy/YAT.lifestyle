# YAT.lifestyle

Perfume storefront and Hong Kong checkout implementation. The App Router project uses React and
TypeScript through vinext, which builds to the Cloudflare Worker
`yat-lifestyle-prod` in A66454385@gmail.com's account
(`28aa5d214ab31fc266ffde3ba169711d`). The live site is
[yatlifestyle.com](https://yatlifestyle.com), also served at
[www.yatlifestyle.com](https://www.yatlifestyle.com).

The repository includes home, a twelve-scent catalogue, individual products,
cart, email verification, Hong Kong address review and Airwallex hosted checkout
in English, Traditional Chinese and Simplified Chinese. Each offer is HK$228 for
10 mL perfume, a blue gift box and artificial decorative flowers. Proposed home
delivery is HK$30, with dispatch within 1–1.5 weeks and expected receipt within
two weeks; alcohol-perfume courier acceptance remains pending.

The cart persists locally. Checkout now requires an email code and stores a
server-priced order, contact/address details and immutable item/totals snapshot
in D1 before opening payment. A signed payment notification or provider
reconciliation confirms payment; a browser return alone does not. The main site,
admin and incoming-email Worker are deployed, with live checks recorded below.
The real HKD hosted payment page has been opened and inspected; no charge or
refund was performed. Paid-order confirmation, receipt and settlement still
require the owner's live payment test.
Element, the hackathon scent-study line, is archived on the `element-hackathon` branch and is not part of production.
Remake it on that branch when the product returns.

The Worker uses D1 (`yat-lifestyle-prod-db`,
`7526a59a-6ad8-4ede-ba74-5ed18c51c47c`) for newsletter signups and commerce.
Its Element tables (migrations `0002`–`0005`) still hold the hackathon demo data. R2 (`yat-lifestyle-prod-assets`) stores
private files. Email Sending and rate limiters support the newsletter and
checkout. Additive migrations `0006`–`0009` provide email verification, orders and
vouchers, admin sessions/fulfillment history, and the incoming inbox. Private R2
objects preserve original incoming emails and attachments. Remote migrations
`0001`–`0009` have been applied. The approved Airwallex webhook was created for
four payment events, and its signing secret was stored privately in Cloudflare.

## Commerce, admin and inbox

Checkout prices products and Hong Kong delivery on the server, validates voucher
eligibility/capacity, and separates sandbox from production payment events. Paid
production orders receive transactional confirmations through the configured
email sender. Pending provider payments retain their voucher reservation until a
confirmed cancellation. Staff can explicitly cancel an unpaid order; the server
reconciles the provider state and refuses paid or uncertain payments.

The admin is scoped to `admin.yatlifestyle.com` (localhost is allowed for review).
It has server-verified username/password sign-in, an eight-hour secure session,
and protected order, voucher, inbox and delivery-planning APIs. Orders expose an
audited make/pack/dispatch workflow with courier/tracking details. Configure
`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` as private
server credentials. Cloudflare Access and MFA are a later owner setup step;
neither is claimed complete here. A stock ledger and business accounts remain
outside this implementation.

The incoming-email Worker accepts `hello`, `care` and `orders` at
`yatlifestyle.com`. It stores a bounded plain-text preview in D1 and the original
email, including attachments, in private R2 before accepting the message. The
authenticated Inbox provides the original-email download and a forwarding
switch. Forwarding defaults on to `A66454385@gmail.com`, but requires that
destination to be verified in Cloudflare. Until verification succeeds,
forwarding can show a failure while the stored inbox and archive still receive
messages. All three incoming routes are active; the owner intentionally deferred
Gmail verification. A real checkout verification email was received in the
private admin Inbox and its original-email archive was retrieved successfully.

Initial deployment checks on 12 October 2026 recorded main Worker version
`b4e07779-f885-497e-9ecf-796736be88c3` and inbox Worker version
`d87348a8-37fb-4ac1-96eb-ad85cb6e66ee`:

- Shop and the admin page returned 200; authenticated orders, vouchers, inbox and
  settings also returned 200.
- Anonymous admin access and unverified-email order creation returned 401;
  admin API access on the main-site host returned 403.
- A one-perfume quote returned HK$258 (HK$228 plus HK$30 delivery).
- The real checkout code was received in the private admin Inbox, its raw archive
  fetched, and the code verified. Verification-proof status was checked and reuse
  of the consumed code was blocked.
- The real HKD hosted payment page listed Visa, Mastercard, American Express,
  UnionPay, Google Pay, AlipayHK, FPS, WeChat Pay, Alipay and Airwallex Pay. Apple
  Pay is account-enabled but untested on a compatible device; PayMe and Octopus
  are not enabled. Listing a method does not verify a successful charge with it.
- A single-use HK$10 test voucher reduced the quote from HK$258 to HK$248. The UI
  stored the order in admin and reserved one use. Its untouched
  `REQUIRES_PAYMENT_METHOD` intent was cancelled through the authenticated admin
  API; reserved/redeemed counts returned to 0/0. The test voucher was then disabled
  and a subsequent quote using it was rejected with 422.
- Airwallex recorded the real `payment_intent.cancelled` webhook delivery as
  `Succeeded`, confirming that the deployed app accepted that provider event.

The final main Worker deployment succeeded as
`69f7d660-a82f-4add-8197-bf7669f15cfd`, including the support-email privacy
disclosure, voucher contrast fix and `fflate` patch. All 146/146 tests, TypeScript
and the production build passed. Scanning 87 public build files found no configured
private credentials. Post-deployment live checks again returned the expected
200/401/403 responses.

No charge or refund was performed; paid-order confirmation, receipt and settlement
still need the owner's live payment test. Compatible-device Apple Pay, Gmail
forwarding verification, an accepted alcohol-perfume carrier route and owner-managed
Cloudflare Access/MFA remain pending.

Dependency audit updates and the `fflate@0.7.5` override fixed the addressed
advisory. The audit is not clear: a `braces@3.0.3` finding through build glob
tooling remains, with no patched registry version available at the 12 October
2026 check.

The October 10, 2026 account migration preserved all nine database tables, all 18
R2 objects and all 71 vectors; rows, object checksums and metadata, and vector
values were compared between accounts. The original CJ-Uy database, bucket and
index remain as rollback copies. Its Worker now redirects to the live domain so
new requests use the destination database. These rollback copies do not receive
new data. The previous Worker version was
`325d85b9-f4d7-4142-a780-082beb13b3bb`. Local migration backups and verification
records are in ignored `.tmp/cloudflare-migration/`; they contain private data and
must not be committed or published.

## Newsletter and privacy

`/shop` collects email addresses with separate, unchecked marketing consent and
privacy acknowledgement. `/privacy` contains the collection statement and starter
privacy policy in all three languages. Records include language, consent wording,
policy version, timestamp, source and `unverified` status. Addresses are normalized
and unique; duplicates do not overwrite consent or reactivate withdrawn signups.
There is no public list/export endpoint. No email is sent by this feature.

Remote migrations through `0009` are applied. For a new development database or
future migrations, use:

```powershell
npx wrangler d1 migrations apply yat-lifestyle-prod-db --local
npx wrangler d1 migrations apply yat-lifestyle-prod-db --remote
```

`POST /api/newsletter` requires a same-origin JSON request, a valid address,
supported language, both consent flags and the current policy version. It bounds
the request to 4 KB, uses parameterized SQL, and returns the same success response
for new/duplicate addresses. It never logs submitted addresses. A honeypot and a
Cloudflare rate limiter (10 attempts per minute per IP per location, namespace
92624001) reduce simple abuse. This is not bot-proof or a global quota; shared IPs
may be temporarily limited. Add Turnstile if abuse becomes material.

Owner checklist before collecting real signups:

- Monitor the admin Inbox for `hello@yatlifestyle.com` privacy and opt-out requests;
  verify the optional Gmail destination before relying on forwarded copies.
- Review `/privacy` against your actual legal identity, providers, retention and
  practices. It is a starter policy, not a guarantee of legal compliance.
- Restrict Cloudflare account/database access to authorised people. Do not paste
  subscriber lists into chat, logs, source control or public files.

Before sending any campaigns, connect a mailing provider, verify address ownership
(double opt-in is recommended), support an unsubscribe link in every message,
review stale signups and update the policy for that provider. Never treat the
current `unverified` rows as a verified mailing list.

Privacy requests are handled manually by the owner through the monitored inbox.
For opt-out, verify the requester's address, set that row's status to
`unsubscribed`, and minimise other fields no longer needed. Keep the address only
where needed to honour suppression. For deletion, remove the exact verified row
and any copies held by mail providers, subject to justified legal retention.
Never export a list merely to process one person's request. Review retained data
before every campaign. Changes to consent require a new version in
`lib/newsletter.ts`; preserve historical wording in Git and existing rows.

## Contact email setup

The site publishes these `mailto:` links at the owner's request. The deployed
incoming Worker and private admin inbox cover `hello`, `care` and `orders`, with
all three receiving routes active. A real verification message was received in
the stored Inbox and its original archive downloaded. Optional Gmail destination
verification and brand-address replies remain separate checks.

| Address | Placement |
| --- | --- |
| hello@yatlifestyle.com | Home and Shop footers, general inquiries |
| care@yatlifestyle.com | Shop, customer care |
| orders@yatlifestyle.com | Shop, order and delivery questions |
| element@yatlifestyle.com | Element collection, personalization inquiries |
| press@yatlifestyle.com | About, media and collaborations |

Before relying on them, send a message from an external account to each address,
confirm stored receipt and forwarding, and confirm you can reply using the same
brand address. `element` and `press` need separate provider/alias configuration.
The admin has no reply composer. Gmail forwarding awaits destination verification;
checkout codes and paid-order receipts use the configured sending service.

## Development scripts

- `npm run dev` starts the vinext dev server.
- `npm run build` builds the Cloudflare Worker output.
- `npm run start` starts the built Worker locally with Wrangler.
- `npm run deploy` deploys the Cloudflare Worker.
- `npm test` runs offline storefront, newsletter, checkout, commerce, admin and inbox checks.
- `npm run higgsfield:video -- "prompt"` generates a design video with Seedance 2.0.

## Higgsfield Seedance 2.0

Set `HF_CREDENTIALS` in `.env.local` to your `key-id:key-secret`. Enter it only
in that local file; never paste it into chat or commit it.

Generate with the documented defaults (5 seconds, 720p, 16:9, audio):

```powershell
npm run higgsfield:video -- "A cinematic tracking shot along a sunlit coastal road"
```

Optional flags are `--duration=4..15`, `--resolution=480p|720p|1080p|4k`,
`--aspect-ratio=16:9|4:3|1:1|3:4|9:16|21:9`, `--no-audio`, and `--force`.
Completed request metadata is stored in ignored `.higgsfield/requests/`; an
identical prompt and settings reuse the completed request unless `--force` is set.
The request ID is saved before polling, so rerunning the same command can resume
an interrupted request. `--force` sends a new billable request.

The current homepage restores 48 small WebP frames derived from a silent Higgsfield
Seedance 2.0 video in `public/media/`. Native scrolling controls the falling drop and its
handoff to the retained gold-gradient vector drop inside the SVG YAT mark. It reveals the actual
blue gift box first, then Natasha's portrait and HKUST Biotechnology student/founder story,
then the perfume in hand for everyday use before the YAT finale. The warm-charcoal
journey keeps HK$228, package inclusion and Shop fragrances visible throughout, beneath
the ivory shopping navigation. Its minimal opening reads “Time. Place. You.”; larger real
photographs, brief captions and a ruled shopping rail with a gold-outline action carry the story.
Reduced motion shows a complete static poster opening,
collapses the long story and preloads no frames. Ambient light is static, with no
Pause/Resume control. The original `HomeExperience` composition
is archived on the `element-hackathon` branch; `StoreHome` now mounts `DropletJourney` with
the original renderer geometry and motion helpers. No new raster was made for the restoration.
The ivory sections retain real three-bottle and gift-box photographs in Gift, and the evening/in-hand
pair in About. The catalogue renders twelve built-in imagegen scent still lifes (1,147,194 WebP bytes
total) with exact prompts in adjacent `.webp.json` files. Opening/Heart/Dry-down
guidance is explicitly inferred draft copy, not a validated wear-time claim.
Site visitors never
call the Higgsfield API; credentials are only used by the local generation script.

Design context lives in `PRODUCT.md`, `DESIGN.md`, and `.impeccable/`.
