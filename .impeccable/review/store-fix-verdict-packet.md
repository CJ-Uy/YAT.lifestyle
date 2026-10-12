# Storefront fix verdict

Score the three material fixes in `store-finish-review.md`. This is a verdict pass, not a new defect hunt.

1. Product identity is now a semantic header before the image. Desktop keeps its image/purchase columns. Mobile uses a complete contained 220 px still life, with identity, HK$228/package, quantity and Add to bag all in the first 390×844 viewport. Browser measurement: enabled Add to bag at y678–734. Exact source: `app/shop/[slug]/product-experience.tsx`, `app/storefront.css`.
2. `app/layout.tsx` no longer defines or emits the direction contract. Development promises are in `.impeccable/briefs/storefront.md`. Browser home DOM confirmed zero `template[data-direction-contract]` nodes.
3. Fresh independent fallback documenter has ownership of PRODUCT.md, DESIGN.md, `.impeccable/design.json`, README.md, MAIN-SITE-PLAN.md status, asset manifest and brief. Root will notify you when these files are ready.

Owner steering after the full review: hide Element until later. Its ordinary header/footer links and home section were removed, while existing routes/artwork remain. Home DOM shows zero Element links. All three original approved photographs now render: in-hand hero, evening About and a compact three-bottle image within the real gift-box section. These explicit scope changes are included in the verdict evidence; no free visual redesign was introduced.

Required fresh captures, overwritten at original review paths:

- `store-product-mobile.jpg`, `store-product-hant-mobile.jpg`: 390×844, with Element hidden.
- `store-product-desktop.jpg`: 1661×943, with Element hidden.
- `store-home-desktop.jpg`: 1280×720; `store-home-mobile.jpg`: 390×844.
- `store-catalogue-desktop.jpg`: 1661×943; `store-catalogue-mobile.jpg`: 390×844.
- `store-gift-desktop.jpg`: now 1661×943 to show the complete real package and third original photograph together.
- `store-notes-desktop.jpg`, `store-notes-mobile.jpg`, `store-notes-hant-mobile.jpg`: recaptured after the mobile fix, before the subsequent Element navigation removal. Content/layout is current; the obsolete Element header entry in these notes captures is not evidence of its present visibility.

Previous bag, checkout and confirmation captures remain evidence of the unchanged task flow, not of the latest header. Current shared header source governs that small removal. No charge or real order action was introduced.

Final checks: 84 tests passed after product/layout fixes; final TypeScript and production build passed after owner steering and third-photo integration. Build contains all twelve WebPs. Provenance scan: twelve scent rasters, zero missing. Graphify AST graph updated to 1416 nodes/2268 edges; MCP fast graph remains stale and exact source is authoritative. No second detector ran. Temporary viewports restored; preview remains running locally. Live payments, perfume courier acceptance and maker approval of draft stages remain outside this preview verdict.
