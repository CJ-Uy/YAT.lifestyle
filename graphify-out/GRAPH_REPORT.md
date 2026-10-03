# Graph Report - YAT.lifestyle  (2026-10-04)

## Corpus Check
- 219 files · ~3,081,016 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1151 nodes · 1806 edges · 103 communities (72 shown, 31 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7aa8c0e7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 102|Community 102]]

## God Nodes (most connected - your core abstractions)
1. `Locale` - 21 edges
2. `useLocale()` - 19 edges
3. `compilerOptions` - 17 edges
4. `handle()` - 16 edges
5. `survey()` - 12 edges
6. `readWarped()` - 12 edges
7. `Family` - 12 edges
8. `read_zone()` - 12 edges
9. `Parallel tracks` - 12 edges
10. `BaseId` - 11 edges

## Surprising Connections (you probably didn't know these)
- `NoteGraph()` --calls--> `displayPercents()`  [EXTRACTED]
  app/element/demo/demo-flow.tsx → lib/element/tune.ts
- `survey()` --calls--> `script()`  [INFERRED]
  lib/element/api.server.ts → app/element/demo/photo-reader.ts
- `POST()` --calls--> `subscribe()`  [EXTRACTED]
  app/api/newsletter/route.ts → lib/newsletter.server.ts
- `derive()` --calls--> `kitKey()`  [EXTRACTED]
  app/element/demo/demo-flow.tsx → lib/element/kit.ts
- `derive()` --calls--> `scoreLadder()`  [EXTRACTED]
  app/element/demo/demo-flow.tsx → lib/element/ladder.ts

## Import Cycles
- None detected.

