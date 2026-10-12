# Main-shop design research

12 October 2026. Planning research for YAT.lifestyle's move from a brand introduction to a working Hong Kong perfume shop. No storefront UI or deployment changed in this pass.

## Research scope

Used **Mobbin deep screen search** for catalogue, product detail, bag and checkout references, followed by targeted brand queries, two purchase-related flow searches and a fragrance-homepage section search. Inspected the returned images, not just their app labels. The nine searches returned thirteen screen previews, six representative flow frames and two section previews. The two eight-screen flows were sampled at the returned first/middle/last frames; this is not a claim to have inspected every flow frame or tested those websites.

Mobbin did not return a dedicated Selfridges perfume product page for the targeted query. A query naming Glossier's shop returned adjacent retail references rather than a Glossier product grid. The Glossier **fragrance section** was a relevant direct-category result. The selected shopping references below are explicitly adjacent-category patterns where appropriate, not proof of fragrance-specific conversion performance.

No external brand artwork, customer reviews, promotions or product images should ship on YAT. Canonical Mobbin links are retained for review; expiring image URLs and low-resolution previews are not embedded as site assets.

## Selected references and decisions

| Reference inspected | Visible evidence | Decision for YAT |
| --- | --- | --- |
| [Glossier fragrance section](https://mobbin.com/sites/sections/7903112e-f24c-4d2f-8ba8-c3cef9511fa2) | Large editorial media beside a short fragrance introduction and a visible Shop now action; ordinary navigation remains available | Let real photography create atmosphere while a direct **Shop fragrances** action stays visible. YAT has no verified customer review to place beside it. |
| [Hims product row](https://mobbin.com/screens/502a37d5-2047-439a-893b-60190dde51e4) | Consistent product image areas, name, price, concise explanatory text and a per-product action | Give twelve fragrances consistent card anatomy: name, scent subtitle, 10 mL, confirmed price and availability. Keep useful words under the image. This is a skincare pattern, not a fragrance claim. |
| [ZARA catalogue](https://mobbin.com/screens/00bd84df-22f3-48a3-b4e1-abbd3ee0376a) | Four products align in a sparse row, with names and prices below photographs; collection links and bag are visible | Use a regular catalogue rhythm and recognizable bag location. YAT needs larger readable descriptions and clearer functional labels than this sparse fashion example. |
| [Squarespace product preview](https://mobbin.com/screens/af8753ac-577d-437e-bdea-21aeb1e047b1) | A large image sits beside product name, price, description, quantity and Add to cart | Use this familiar relationship for product detail. This is a template preview, not evidence that its placeholder copy or discount is appropriate. |
| [lululemon detail section](https://mobbin.com/screens/179d770e-d943-4f08-bffa-edbdec695e52) | Product title and Add to bag remain in the upper bar while large photos and material details occupy the page | Keep the purchase context accessible while customers read scent and packaging information. On mobile, a compact action can remain available without covering content or controls. |
| [Selfridges add-to-bag flow](https://mobbin.com/flows/f341b17e-6ea6-45c0-94f2-5b56f4f370ee) | Sampled frames show image-led detail, explicit option availability, then Item added to bag feedback and a View bag action | Confirm additions immediately, update the bag count, and provide a clear route to the bag. A fixed 10 mL YAT offer does not need this apparel size chooser. Show real stock; never invent scarcity. |
| [Uvodo bag](https://mobbin.com/screens/800bf175-4c86-4a33-8807-37fb05bcccfe) | Product thumbnail, quantity adjustment, removal, totals and a prominent Checkout button | Use a straightforward bag page. Surface the delivery policy before checkout; show the actual charge once the address/service is known. No need for a complex drawer at launch. |
| [Selfridges checkout](https://mobbin.com/screens/c6bc2671-2208-4e7a-a8e6-4d9be8b82a3a) | Delivery, Payment and Order confirmation are named steps; editable order summary is alongside them | Make the process legible and retain an editable summary. Offer only YAT's approved delivery option and verified payment methods. |
| [Selfridges billing-address flow](https://mobbin.com/flows/d5915a98-21c2-448c-9aa6-9cb3b812a91f) | Sampled frames show a missing-address message, an address form in a side panel and a saved address back in payment | Preserve entered information and allow corrections before payment. Adapt the address fields to Hong Kong; do not inherit compulsory US state/ZIP fields or unnecessary courtesy titles. |

Other matches were not strong enough to guide the main flow: a wholesale quantity selector, a wholesale image-gallery flyer, a recipe ingredient list, a generic SaaS section, a subscription-heavy treatment page and a broad curatorial marketplace. Finding a screen is not a reason to borrow its structure.

## Impeccable context and visual authority

Read the installed Impeccable skill and its planning references. Ran its context loader once against `app/home-experience.tsx`, and read the persisted home surface brief for `app/page.tsx`. Product context now reflects the owner's recipes, real photographs, Hong Kong delivery and payment intent.

The established system is **Afterimage Hong Kong**: carbon black, warm white, restrained gold, Bodoni display type, plain body text, square edges and fine rules. Element has its own white/slate laboratory interface. Retain that identity while letting real product and gift-box photography become the main shop's evidence.

The persisted home brief describes a read-only coming-soon film. Its shopping assumptions are superseded by the owner's current request. Its useful constraints remain: immediate comprehension, navigation that bypasses the story, readable HTML, ordinary scrolling, all three languages, and reduced-motion access. This planning pass does not replace DESIGN.md, rewrite the old brief or claim that its old comp has approved the new shop.

Use **Persuade** for home/product storytelling and **Operate** for bag, checkout and private fulfillment. The latter need calm, familiar controls and clear status more than spectacle.

The source review found three immediate gaps: shared navigation exposes Home and Element without a shopping entry; the cinematic home experience does not give the ordinary perfumes a visible first-screen shopping action; `/shop` is a coming-soon newsletter surface. The main change is therefore the shopper's route through actual products and purchasing, in addition to visual refinement. Existing locale persistence, focus conventions and newsletter states provide useful patterns to preserve. This is a source-based planning synthesis, not a formal scored critique or measured accessibility audit.

## Proposed experience

### Home: the actual product first

Keep the carbon/ink frame and warm-white text. Use the supplied in-hand photograph as the primary product evidence, with a readable introduction, a visible Shop fragrances action and a short package statement. The bottle must remain visible at each crop; never put body copy over its label or the person's face.

Sequence: product introduction → a small fragrance selection → the actual blue gift box → concise Hong Kong/laboratory story → Element entry → delivery/help/footer. The evening photograph belongs in the story portion; the three-bottle photo explains the cap finishes. The longer droplet film becomes an optional story route rather than the route to shopping.

A light paper passage can carry scent comparison or packaging within the existing palette. It should feel like the same brand, with the same type hierarchy and control language. Navy belongs to the photographed gift box; a new navy UI theme is not required.

### Catalogue: choose by smell

Start with **All fragrances**. Use a small set of overlapping scent-family filters: Tea & green, Woody, Fruity, Floral, Musky. A fragrance can belong to more than one family. These are descriptive browsing tags, not measurements.

Each product tile repeats the same information order: image → name → plain scent subtitle → size/package → price/availability. Public audience label is Unisex. Keep tentative theme names and gender leanings out of navigation until they make a real choice easier.

Use a regular grid on desktop and a readable two-column grid on typical phones, with a single-column fallback at narrow widths or enlarged text. Cards link to a full product page; users do not need to complete a quiz. Any quick-add behavior must make the chosen fragrance unambiguous.

### Product: confidence before action

Desktop: image gallery alongside the product purchase panel. Mobile: concise name/subtitle, product image, price/package and Add to bag, followed by notes and deeper details. Keep the image-first desktop composition from turning into a phone screen that hides the purchase action below a long gallery.

Gallery order: correct bottle/cap → scent context → in-hand scale → actual included gift box. The approved photos establish brand and package truth, but individual front-facing SKU images still need the correct geometry and cap finish. Do not recolor a silver cap into an unconfirmed product or infer missing cap colors.

Use **Key notes** and **How it smells**, drawn from `FRAGRANCE-COPY.md`. A readable accord list is enough. No radar score, percentage bars, tested note pyramid, longevity scale or bestseller badge is justified by the supplied formulas.

### Bag and checkout: a short, editable path

Product → Bag → Hong Kong delivery/contact → Review total → Airwallex payment → Order status.

The bag shows each fragrance, quantity, unit price, subtotal and package. Delivery charge and total must be clear before opening payment. Keep the transaction in HKD. Guest purchase is the launch default; an account is not a prerequisite.

After Add to bag, show the selected fragrance and quantity in an accessible status message, update the bag count and offer View bag. Keep the product page in place. The bag page permits quantity/removal and explains an empty bag with a return to fragrances.

Contact/address fields use visible labels, understandable Hong Kong fields, appropriate mobile keyboards and field-level errors. Preserve the customer's entries when correcting an error or returning from payment. Marketing consent is separate and optional. Airwallex hosts card entry; the YAT site retains order/delivery context.

Order status reads verified server state. It can show Confirming payment, Paid, Payment incomplete, or a recoverable error with an appropriate action. A redirect is not payment confirmation. Tracking follows actual dispatch.

## Material states for implementation

| Area | States that must be designed and checked |
| --- | --- |
| Catalogue | All twelve; filtered results; no matching results with clear reset; unavailable product; long English and Chinese names |
| Product | In stock; unavailable; invalid quantity; adding; added; add failure with retry; image loading/failure |
| Bag | Empty; one item; several scents; quantity limits; item unavailable or price changed with explicit review |
| Delivery | Valid HK address; missing/invalid contact; unavailable delivery area; fee not yet confirmed; preserved edits |
| Payment | Opening payment; successful provider-confirmed order; pending verification; canceled/failed/expired; retry after ambiguous response; paid customer who closed the browser |
| Order/admin | Private order retrieval; no access; missing order; loading failure; paid make/pack queue; dispatched with actual tracking |

These are future acceptance criteria, not measured results from the current read-only site.

## Quality requirements from the review

- On the first screen, a new visitor can identify perfume, the real product and the shopping action. Story animation never delays navigation or purchasing.
- Functional labels, price, package and scent distinctions remain ordinary readable text. The actual bottle and package provide the visual distinction.
- Names and notes carry product differences in addition to cap color. Stock, selection, errors and focus are visible without color alone.
- Three languages have the same useful information and actions. Chinese line breaks and text enlargement are checked on actual layouts.
- Keyboard order follows the document; focus is visible. Dialogs, if introduced, manage focus and return it on dismissal. Touch controls have comfortable target sizes; sticky UI does not obscure fields or help.
- Motion supports meaning and respects reduced motion. The original film/media is secondary to a fast, readable shop; product images reserve their layout space and load appropriately.
- Messages name the problem and recovery. Failed network or payment checks do not erase a bag, address or paid order.

No new accessibility/performance score is asserted. Contrast, keyboard behavior, screen-reader output, responsive layouts, media loading and purchase behavior need verification on the actual implementation.

## Recommended next build scope

One boxed 10 mL offer per scent, twelve-item catalogue, consistent product pages, a simple bag, Hong Kong guest checkout with Airwallex, verified order status and protected fulfillment. Use the existing locale/header/newsletter patterns and the requested Cloudflare account.

Keep the visual choices grounded in the real photos and incumbent brand. Before build, finalize price/stock, correct bottle and cap references, delivery acceptance/charge/timing, policies/contact details and admin access. International delivery remains private planning material.

Research result: use editorial photography to make YAT recognizable, and use conventional shopping controls to make it easy to buy. This document informs `MAIN-SITE-PLAN.md`; it is not a production UI, a benchmark conversion study or a completed accessibility audit.
