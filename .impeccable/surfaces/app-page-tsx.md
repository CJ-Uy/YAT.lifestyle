---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/globals.css","app/layout.tsx"]
---

# Home build brief

## Scope

Build the multilingual read-only launch homepage in `app/page.tsx`. Visitor mode is Persuade. Visitors should understand the brand quickly, enter the scroll story when interested, or jump directly to ordinary content.

Approved comp: `.impeccable/mocks/home-a.png`

## Direction

Afterimage Hong Kong. Carbon black projection field, warm white text, restrained gold, laboratory glass, 35mm film perforations, contact sheets, light leaks, and controlled grain. Pipette and droplet remain the dominant focal objects.

## First viewport

- Persistent top navigation: YAT.lifestyle, Home, Collections, Process, About, locale selector, Coming Soon status.
- Left content: headline, two-sentence brand introduction, Explore collections, Experience the story.
- Right stage: large glass pipette with gold liquid and one suspended droplet containing a Hong Kong afterimage.
- Bottom edge previews Hours, Afterimage, and Element so ordinary content is visibly available.

## Page sequence

1. Hero and pipette introduction.
2. Scroll story for Hours, Afterimage, and Element.
3. Direct collection overview.
4. Process.
5. Origin story.
6. Coming Soon and Hong Kong availability.
7. Footer.

## Component grammar

- Square edges and hairline rules. Small controls may use minimal rounding.
- Gold belongs to liquid, active states, focus, and thin rules. It is not a general background fill.
- No card grid. Collection content uses film frames and asymmetric contact-sheet bands.
- Display type is cinematic and high contrast. Body type remains plain and readable.
- Projection light and real media provide depth. CSS glow does not.

## Asset inventory

| Ingredient | Medium | Requirement |
| --- | --- | --- |
| Pipette and droplet | WebGL or canvas | Interactive, transparent glass, gold liquid, scroll-linked movement |
| Hong Kong afterimage | Higgsfield video or generated raster | No text, logos, packaging, or fake product |
| Film perforations and timecode | Semantic CSS or authored SVG | Sharp geometry and responsive scaling |
| Collection frames | Semantic HTML with raster media | Hours, Afterimage, Element remain readable without animation |
| Grain and light leak | Raster texture or approved media | Subtle, bounded, and never placed over body copy |
| Primary actions | Semantic links | Strong focus state and normal anchor behavior |

## Interaction

Use native scrolling. A sticky visual stage responds to scroll progress while semantic chapters remain in the document. Navigation and Explore collections bypass the story. Reduced motion replaces scroll-linked movement with still frames. Mobile shows content before spectacle and uses a lighter visual path.

## Copy rules

No em dashes. Apply No AI Slop. Keep claims factual. Do not invent fragrance names, prices, customer evidence, scientific measurements, or launch dates. Working collection names are Hours, Afterimage, and Element.

## Quality gates

- First viewport explains perfume, Hong Kong, laboratory origin, and coming-soon status.
- Navigation works without waiting for WebGL.
- English, Traditional Chinese, and Simplified Chinese work at all breakpoints.
- Keyboard, contrast, focus, reduced motion, and no-JavaScript reading order remain usable.
- Hero matches the approved comp in scale, density, and material character.
