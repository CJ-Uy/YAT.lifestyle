# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

YAT.lifestyle initially serves Hong Kong residents, primarily adolescents and adults interested in perfume, local stories, and distinctive personal scents.

## Product Purpose

YAT.lifestyle is a Hong Kong perfume brand founded by Natasha, an HKUST Biotechnology student who wanted to combine a love of laboratory work with perfume. The owner supplied Natasha's name, student/founder story and portrait identity. The website should introduce the brand, make its early fragrance lines understandable, and establish trust in its blend of scent, place, time, and scientific practice.

## Positioning

YAT.lifestyle connects perfumery with genuine laboratory curiosity. Its most distinctive planned offer is a scientific line in which a customer provides a scent sample, the brand studies that customer's smell profile, and an existing base scent the customer likes is fine-tuned to suit that profile.

## Operating Context

The brand is at an early stage with three planned fragrance directions:

- A first series organized around times of day, such as 6 a.m. and 12 noon.
- A second series inspired by Hong Kong tea, forests, places, and nostalgia.
- A scientific personalization line based on customer samples, laboratory analysis, and refinement of an existing base scent.

The current deployed build is an ordinary perfume storefront with a twelve-scent catalogue, product pages, persistent cart and live Hong Kong guest checkout in three languages. Checkout requires an emailed verification code, reviews a server-priced order and opens Airwallex's hosted HKD payment page. The server records a pending/unpaid order before creating a payment intent; an order becomes paid only after provider verification. Natasha's password/session-protected admin provides orders, fulfillment updates, vouchers, inbox, optional forwarding and private delivery planning notes. The owner has deferred Element until later: preserve its existing routes and implementation, but provide no public entry from the ordinary shop.

The owner-confirmed offer is HK$258 for each 10 mL perfume with the blue gift box and artificial decorative flowers shown in the supplied package photograph. There is no bottle-only option. Hong Kong home delivery is free (changed 24 October 2026 from HK$228 plus HK$30 delivery), with expected receipt within two weeks; courier acceptance of the alcohol-based finished product remains pending. Airwallex handles live payments. China and international delivery belong in private admin planning notes until appropriate carriage and costs are confirmed.

## Capabilities and Constraints

- The ordinary catalogue contains twelve perfumes, each offered as the same 10 mL gift presentation at HK$258 with free Hong Kong delivery.
- The site must explain the difference between the three fragrance directions without implying that every line is already available.
- Scientific language must remain accurate and must not invent precision, efficacy, testing methods, or personalization outcomes that have not been established.
- The scientific personalization line is named `Element`, referring to customers being “in their element.”
- `Time` and `HK Life` are working names for the time-of-day and Hong Kong-inspired lines; stronger final names may replace them.
- The owner has supplied twelve fragrance names and recipes: Midnight, Golden, Forest, Dark, Sunday, Freshly, Ocean, Quiet, Pure, White, High Tea, and 6am. Use these names with understandable scent subtitles; launch stock and final collection themes remain open.
- HK$258 with free Hong Kong delivery and the gift presentation are confirmed. Courier acceptance, final delivery terms, returns, launch stock/timing and Element's consultation process remain open. Live payment capability does not establish carrier acceptance or fulfillment readiness. Element is deferred and retains a separate design and implementation.
- Cart contents persist locally, with at most ten of each scent and thirty gift boxes total. Guest contact/address details remain in page memory during editing and are never stored in localStorage; they are sent to the server and stored in D1 when payment is initiated. Email-verification proof and order access use HttpOnly cookies, Secure in production. Prices, vouchers and totals are validated on the server. Newsletter consent remains a separate existing feature.
- Payment-return URLs do not establish payment success. Provider-verified paid production orders trigger confirmation receipts; unpaid, failed, cancelled and sandbox states remain distinct.
- Incoming email originals, including attachments, are retained privately in R2; D1 stores bounded message text, envelope/subject metadata and attachment names. Authenticated admin supports original-message download and optional forwarding. Credentials, customer data and private delivery research do not belong in public documentation.
- Launch content should be available in English, Traditional Chinese, and Simplified Chinese.
- Guest checkout communicates Hong Kong-only delivery before address review, requires email verification and separates reviewing an order from continuing to payment.

## Brand Commitments

- Brand name: YAT.lifestyle.
- Tagline: “Where science meets scent.”
- A dropper should be central to the identity because it connects perfume with the founder's laboratory background.
- Black, white, and gold or yellow remain the house's identity vocabulary. The owner explicitly retained the homepage's unique golden droplet animation and feeling: its native-scroll film and YAT signature finish use cream type on warm charcoal, with immediate shopping actions and a complete static reduced-motion opening. The drop first reveals the actual gift box, then Natasha's HKUST Biotechnology student/founder story, then everyday perfume use. The owner's premium black, white and gold direction continues through warm charcoal, soft white shopping and restrained gold/bronze accents. The previously approved lighter reading surfaces remain because dark reading surfaces were difficult to use. Element's existing white/slate world and original gold artwork remain separate.
- The current logo and brand board are exploratory references, not approved final identity assets.
- The owner requested more luxury and uniqueness through minimalism and less homepage text. Let the original drop, large real photographs and short captions carry the story, while keeping price, package, founder facts and shopping controls clear. This homepage refinement does not remove catalogue guidance or checkout requirements.

