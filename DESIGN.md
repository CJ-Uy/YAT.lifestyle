---
name: YAT.lifestyle
description: A Hong Kong perfume house shaped by laboratory curiosity and memory.
colors:
  ink: "#080806"
  carbon: "#0d0d0b"
  warm-white: "#f1eadc"
  muted: "#aaa499"
  liquid-gold: "#d8a443"
  paper: "#ece5d8"
  lab-white: "#ffffff"
  lab-paper: "#f5f7f9"
  lab-ink: "#162c3a"
  lab-muted: "#596b78"
  lab-slate: "#223541"
  lab-hover: "#142733"
  lab-control: "#7b8d9b"
  lab-soft: "#edf2f6"
  lab-rule: "#dce4e9"
  lab-diagram: "#536f83"
  element-white: "#ffffff"
  element-slate: "#223541"
  element-muted: "#53636d"
  element-paper: "#f5f7f7"
  element-rule: "#d3dcdf"
typography:
  display:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Trebuchet MS, Microsoft JhengHei, PingFang TC, sans-serif"
    lineHeight: 1.75
  label:
    fontFamily: "Trebuchet MS, Microsoft JhengHei, PingFang TC, sans-serif"
    letterSpacing: "0.16em"
  lab-headline:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.15rem, 4.4vw, 3.45rem)"
    fontWeight: 400
    lineHeight: 1.12
  lab-body:
    fontFamily: "Trebuchet MS, Microsoft JhengHei, PingFang TC, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.65
  lab-control:
    fontFamily: "Trebuchet MS, Microsoft JhengHei, PingFang TC, sans-serif"
    fontSize: "0.94rem"
    fontWeight: 500
    letterSpacing: "0"
rounded:
  lab-control: "4px"
  lab-panel: "6px"
  share-card: "16px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.liquid-gold}"
    padding: "0.8rem 1.85rem"
    height: "56px"
  button-secondary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.warm-white}"
    padding: "0.8rem 1.85rem"
    height: "56px"
  button-lab-primary:
    backgroundColor: "{colors.lab-slate}"
    textColor: "{colors.lab-white}"
    typography: "{typography.lab-control}"
    rounded: "{rounded.lab-control}"
    height: "54px"
  button-lab-secondary:
    backgroundColor: "{colors.lab-white}"
    textColor: "{colors.lab-ink}"
    typography: "{typography.lab-control}"
    rounded: "{rounded.lab-control}"
    height: "47px"
  lab-rating-selected:
    backgroundColor: "{colors.lab-slate}"
    textColor: "{colors.lab-white}"
    rounded: "{rounded.lab-control}"
    height: "44px"
    width: "44px"
  lab-typed-answer:
    backgroundColor: "{colors.lab-white}"
    textColor: "{colors.lab-ink}"
    typography: "{typography.lab-body}"
    rounded: "{rounded.lab-control}"
    padding: "0.85rem 1rem"
    height: "150px"
  element-brand-original:
    backgroundColor: "{colors.element-white}"
    width: "300px"
  element-share-card:
    backgroundColor: "{colors.element-white}"
    textColor: "{colors.element-slate}"
    rounded: "{rounded.share-card}"
    padding: "27px 28px 19px"
---

# Design System: YAT.lifestyle

## Overview

**Creative North Star: "Afterimage Hong Kong"**

The site feels like a quiet fragrance film viewed through laboratory glass. Carbon black holds the frame, warm white carries the story, and gold marks a few deliberate points of attention. Hong Kong appears through specific light, transit, water, and memory.

Motion follows the drop and the visitor's scroll. It never hides navigation or the meaning of a collection. The dropper remains the signature form. The user's supplied original gold Element logo is authoritative for Element branding across the landing, header, demo and scent card. The home page retains its existing dark identity and story.

**Key Characteristics:** restrained gold, optical glass, film grain, hairline rules, generous type, specific Hong Kong imagery.

## Colors

Liquid gold is the home collection accent. Ink and carbon provide its main field; warm white carries primary copy, muted gray supports it, and paper creates a light section for a change in pace. The Element landing now shares the demo's white laboratory world: white field, slate text and actions, cool pale surfaces and quiet rules. Its diagram strokes, selection, caret, scrollbar and focus states follow the slate laboratory palette. The downloadable scent card uses white with slate type, graph and QR. Element gold belongs to the supplied original logo and the physical perfume drop.

The demo's inherited `--gold` alias resolves to the lab slate role, and `--warm` resolves to lab body ink. These aliases let shared controls follow the scoped palette. The descriptive lab tokens in the frontmatter remain the design record.

**The Rare Gold Rule.** On the home page, reserve gold for the wordmark, key actions, section indices, focus, and small optical details. On Element surfaces, reserve gold for the supplied original logo and the physical drop; controls and focus remain slate.