## Communities (103 total, 31 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (18): ASPECT_RATIOS, authorization(), generateSeedanceVideo(), HiggsfieldResponse, normalizeSeedanceInput(), parseResponse(), pollHiggsfieldRequest(), PollOptions (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (26): BUDGET, digest(), ElementEnv, FAMILIES, FORM_ROUTES, HttpError, JSON_ROUTES, LANGUAGE (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (33): dependencies, @fontsource/bodoni-moda, js-aruco2, qr-code-styling, react, react-dom, react-server-dom-webpack, vinext (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (8): DeliveryPreview(), DELIVERY_AREAS, DeliveryArea, deliveryComplete(), DeliveryState, emptyDelivery, normaliseDelivery(), example

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (10): Asset inventory, Component grammar, Copy rules, Direction, First viewport, Home build brief, Interaction, Page sequence (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (5): Contact email setup, Development scripts, Higgsfield Seedance 2.0, Newsletter and privacy, YAT.lifestyle

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (10): NEWSLETTER_SOURCES, newsletterCopy, NewsletterEnv, response(), subscribe(), POST(), metadata, contactCopy (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (10): Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product, Product Principles (+2 more)

### Community 14 - "Community 14"
Cohesion: 0.18
Nodes (10): Asset inventory, Component grammar, Copy rules, Direction, First viewport, Home build brief, Interaction, Page sequence (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.40
Nodes (4): Approved home composition asset manifest, Build without generated imagery, Produce later as image-native media, Ready now

### Community 17 - "Community 17"
Cohesion: 0.10
Nodes (20): Actions, Collection Frames, Colors, Components, Delivery Preview, Design System: YAT.lifestyle, Do:, Do's and Don'ts (+12 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (46): metadata, NotFound(), ArucoGlobal, detectMarkers(), Detector, loadReader(), pixels(), ReaderImage (+38 more)

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (26): callApi(), deliveryCopy, Action, Answer, AskedQuestion, CiteId, Copy, FAMILIES (+18 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (37): 1. Does any candidate actually "reset" the nose? (efficacy baseline that drives framing), 2. Odor migration risk inside a closed box (coffee, citrus, charcoal) and packaging that prevents it, 3. Shelf life and degradation in HK heat and humidity, 4. Safety, allergy and HK regulatory considerations, 5. Unit cost estimates (100-1,000 kits) and supplier types, 6. Sustainability and premium-feel considerations, 7. Honest copywriting and HK legal framing (Trade Descriptions Ordinance, etc.), Cited Findings (+29 more)

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (20): metadata, CompareView(), copy, LoginView(), Match, MeView(), Profile, SharedView() (+12 more)

### Community 25 - "Community 25"
Cohesion: 0.06
Nodes (55): BASES, compare(), FAMILIES, ALL_NOTES, changeLine(), CLOSING, L, matchingReasons() (+47 more)

### Community 26 - "Community 26"
Cohesion: 0.06
Nodes (31): 1. Discovery and sample set prices in Hong Kong (HKD), 2. Full-size perfume price ranges in Hong Kong, 3. Hong Kong custom perfume-making workshops, 4. Personalized, AI or quiz-based fragrance companies globally (pricing, model, HK shipping), 5. HK and Asian at-home scent test kits, and AI scent players in HK, 6. What makes Element different from each competitor, and pricing implications, Cited Findings, Cited Findings (+23 more)

### Community 27 - "Community 27"
Cohesion: 0.06
Nodes (31): 1. Component cost ranges at 100–1,000 units, 2. Perfume concentrate / small-batch EDP cost per ml; bottle + atomizer + cap, 3. Hong Kong local delivery costs (SF Express, HK Post, Lalamove) and returns, 4. Typical gross margins for indie/niche fragrance and DTC beauty brands, 5. Regulatory and cost implications for selling fragrance/cosmetics in Hong Kong, 6. AI inference cost per customer (vision on 4 photos + ~15-turn LLM survey + tuning brief), Cited Findings, Cited Findings (+23 more)

### Community 28 - "Community 28"
Cohesion: 0.06
Nodes (31): Cited Findings, Cited Findings, Cited Findings, Cited Findings, Cited Findings, Cited Findings, Gaps, Gaps (+23 more)

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (26): 1. How big is the Hong Kong fragrance market, and is it growing?, 2. Hong Kong population aged 18–34, and per-capita spending, 3. Trends: niche, personalization, workshops, sampling, social media, gifting, 4. Global personalized/custom fragrance market (supporting evidence), 5. How consumers choose perfume: in-store testing problems and unworn bottles, Cited Findings, Cited Findings, Cited Findings (+18 more)

### Community 30 - "Community 30"
Cohesion: 0.07
Nodes (26): 1. What professional perfumers and evaluators do between smells, 2. Retail practice: coffee beans and their alternatives, 3. At-home discovery and personalisation kits: do they include a nose reset?, 4. Professional sensory panel practice (food, wine, coffee, odour labs), 5. Commercial "olfactory reset" / "nose cleanser" products and their claims, Cited Findings, Cited Findings, Cited Findings (+18 more)

### Community 31 - "Community 31"
Cohesion: 0.42
Nodes (7): ladderAnswerComplete(), ladderComplete(), pairComplete(), Rating, ratingComplete(), ratingsComplete(), smellStep()

### Community 32 - "Community 32"
Cohesion: 0.10
Nodes (28): downloadCard(), ExportCard, originalBrandImage(), renderCardPng(), wrappedText(), BASE_IDS, CARD_FAMILIES, confirmedProfileId() (+20 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (20): _bounds(), detect_markers(), _lab(), _luma(), _median(), _patch(), _ph_value(), Read one Element lid zone. Input images use OpenCV's BGR channel order. (+12 more)

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (14): ElementFooter(), LabTabs(), references, same(), t(), techCopy, TechEntry, TechReference (+6 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (17): 00:02 | main, 00:11 | main, 12:06 | main, 12:18 | main, 12:47 | main, 13:02 | main, 13:36 | main, 14:09-14:24 | main (+9 more)

### Community 36 - "Community 36"
Cohesion: 0.12
Nodes (16): Element Hackathon Build Implementation Plan, File Structure, Global Constraints, Parallel tracks, Review Focus, Task 10: Accounts, profiles, compare, gift, Task 11: Deploy and verify, Task 1: Types, bases, kit key, ladder (+8 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (16): 1. Photo reader (on the phone, OpenCV.js), 2. Vision check (Workers AI), 3. Survey engine, 4. Nose model (trained, served on Cloudflare), 5. Note graph and tuning, 6. Explainer (Workers AI LLM, constrained), 7. Profile, compare and label art, Build order (+8 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (12): metadata, ScentError(), useLocale(), text(), ElementExperience(), ai, ClaimLink(), LabNotes() (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (8): languages, Locale, navigation, Props, ElementJourney(), ElementSignature(), journeyCopy, landingCopy

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (6): metadata, baseNames, elementCopy, elementOg(), Translation, metadata

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (15): Bench(), Building(), chipLabels(), citer(), DemoFlow(), derive(), fromApi(), localResult() (+7 more)

### Community 42 - "Community 42"
Cohesion: 0.32
Nodes (12): centroid_name(), evaluate(), family_profiles(), fit_ridge(), load_csvs(), main(), predict_family(), prepare_ratings() (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.24
Nodes (9): cells(), image(), neutrals(), Generate the Element demo-kit lid board and its layout JSON.  The board is 160, Embed a PNG from scripts/kit-assets, downscaled to about 600 dpi at its print si, Draw a 0/1 grid (1 = black), slightly overlapped so no hairlines show., Four markers at the zone's corners: TL, TR, BR, BL., rect() (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (10): Build order (critical path first), Data the pages need, Decisions (3-4 October), `/element/demo` flow, `/element` landing sections, Element page, demo walkthrough and home page changes (hackathon), Goal, Home page changes (hackathon only) (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): An empty glass dish is the most honest ritual object, Clean air and time recover the nose within minutes; no object has beaten them, Coffee and citrus threaten the kit's paper and its threshold test, Conclusion, Make the pause the product, not the beans, Perfumers smell their own skin, and labs rely on timed breaks, Ranked recommendation, Regulation and cost favour inert objects over edible or reactive ones

### Community 47 - "Community 47"
Cohesion: 0.14
Nodes (13): 00:28 | element-hackathon, 00:34 | element-hackathon, 00:51 | element-hackathon, 01:18 | element-hackathon, 01:45 | element-hackathon, 01:54 | element-hackathon, 02:28 | element-hackathon, 02:50 | element-hackathon (+5 more)

### Community 48 - "Community 48"
Cohesion: 0.26
Nodes (8): collectionImages, copy, HomeExperience(), SiteHeader(), clamp(), dropTipGeometry(), ease(), storyMotion()

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (6): Data preparation and choices, Element nose model, Limits, Observed evaluation, Reproduction, TypeScript inference

### Community 50 - "Community 50"
Cohesion: 0.40
Nodes (3): metadata, copy, PrivacyContent()

### Community 53 - "Community 53"
Cohesion: 0.40
Nodes (4): Claims to verify for the YAT.lifestyle Element pitch and video, Market and pricing, Nose reset research, Science (business pitch doc, cited from memory, not yet checked)

### Community 54 - "Community 54"
Cohesion: 0.50
Nodes (3): Brand context (read first), Images to generate, Kit contents (everything should be plausible, real lab-grade objects)

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (3): 2026-10-03, Identity Candidates, Recent

### Community 56 - "Community 56"
Cohesion: 0.50
Nodes (3): Adversarial claims review, Five claims most exposed in judge Q&A, Internal contradictions and unresolved assumptions

### Community 57 - "Community 57"
Cohesion: 0.17
Nodes (19): script(), ai(), compareProfiles(), embed(), explain(), jsonFrom(), labelArt(), localeOf() (+11 more)

### Community 59 - "Community 59"
Cohesion: 0.50
Nodes (3): Confirmed video decisions — 4 October 2026, Files kept consistent, Sensitivity test: resolved context

### Community 61 - "Community 61"
Cohesion: 0.20
Nodes (14): AiChoice, available(), BANK, BANNED, BANNED_ZH, c(), L, loc() (+6 more)

### Community 65 - "Community 65"
Cohesion: 0.26
Nodes (16): authLogout(), authRequest(), authVerify(), cookieOf(), emailOf(), hex(), json(), localeOf() (+8 more)

### Community 82 - "Community 82"
Cohesion: 0.22
Nodes (8): Assets and source, Current revision, Current verification, Element revision review, Previews, Previous deployment record — superseded appearance and protocol, Verification, What changed

### Community 84 - "Community 84"
Cohesion: 0.25
Nodes (9): en, MotionCopy, zhHans, zhHant, FormulaProcessing(), InlineProcessing(), LabStudy(), PhotoProcessing() (+1 more)

### Community 85 - "Community 85"
Cohesion: 0.25
Nodes (7): Demo and graphic capture briefs, Element — video plan, Production preparation, Resource-aware execution, when production is requested, Sensitivity-test context, Timing and edit structure, Visual language and motion

### Community 86 - "Community 86"
Cohesion: 0.29
Nodes (6): Actual implementation to portray, Claude-log context used, Google document manifest, Inputs reviewed, Review scope and version decisions, Verification still needed at production time

### Community 87 - "Community 87"
Cohesion: 0.29
Nodes (6): Claim review and citation plan, Contextual references: include only if the corresponding explanation survives, Core references for top-right chips and final source frame, Final one-frame reference copy, Internal references and technical boundaries, Locked narration: evidence and visual treatment

### Community 88 - "Community 88"
Cohesion: 0.50
Nodes (3): Footage selections, Long tutorial: IMG_7275, Source locations and rights check

### Community 91 - "Community 91"
Cohesion: 0.36
Nodes (10): action(), deps(), GET(), POST(), fail(), handle(), json(), label() (+2 more)

### Community 92 - "Community 92"
Cohesion: 0.36
Nodes (9): clamp(), copyWindow(), ease(), JourneyCopyOpacities, journeyMotion, journeyProgress(), JourneyScene, lerp() (+1 more)

### Community 93 - "Community 93"
Cohesion: 0.44
Nodes (7): advanceSequence(), canAdvanceSequence(), gapSeconds(), normaliseSequence(), previousInSequence(), skipDemoGap(), SmellSequence

### Community 94 - "Community 94"
Cohesion: 0.36
Nodes (6): Mail, codeIn(), demoResult(), post(), signIn(), verify()

### Community 95 - "Community 95"
Cohesion: 0.40
Nodes (4): en, LabCopy, zhHans, zhHant

### Community 96 - "Community 96"
Cohesion: 0.40
Nodes (4): Deps, post(), session(), SurveyState

## Knowledge Gaps
- **503 isolated node(s):** `Profile`, `Match`, `copy`, `metadata`, `metadata` (+498 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `readZone()` connect `Community 18` to `Community 25`, `Community 22`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `Locale` connect `Community 39` to `Community 32`, `Community 65`, `Community 2`, `Community 34`, `Community 38`, `Community 40`, `Community 8`, `Community 84`, `Community 22`, `Community 24`, `Community 25`, `Community 61`, `Community 95`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `useLocale()` connect `Community 38` to `Community 34`, `Community 39`, `Community 8`, `Community 41`, `Community 48`, `Community 50`, `Community 22`, `Community 24`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `survey()` (e.g. with `script()` and `same()`) actually correct?**
  _`survey()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Profile`, `Match`, `copy` to the rest of the system?**
  _516 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08994708994708994 - nodes in this community are weakly interconnected._