## Evidence on Hand

- `C:/Users/charl/Downloads/ChatGPT Image Sep 22, 2026, 10_10_59 PM.png`: exploratory dropper logo concept.
- `C:/Users/charl/Downloads/ChatGPT Image Sep 22, 2026, 10_10_34 PM.png`: exploratory brand-board concept with logo applications, palette, typography, photography, and messaging ideas.
- On 12 October 2026 the owner supplied three official product/lifestyle photographs, a bottle dimension guide, twelve recipes, internal supplier screenshots, and the real blue gift-box package photograph. Optimized photo derivatives are recorded in `public/media/asset-manifest.md`. Preserve the photographed bottle and branding; dimensions and supplier screenshots are internal references.
- High Tea and 6am were corrected in writing to 1.4 mL fragrance blend plus 8.6 mL alcohol, totaling 10 mL (14%/86%), with no water. The owner confirmed Ocean uses CS Sea Salt and Orchid and White uses TDB Lily of the Valley (鈴蘭 / 铃兰). Quiet, Pure and White may use any of the available caps; their black/silver/gold image caps are creative choices, not customer-selectable variants. The neroli/jasmine supplier alias still needs confirmation. Do not present an inferred note pyramid, measured longevity, natural ingredient content or brand affiliations as verified product facts.
- `FRAGRANCE-COPY.md` contains key-note and overall-smell drafts in all three languages, researched from official supplier descriptions. Product pages show a three-tier Opening, Heart and Dry-down diagram for all twelve scents in all three languages; it is visibly labelled as draft inference pending maker confirmation on the finished perfume. No wear-time claim is made. All twelve are offered as unisex. The home scent finder combines a visual family compass and Fresh–Warm preference to rank three actual catalogue matches; repeated shared price, format and unisex tags are consolidated above the results rather than repeated on every card.
- Twelve built-in imagegen scent still lifes are optimized WebPs in `public/media/scents/`, with exact-prompt JSON provenance beside every image and localized alt text describing their AI scent interpretation. They illustrate accords rather than documentary ingredients or delivered packaging; there is no separate AI-caption paragraph in the customer flow. All three real official photographs render: three bottles in the gift section and the evening/in-hand pair in the origin/About section, alongside the actual gift-box photograph. The restored 48-frame droplet journey reuses the existing gift-box, owner-confirmed Natasha portrait and in-hand photographs in that order before the YAT finish. It retains native-scroll film and atmosphere, with no Pause/Play ambient control or additional ambient animation.
- Airwallex's account-scoped Payment Acceptance credentials and deployed server secrets remain private. Live hosted checkout has been opened in HKD. Session checks covered receipt of a real verification email, authenticated admin/inbox original download, verification proof and rejected code replay. The hosted page exposed Visa, Mastercard, American Express, UnionPay, Google Pay, AlipayHK, FPS and WeChat Pay, plus Alipay and Airwallex Pay. Apple Pay is enabled but untested on a supported device; PayMe and Octopus are not enabled. These checks did not charge or refund a payment.
- A one-use HK$10 voucher changed HK$258 to HK$248 in the live flow. Its pending order reserved capacity; admin cancellation of the untouched payment intent was confirmed by the provider and a successfully delivered real cancellation webhook, releasing the reservation. The test voucher was then deactivated. Gmail forwarding verification was intentionally skipped by the owner; Cloudflare Access is deferred.
- No final house logo, testimonials or scientific process evidence has been provided. Future work must not fabricate them. `MAIN-SITE-PLAN.md` records completed storefront work and remaining launch work; private meeting, payment and delivery research is held in ignored `.tmp/main-site-review/`.

## Product Principles

- Make the meeting of laboratory craft and perfumery tangible without making unsupported scientific claims.
- Express Hong Kong through specific sensory memories rather than generic city imagery.
- Give a small launch catalogue depth through story, ritual, and clear distinctions between each fragrance direction.
- Use luxury as restraint and precision, not decoration alone.
- Keep unlaunched concepts visibly distinct from products that customers can actually obtain.
- Make all three launch languages equally usable rather than treating Chinese as decorative translation.
- `DESIGN-RESEARCH.md` records Mobbin reference decisions and the Impeccable planning review for the ordinary shop. `DESIGN.md` records the approved light shopping variant of Afterimage Hong Kong, preserving Element and legacy media. Make scent choice, payment state and unresolved delivery constraints clear.