**The Element Lab Rule.** Share the white and slate laboratory world across the Element landing and demo. Keep their controls, focus states and diagrams in that palette; preserve the home page's existing dark and gold world.

## Typography

Use Bodoni Moda for the house's typographic wordmark, headings, navigation, and prominent calls to action. Element's original gold lettering is supplied artwork and must remain that artwork. Use the body stack for paragraphs and controls; its Chinese fallbacks must remain readable in both scripts. Short uppercase labels use wide tracking.

The hero display size is `clamp(3.4rem, 5.35vw, 5.65rem)` on desktop. Section headings use `clamp(3rem, 5vw, 5.7rem)`. Body copy stays near 64 characters per line or less.

The demo keeps Bodoni for its headings. Its main heading uses the `lab-headline` role, changing to `clamp(2.1rem, 8.7vw, 2.65rem)` below 680px. Body and typed replies use the body stack at 1rem with a 1.65 line height; action text uses the `lab-control` role. Demo labels use sentence case and close tracking so instructions read as working text. No font or vector reconstruction substitutes for the original Element lettering.

**The Readable Frame Rule.** Keep text clear against every video frame and still image. Never place essential words inside generated media.

## Layout

The fixed header is 82px high on desktop and 76px on small screens. Main content uses horizontal padding of `clamp(1.25rem, 4.5vw, 4.75rem)`. Desktop compositions pair a readable text field with a larger media field. Home, Element and the language disclosure stay directly available on small screens. On the home page below 680px, the portrait pipette remains central while the story copy stays below the falling drop.

The home page's first viewport gives visitors a headline, a plain description, and the pipette, without duplicating the navigation's collection link. The story can be bypassed through the navigation and anchors.

The demo uses a rail, a readable working column and a supporting bench on large screens. The bench disappears below 1100px; below 800px the working column stands alone, with a maximum width of 620px. Phones use 1.15rem side padding and the 76px header offset. The active vial stays to the left of its response at every width: a 64px specimen column on desktop and a 44px column with a 140px-tall vial on phones. Previous answers remain in the same working column. The exact Element page recipes are recorded in `.impeccable/briefs/element-journey.md` and `.impeccable/briefs/element-demo.md`.

## Elevation & Depth

The collection interface uses no card shadows. Depth comes from dark tonal layers, glass highlights, a soft film texture, and photographic or video media. Borders are thin and quiet. The demo has two small functional exceptions: a diffuse language-disclosure shadow and a short primary-action hover shadow. Neither creates a stack of raised panels.

## Shapes

Most interface edges are square. Fine rules, film perforations, and contact sheets create precision. The pipette and droplet supply the main curves. Do not add rounded cards or pill controls without a concrete need.

Within the demo, controls use 4px corners and working panels use 6px corners. The timed rest indicator is circular so its countdown reads as a clock. The exported scent card uses 16px corners as a portable result artifact. These scoped shapes do not change the collection frame language.

## Components

### Actions

Actions have square corners, a 56px minimum height, a fine border, and serif text. The primary action uses gold emphasis. Hover fills with warm white and turns text dark. Focus uses a visible gold outline.

Demo actions use body text, 4px corners and slate emphasis. The primary is at least 54px high, with white text; the secondary is at least 47px high, with an outlined white surface. Disabled actions retain a readable explanation of the missing completion requirement. Focus is a 2px slate outline with a 4px offset. Brief press and unlock feedback never postpones the completion rule.

### Navigation

The fixed header places the curved dropper emblem on the left and Home, Element and the language disclosure on the right. Element's white header uses a compact CSS display crop of the supplied original E and ELEMENT lettering, retaining its gold pixels. Mobile keeps the same navigation links in a single row. All touch targets are at least 44px. The language disclosure uses full language names and a check for the current choice; its mobile trigger is abbreviated. It supports Tab, Escape, outside-click dismissal and remembers the choice across pages. Shop is absent from navigation while purchasing is unavailable.

### Collection Frames

Contact links are placed in context rather than in a new form or modal: Element
inquiries in its collection, press in About, general inquiries in both footers,
and care/order questions on Shop. Labels follow the selected language; addresses
remain unchanged. Links open the visitor's email app and do not imply ordering
or the Element service is available yet.

Element leads the collection section in a full-width feature with image and copy beside one another. Hours and Afterimage sit below, each occupying one column. Mobile stacks the three collections so each is discoverable without a horizontal swipe. Images may carry film treatment, but text remains HTML with useful localized alt text.

### Signature Media

One full-viewport stage carries the hero and story on every screen size. A scroll-controlled canvas draws a small WebP sequence derived from the portrait Higgsfield film, so the falling drop stays in view without seeking a video on iOS. Full-width Hong Kong imagery surrounds the portrait plate. Hours pairs left copy with right imagery; Afterimage reverses it; Element brings laboratory glass forward. Scroll-linked photographic movement and overlapping copy fades connect the chapters.

