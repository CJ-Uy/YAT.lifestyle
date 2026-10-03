# Graph Report - YAT.lifestyle  (2026-10-04)

## Corpus Check
- 144 files · ~2,399,654 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 945 nodes · 1478 edges · 65 communities (54 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4ecaf81b`
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
- [[_COMMUNITY_Community 52|Community 52]]
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

## God Nodes (most connected - your core abstractions)
1. `useLocale()` - 19 edges
2. `compilerOptions` - 17 edges
3. `handle()` - 16 edges
4. `Locale` - 14 edges
5. `survey()` - 12 edges
6. `readWarped()` - 12 edges
7. `read_zone()` - 12 edges
8. `Parallel tracks` - 12 edges
9. `derive()` - 10 edges
10. `readZone()` - 10 edges

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

## Communities (65 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (18): ASPECT_RATIOS, authorization(), generateSeedanceVideo(), HiggsfieldResponse, normalizeSeedanceInput(), parseResponse(), pollHiggsfieldRequest(), PollOptions (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (77): action(), deps(), GET(), POST(), script(), ai(), BUDGET, compareProfiles() (+69 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (33): dependencies, @fontsource/bodoni-moda, js-aruco2, qr-code-styling, react, react-dom, react-server-dom-webpack, vinext (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (7): collectionImages, copy, HomeExperience(), clamp(), dropTipGeometry(), ease(), storyMotion()

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
Cohesion: 0.12
Nodes (15): Actions, Collection Frames, Colors, Components, Design System: YAT.lifestyle, Do:, Do's and Don'ts, Don't: (+7 more)

### Community 18 - "Community 18"
Cohesion: 0.07
Nodes (46): metadata, NotFound(), ArucoGlobal, detectMarkers(), Detector, loadReader(), pixels(), ReaderImage (+38 more)

### Community 22 - "Community 22"
Cohesion: 0.05
Nodes (27): callApi(), Action, Answer, AskedQuestion, CiteId, Copy, FAMILIES, FOUNDER_FALLBACK (+19 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (37): 1. Does any candidate actually "reset" the nose? (efficacy baseline that drives framing), 2. Odor migration risk inside a closed box (coffee, citrus, charcoal) and packaging that prevents it, 3. Shelf life and degradation in HK heat and humidity, 4. Safety, allergy and HK regulatory considerations, 5. Unit cost estimates (100-1,000 kits) and supplier types, 6. Sustainability and premium-feel considerations, 7. Honest copywriting and HK legal framing (Trade Descriptions Ordinance, etc.), Cited Findings (+29 more)

### Community 24 - "Community 24"
Cohesion: 0.07
Nodes (20): metadata, CompareView(), copy, LoginView(), Match, MeView(), Profile, SharedView() (+12 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (28): normaliseQuestion(), ALL_NOTES, changeLine(), CLOSING, Explanations, FAMILY_NAMES, L, loc() (+20 more)

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
Cohesion: 0.21
Nodes (17): BASES, compare(), FAMILIES, HARMONY, NOTE_TIER, TRAIT_EFFECTS, activeTraits(), Change (+9 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (17): post(), session(), AiChoice, available(), BANK, BANNED, BANNED_ZH, c() (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.17
Nodes (20): _bounds(), detect_markers(), _lab(), _luma(), _median(), _patch(), _ph_value(), Read one Element lid zone. Input images use OpenCV's BGR channel order. (+12 more)

### Community 34 - "Community 34"
Cohesion: 0.15
Nodes (11): references, same(), t(), techCopy, TechEntry, TechReference, TechSection, TechStep (+3 more)

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
Cohesion: 0.19
Nodes (9): baseNames, story, ai, ClaimLink(), ElementFooter(), LabTabs(), NoteGraph(), scienceSections (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.21
Nodes (11): BASE_IDS, CONTENTS, kitKey(), LETTERS, rng(), shuffle(), LadderAnswer, scoreLadder() (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.19
Nodes (7): languages, Locale, navigation, metadata, elementOg(), Translation, metadata

### Community 41 - "Community 41"
Cohesion: 0.26
Nodes (13): Bench(), Building(), chipLabels(), citer(), DemoFlow(), derive(), fromApi(), localResult() (+5 more)

### Community 42 - "Community 42"
Cohesion: 0.32
Nodes (12): centroid_name(), evaluate(), family_profiles(), fit_ridge(), load_csvs(), main(), predict_family(), prepare_ratings() (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.24
Nodes (9): cells(), image(), neutrals(), Generate the Element demo-kit lid board and its layout JSON.  The board is 160, Embed a PNG from scripts/kit-assets, downscaled to about 600 dpi at its print si, Draw a 0/1 grid (1 = black), slightly overlapped so no hairlines show., Four markers at the zone's corners: TL, TR, BR, BL., rect() (+1 more)

### Community 44 - "Community 44"
Cohesion: 0.18
Nodes (10): Build order (critical path first), Data the pages need, Decisions (3-4 October), `/element/demo` flow, `/element` landing sections, Element page, demo walkthrough and home page changes (hackathon), Goal, Home page changes (hackathon only) (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (7): ScentError(), useLocale(), elementCopy, text(), ElementExperience(), ElementStory(), LabNotes()

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): An empty glass dish is the most honest ritual object, Clean air and time recover the nose within minutes; no object has beaten them, Coffee and citrus threaten the kit's paper and its threshold test, Conclusion, Make the pause the product, not the beans, Perfumers smell their own skin, and labs rely on timed breaks, Ranked recommendation, Regulation and cost favour inert objects over edible or reactive ones

### Community 47 - "Community 47"
Cohesion: 0.25
Nodes (7): 00:28 | element-hackathon, 00:34 | element-hackathon, 00:51 | element-hackathon, 01:18 | element-hackathon, 01:45 | element-hackathon, 01:54 | element-hackathon, 02:28 | element-hackathon

### Community 48 - "Community 48"
Cohesion: 0.33
Nodes (4): SiteHeader(), metadata, copy, PrivacyContent()

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (6): Data preparation and choices, Element nose model, Limits, Observed evaluation, Reproduction, TypeScript inference

### Community 50 - "Community 50"
Cohesion: 0.38
Nodes (4): families, inferNose(), families, Family

### Community 52 - "Community 52"
Cohesion: 0.40
Nodes (4): 02:50 | element-hackathon, 02:57 | element-hackathon, 03:03 | element-hackathon, 03:14 | element-hackathon

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

## Knowledge Gaps
- **433 isolated node(s):** `Profile`, `Match`, `copy`, `metadata`, `metadata` (+428 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `readZone()` connect `Community 18` to `Community 22`, `Community 31`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `Locale` connect `Community 40` to `Community 32`, `Community 2`, `Community 34`, `Community 38`, `Community 8`, `Community 22`, `Community 24`, `Community 25`, `Community 31`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `useLocale()` connect `Community 45` to `Community 34`, `Community 4`, `Community 38`, `Community 40`, `Community 41`, `Community 8`, `Community 48`, `Community 22`, `Community 24`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `survey()` (e.g. with `script()` and `same()`) actually correct?**
  _`survey()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Profile`, `Match`, `copy` to the rest of the system?**
  _444 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05421686746987952 - nodes in this community are weakly interconnected._