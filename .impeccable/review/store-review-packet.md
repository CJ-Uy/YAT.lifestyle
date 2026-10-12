# Storefront finish review packet

Project: `C:/Users/charl/Documents/GitHub/YAT.lifestyle`. Live local preview: `http://localhost:3000/`.

## Request and authority

Build the main site from the meeting plan with all twelve perfumes, each a 10 mL bottle plus blue gift box and artificial decorative flowers for HK$228. Use deep Mobbin research and Impeccable. Make it distinctive but familiar and functional. The owner subsequently requested realistic dramatic bottle images illustrating each scent, opening/heart/dry-down guidance, a lighter interface because very dark surfaces are hard to use, and Motion Framework animations.

Confirmed: Hong Kong launch only; HK$30 home delivery is proposed; dispatch within 1–1.5 weeks and expected receipt within two weeks. Alcohol-perfume courier acceptance remains unresolved. High Tea and 6am use 8.6 mL alcohol, not water. White uses lily of the valley; Ocean uses sea salt and orchid. Quiet/Pure/White may use any of the three available cap colours; imagery uses black/silver/gold. Their cap colours are creative image choices, not a customer-selectable variant. Airwallex setup exists privately but no live payment or order action is enabled in this preview. Cloudflare production resources are unchanged.

Direction authority: `.impeccable/briefs/storefront.md`, `MAIN-SITE-PLAN.md`, `DESIGN-RESEARCH.md`, `FRAGRANCE-COPY.md`, `MOTION.md`. Code-led extension/replacement of ordinary shopping surfaces; no approved comp governs this build. The old coming-soon home comp and `.impeccable/home-build-brief.md` are superseded for these routes. Preserve Element's existing world.

## Quality bar

Warm ivory reading surfaces with charcoal type, bronze details, sharp edges and the existing Bodoni Moda face. Real bottle-in-hand photograph introduces HK$228 and the 10 mL flower gift box. Distinct scent imagery carries atmosphere. Familiar catalogue filters, readable product details, persistent bag, quantity/removal, a clear Hong Kong guest checkout preview, actionable field errors and an explicit no-charge/no-order confirmation. Three languages and complete reduced-motion content. Stage guidance is visibly draft inference, with no fabricated wear-time claims. No private recipes, invoices, credentials or meeting transcript published.

Review the full bounded ordinary storefront: `/`, `/shop`, `/shop/midnight` as representative product layout, `/bag`, `/checkout`, `/order`, including draft notes and actual packaging. All twelve product images exist. Other Element routes are outside visual review scope.

## Evidence and required screenshots

All paths below are relative to `.impeccable/review/` and are required. These are actual browser viewport JPEGs, reopened visually after capture. The browser bridge's full-page output repeated/cropped regions, so full-page captures were discarded and are NOT evidence. Desktop captures use 1280 or 1661 CSS px (fresh catalogue 1661); mobile uses 390×844 CSS px, with scrollbar pixels reducing captured content width. Viewport sections are named by their actual visible content.

- `store-home-desktop.jpg`, `store-home-mobile.jpg`
- `store-catalogue-desktop.jpg`, `store-catalogue-mobile.jpg`
- `store-product-desktop.jpg`, `store-product-mobile.jpg`
- `store-notes-desktop.jpg`, `store-notes-mobile.jpg`
- `store-product-hant-mobile.jpg`, `store-notes-hant-mobile.jpg`
- `store-bag-desktop.jpg`, `store-bag-mobile.jpg`
- `store-checkout-desktop.jpg`, `store-checkout-mobile.jpg`
- `store-confirmation-desktop.jpg`, `store-confirmation-mobile.jpg`
- `store-gift-desktop.jpg`

Current source: `app/storefront.tsx`, `app/storefront.css`, `app/site-header.tsx`, `app/layout.tsx`, `app/shop/shop-experience.tsx`, `app/shop/[slug]/product-experience.tsx`, `app/shop/cart.ts`, `app/bag/bag-experience.tsx`, `app/checkout/checkout-experience.tsx`, `app/order/order-experience.tsx`, `lib/shop.ts`, `lib/scent-notes.ts`. Image assets and exact-prompt provenance: `public/media/scents/` (twelve optimized WebPs, about 1.1 MB total). Real delivered package: `public/media/yat-official-gift-box.webp`.

## Existing checks and limitations

Detector ran once: `store-detector.json`, 73 advisory findings and zero primary findings; advisories primarily compare this authorized light storefront/type scale against incumbent dark DESIGN.md. No second detector is owed. Documentation handoff will record the scoped light storefront variant while preserving Element and legacy art.

Tests 84/84, TypeScript and production build passed. Final production build must include the last image batch, completed after the earlier build. Browser checks passed: all twelve cards; tea/green filter returns eight; rapid filter selection; add-to-bag; quantity and money totals; remove and empty state; required/phone field errors; Hong Kong address review/edit; non-charging confirmation; Traditional Chinese product and note stages. Reduced-motion emulation confirmed hero animation none, clip none, opacity one. Browser temporary viewport/preferences reset after checks. Native Safari/Firefox and real payment/fulfillment were not tested.

Graph evidence: Tier 2, MCP project `yat-lifestyle`, root matches; fast generation `2026-09-22T13:55:10Z` is stale (40 nodes/48 edges). Home symbol lookup was positive, new source lookups insufficient; no new-flow call paths/snippets available. Parent coverage checks cover every source path above, no recorded gaps but freshness not_tracked/metadata_changed. Direct source fallback was performed for operated sources. Graphify AST graph updated after code changes (1402 nodes/2256 edges). Reviewer must read exact current source for claims, qualify graph limitations, and check coverage for newly relied-on source if MCP is available.

Craft floor: `C:/Users/charl/.agents/skills/impeccable/reference/craft-floor.md`.

Write boundary: review report only under `.impeccable/review/`; do not edit application, assets, DESIGN.md, private files or production resources. You are not alone in the codebase. Do not revert others' edits. Return the full finish review contract and one disposition: recapture, rebuild, fix, or ship. Material fixes must be concrete and bounded. No browser access is expected; judge supplied screenshots and source.