The filmed droplet hands off to a gold-gradient vector drop, which settles inside the A of a unified SVG wordmark. Letters appear after the drop begins settling; the name and tagline follow. No circular image crop, ornamental upper emblem, halo, or bounce. The supplied logo image remains reference only. This is a provisional treatment, not final brand approval. Reduced motion uses the still poster, discrete chapter changes, and a static dark lockup. Stable viewport units prevent mobile browser toolbar changes from stretching the story.

The About section uses the existing generated laboratory still, with an explicit localized illustration caption. It must not imply a photograph of the founder's actual laboratory. Its grid columns can shrink and the text measure remains readable on intermediate widths.

The signature drop uses layered radial shading, a soft upper-left reflection, and a restrained lower bounce to read as dimensional gold without adding WebGL. Every shading layer shares the same morphing outline. The favicon uses a simplified version of the reference's dropper and curved bottle outline on ink, not a standalone drop. It has SVG, 32px PNG, and 180px Apple touch variants.

### Element Materials and Wordmark

Element uses the exact rendered artwork of the supplied FINAL BOARD.pdf. Printed markers, colour references, skin/control lanes and QR artwork retain their geometry. Transparent photographic blotting-sheet and pH-strip components sit over the board as clearly identified concept materials; they are not personal readings. The accessible board explainer keeps its explanatory text independent of the image and highlights the eight printed glyphs individually.

**The Element Material Rule.** Preserve the supplied board and original logo artwork, and keep session labels in HTML. Identify generated component photographs as concepts. Use vector geometry for the travelling drop and explanatory diagrams, never to reconstruct the Element logo.

The Element brand source is `public/media/element-brand-original.png`, the unchanged 1254×1254 attachment. Compact branding displays crops of the source E and ELEMENT lettering; the final brand display uses the original artwork at a 1146:860 crop ratio. Preserve the original gold treatment, letter geometry and source file. Display brightness of 1.04 blends the source's pale background into the white interface; the original image bytes remain unchanged, with no hue adjustment or recreated lettering. The old custom drop/E plus Bodoni `lement` is superseded. A real rendered QR retains its quiet zone, contrasts with its surface and has a readable destination if rendering fails.

### Laboratory Responses

The demo presents one active photographic glass vial at a time, with a true session number or letter over its blank label in HTML. The transparent generated vial is a concept component. Numeric ratings use visible 44px controls; a slate selected state is also represented by accessible pressed state and a readable value. Previous answers remain visible and expandable for editing. Typed answers use a labelled, vertically resizable white textarea with a 150px minimum height, 4px corners and the lab body role. Optional text and voice are identified as optional.

The step's actual requirements govern Continue: setup checks, required consent, successful photo or sample reading, required ratings and timed rests. Explanatory completion text remains beside the action. Genuine optional routes have explicit skip actions; sample-mode timer skipping does not change the kit route's required rest.

### Laboratory Motion

Loading motion explains the actual process: photo opening, board alignment and reference reading; then observations, preferences, bounded refinement and reasons. The formula map links entered signals to the selected scent. Four stage controls expose explanations, and waiting copy describes the connection fallback. There are no invented percentages. Repeating motion stops when complete, hidden or out of view; reduced motion retains the readable diagram. Controls respond in 150–260 ms; animation never delays completion gates. The implemented timed smell sequence and its explicit sample-only skips are recorded in the demo surface brief.

### Portable Scent Card

The result card uses a white field, slate Bodoni name, supplied original gold logo, actual result values in a six-family graph, and a real rendered QR with a readable destination. Flowing scent-signature contours derive from the same six preference values and surround the square QR while preserving its full quiet zone. They describe the preference profile rather than an invented measurement. The download action renders a matching PNG of the card; native file sharing is used where supported, with download as a fallback. Public-profile sharing and the demo-link fallback have distinct labels. Local memories and example friend/account controls are explicitly labelled as a prototype; they do not imply remote account persistence, real friendships or ordering.

### Delivery Preview

The final demo step follows Share and makes the total eleven stages. A 50 ml summary shows the selected base, concentration and original compact logo. Its local form offers an explicitly fictional Hong Kong address and permits editing. Recipient, address and a Hong Kong area are required before confirmation; controls use the existing white/slate lab forms, with 48px fields and a 54px submit action. Address state survives back navigation and session restoration. Confirmation shows an illustrative estimate of about one week within Hong Kong and a visible statement that no parcel is sent. There is no order, payment or shipping API call.

## Do's and Don'ts

### Do:

- **Do** use specific Hong Kong sensory details and real product facts.
- **Do** keep launch and purchase availability clear.
- **Do** preserve keyboard focus, reduced motion, and full language coverage.

### Don't:

- **Don't** imply that unlaunched fragrances can be ordered.
- **Don't** invent laboratory methods, scent accuracy, or personalization outcomes.
- **Don't** use generated text or imagery as a substitute for readable page content.
