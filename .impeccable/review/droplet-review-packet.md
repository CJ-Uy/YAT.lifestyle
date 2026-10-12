# Fresh homepage restoration review

Root: C:/Users/charl/Documents/GitHub/YAT.lifestyle. Artifact: http://localhost:3000/#top, app/storefront.tsx mounts app/droplet-journey.tsx; app/storefront.css scopes the cinematic override. Current screenshots are real IAB viewport JPEGs, reopened and visually checked. No full-page capture is submitted.

## Authority and scope

Latest user rejection, which outranks the previous store review: “No but I wanted to keep the home screen's unique droplet animation and feeling”. Earlier the owner wanted lighter readable surfaces, all twelve scents, HK$228 for one 10 mL perfume with blue gift box and artificial decorative flowers, on-site shopping, and Element hidden until later. Restore the actual original 48-frame scroll-scrub drop and logo finish; preserve all shopping functions. This is a fresh full review of the changed homepage and shopping entry, not a verdict pass on the previous fixes. Do not resurrect old coming-soon or Element promotion.

Direction contract: .impeccable/briefs/storefront.md. Original retained implementation/reference: app/home-experience.tsx and lib/story-motion.ts. .impeccable/mocks/home-a.png is a historic critique reference for cinematic identity, not an exact reproduction mandate. It includes deferred content that must stay hidden. No new concept comp was approved. Retained film, silhouette, taper repair, morph and logo geometry are reused, not substituted.

Current homepage first view: original time/place/you headline, golden filmed drop and Hong Kong atmosphere, warm charcoal #24231f, cream text, ivory sticky store navigation. Price/inclusion and direct Shop fragrances remain visible throughout the journey; See the fragrances bypasses the story. Five panels use the tested original timeline; current tea, flower and wood stories replace obsolete collection promotion. Native scrolling, no scroll interception. Below: ivory collection, real gift package, Hong Kong/about text and both owner portraits. Three original official photographs remain present. Element has no home/footer/shop navigation entry.

## Required capture matrix

All paths relative to .impeccable/review/. Sizes below are requested and DOM-confirmed CSS viewports. Native IAB output raster sizes differ: desktop 1265×712, mobile 375×812, actual-user 765×855. Files were saved directly, without local resizing. Review these as bridge-scaled viewport captures, not pixel-exact comp reproductions.

- droplet-home-desktop.jpg — 1280×720 opening, English.
- droplet-home-mobile.jpg — 390×844 opening, English.
- droplet-home-user-780.jpg — actual user viewport 780×871 opening, English.
- droplet-story-desktop.jpg — 1280×720 scrubbed warm woods scene.
- droplet-story-mobile.jpg — 390×844 scrubbed tea scene.
- droplet-logo-desktop.jpg — 1280×720 completed YAT logo, computed logoReveal=1, filmOpacity=0.
- droplet-logo-mobile.jpg — 390×844 completed YAT logo, same computed values.
- droplet-static-mobile.jpg — 390×844 reduced motion opening.
- droplet-home-hant-mobile.jpg — 390×844 Traditional Chinese opening.
- droplet-about-desktop.jpg — 1280×720 About copy + both original photographs; trailing top of preceding gift section and lower section padding are visible.
- droplet-about-mobile.jpg — 390×844 About heading/copy; photographs extend below viewport (section is taller than one viewport).
- droplet-about-photos-mobile.jpg — 390×844 supplementary About photo pair + trailing copy/footer, not a first viewport.

These names were overwritten after confirming correct content; earlier mistimed hash-scroll captures were discarded. First batch found pause control could unmount after auto-scroll when only shown on hero. Single fix keeps it mounted throughout the moving journey, removes unused activePanel React state, and maintains reduced-motion absence. Confirmation batch shows Pause → aria-pressed true and Resume → false.

## Behaviour and verification

- Real scroll changed film frames (screens show hanging, separated and falling drop), scene opacity and later vector/letter reveal. Existing motion tests prove monotonic tracking, complementary film/vector opacity, taper bounds and complete landing.
- Shop link clicked from restored journey reaches /shop; actual DOM has 12 product cards and zero /element links. No order/charge occurred.
- Reduced-motion preference emulated and then cleared: journey and stage both 768px at 390×844, spacers display:none, hero opacity=1, pause count=0; shopping fully visible. No image-frame preload in this mode.
- At mobile and actual user viewport: no horizontal overflow. Computed stage bg rgb(36,35,31); body bg rgb(247,243,235). Price/shop remain inside viewport at every captured scene. Chinese complete at same size.
- Pause/resume verified in actual browser. Code cancels rAF and idling for hidden tab; draw exits offscreen. Hidden/offscreen lifecycle reviewed in source; no cross-browser device or GPU profiling was run.
- Existing 84 tests passed, typecheck passed and production build passed. lib/story-motion.ts and shared shop/cart/checkout business logic unchanged. Prior full shopping tests remain evidence for unchanged controls, not a new test of production payment.
- Detector ran once for this restoration: droplet-detector.json has 35 advisory findings, zero primary findings (exit0). Mostly documented type ramp/color drift in shared store CSS. Pending current homepage token documentation is expected after review. Do not run a second detector.
- No new raster was generated or replaced; retained asset provenance persists. No dependency, production infrastructure or payment changes.

## Review contract

Read C:/Users/charl/.agents/skills/impeccable/reference/craft-floor.md. Judge against this request, direction contract, code, current captures and detector. Current DESIGN.md / MOTION.md still describe the now-replaced plain photo hero; documentation will be updated by the separate documenter after the last correction. This is not authority to reject the owner-directed return of the droplet.

QUALITY BAR: unique recognizable droplet feeling is restored in actual behaviour; readable warm-charcoal first view; immediate familiar shopping; twelve products/price/package truth; Element hidden; stable controls; reduced-motion complete; mobile and actual-user viewport coverage. Original SVG letter/drop geometry is brand/animation geometry, not a new illustrative scene.

Return five contract sections, including disposition word ship/fix/rebuild/recapture, findings, direction/quality assessment, evidence coverage/limits and handoff. Write .impeccable/review/droplet-finish-review.md. No browser; inspect captures with local image tools. No implementation changes. Do not extend scope into unrelated Element or store changes.

Graph evidence Tier2 source-fallback: yat-lifestyle fast index ready40nodes48edges, generation2026-09-22T13:55:10Z. Search HomeExperience/storyMotion/dropTipGeometry returned0 has_morefalse. Graphify positive HomeExperience68, storyMotion15/dropTipGeometry7; bounded output41nodes truncated2. Coverage old/new journey, globals, storefront, store CSS/page/header/helper/brief/docs all no_recorded_issue but not_tracked (globals/page metadata_changed); no reported parse gaps, not freshness proof. Parent read exact renderer, helper, CSS, callers. Current Graphify AST update pending completion. Use exact sources, do not claim MCP is fresh.
