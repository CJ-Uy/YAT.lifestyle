# Graph Report - YAT.lifestyle  (2026-09-24)

## Corpus Check
- 31 files · ~785,665 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 155 nodes · 164 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b1cc7e93`
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

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 17 edges
2. `Home build brief` - 10 edges
3. `Home build brief` - 10 edges
4. `Product` - 10 edges
5. `Design System: YAT.lifestyle` - 9 edges
6. `submitSeedanceVideo()` - 7 edges
7. `scripts` - 7 edges
8. `pollHiggsfieldRequest()` - 6 edges
9. `generateSeedanceVideo()` - 6 edges
10. `normalizeSeedanceInput()` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (20): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib (+12 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (18): ASPECT_RATIOS, authorization(), generateSeedanceVideo(), HiggsfieldResponse, normalizeSeedanceInput(), parseResponse(), pollHiggsfieldRequest(), PollOptions (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (12): devDependencies, @cloudflare/vite-plugin, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom, typescript (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (12): dependencies, @fontsource/bodoni-moda, react, react-dom, react-server-dom-webpack, vinext, @vinext/cloudflare, name (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (7): scripts, build, deploy, dev, higgsfield:video, start, test

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (10): Asset inventory, Component grammar, Copy rules, Direction, First viewport, Home build brief, Interaction, Page sequence (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.50
Nodes (3): Higgsfield Seedance 2.0, Scripts, YAT.lifestyle

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (8): collectionImages, copy, HomeExperience(), Locale, localeLabels, clamp(), ease(), storyMotion()

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

## Knowledge Gaps
- **107 isolated node(s):** `Locale`, `copy`, `localeLabels`, `collectionImages`, `metadata` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 2` to `Community 3`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `Locale`, `copy`, `localeLabels` to the rest of the system?**
  _107 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Community 17` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._