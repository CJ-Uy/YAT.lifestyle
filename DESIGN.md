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
  store-ivory: "#f7f3eb"
  store-paper: "#eee8dd"
  store-charcoal: "#292a24"
  store-muted: "#646257"
  store-bronze: "#73582d"
  store-rule: "#cec6b8"
  store-selection: "#dac69f"
  store-scrollbar: "#a59b87"
  store-error: "#a13e2c"
  store-success: "#3f643f"
  store-journey-charcoal: "#24231f"
  store-journey-heading: "#f4e9d4"
  store-journey-muted: "#d0c6b4"
  store-journey-gold: "#e0bc74"
  store-journey-rule: "#82745d"
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
  store-display:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(3rem,5.3vw,5.65rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  store-hero-display:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(4rem,7.2vw,6rem)"
    fontWeight: 400
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  store-journey-headline:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.65rem,4.8vw,4.6rem)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  store-journey-control:
    fontFamily: "Trebuchet MS, Microsoft JhengHei, PingFang TC, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.65
  store-headline:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(2.4rem,3.8vw,4.2rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  store-card-title:
    fontFamily: "Bodoni Moda, Bodoni 72, Didot, Georgia, serif"
    fontSize: "clamp(1.7rem,2.8vw,2.65rem)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  store-body:
    fontFamily: "Trebuchet MS, Microsoft JhengHei, PingFang TC, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.65
  store-control:
    fontFamily: "Trebuchet MS, Microsoft JhengHei, PingFang TC, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  store-navigation:
    fontFamily: "Trebuchet MS, Microsoft JhengHei, PingFang TC, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0.02em"
  store-disclosure:
    fontFamily: "Trebuchet MS, Microsoft JhengHei, PingFang TC, sans-serif"
    fontSize: "0.85rem"
    lineHeight: 1.65
rounded:
  store-control: "0"
  lab-control: "4px"
  lab-panel: "6px"
  share-card: "16px"
spacing:
  store-gutter: "clamp(1.25rem,4.5vw,4.75rem)"
  store-section: "clamp(4.5rem,8vw,8rem)"
components:
  button-journey-primary:
    backgroundColor: "transparent"
    textColor: "{colors.warm-white}"
    typography: "{typography.store-journey-control}"
    rounded: "{rounded.store-control}"
    padding: "0.7rem 1.3rem"
  button-journey-primary-hover:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.store-journey-charcoal}"
  store-journey-stage:
    backgroundColor: "{colors.store-journey-charcoal}"
    textColor: "{colors.warm-white}"
    height: "calc(100svh - 82px)"
  button-store-primary:
    backgroundColor: "{colors.store-charcoal}"
    textColor: "{colors.store-ivory}"
    typography: "{typography.store-control}"
    rounded: "{rounded.store-control}"
    padding: "0.8rem 1.45rem"
  button-store-primary-hover:
    backgroundColor: "{colors.store-bronze}"
    textColor: "{colors.store-ivory}"
  button-store-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.store-charcoal}"
    typography: "{typography.store-control}"
    rounded: "{rounded.store-control}"
    padding: "0.8rem 1.45rem"
  store-field:
    backgroundColor: "{colors.store-paper}"
    textColor: "{colors.store-charcoal}"
    typography: "{typography.store-body}"
    rounded: "{rounded.store-control}"
    padding: "0.65rem 0.85rem"
  store-filter:
    backgroundColor: "transparent"
    textColor: "{colors.store-muted}"
    rounded: "{rounded.store-control}"
    padding: "0.6rem 0"
  store-summary:
    backgroundColor: "{colors.store-paper}"
    textColor: "{colors.store-charcoal}"
    rounded: "{rounded.store-control}"
    padding: "1.5rem"
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

This is an ordinary extension of the incumbent world. The October 2026 live-checkout work preserves the existing palette, typography, token frontmatter, Element rules and homepage signature; it does not establish a new visual world.

The house joins photographic perfume, laboratory curiosity and specific Hong Kong memories. The golden filmed droplet and its YAT signature finish remain the homepage identity, with cream type on warm charcoal. The owner's premium black, white and gold direction appears through large Bodoni type, brief captions, larger real photographs, a thin gold-outline action and quiet rules. Soft white shopping keeps product choice readable. The actual gift box, Natasha's founder portrait and the perfume in hand ground the home story; visible HTML carries essential product facts and working controls.

Scope is `/`, `/shop`, `/shop/[slug]`, `/bag`, `/checkout` and `/order`, evidenced by `app/storefront.css`, `app/droplet-journey.tsx` and the corresponding components. Home opens with the three-line “Time. Place. You.” and a short perfume/Hong Kong introduction, then reuses the established scroll-driven droplet to reveal the gift box, Natasha's HKUST Biotechnology student/founder story and everyday perfume. A ruled shopping rail keeps price, package and actions available. Repeated homepage descriptions are removed; catalogue guidance and checkout facts remain complete. Element is deferred without an ordinary-shop entry; its existing white/slate rules and supplied original gold artwork remain authoritative within its retained routes. The original `HomeExperience` composition remains an inactive historical reference; its renderer geometry, motion helpers and media underpin the current `DropletJourney`.

**Key Characteristics:** golden droplet and YAT signature, spare captions, warm charcoal and cream, readable ivory, restrained gold/bronze, real product evidence, hairline rules, Bodoni headings, specific Hong Kong memory.

## Colors

### Primary

Store bronze marks actions, active filters, links, focus and small sequence numbers on ivory shopping surfaces. The home journey uses its scoped pale gold for the outlined shopping action and focus; hover fills that action with cream. The original liquid-gold vocabulary remains in the droplet and signature treatment. Element's original gold artwork remains separate from its slate controls.

### Neutral

Store ivory is the ordinary reading field; store charcoal carries primary copy and filled actions, store muted supports secondary copy, store paper distinguishes the home gift section, totals/footer/fields and store rule supplies hairlines. Store selection and scrollbar keep browser states in the same warm palette; store error and success provide functional form/newsletter feedback.

Journey charcoal is the film stage only, beneath the opaque ivory navigation. Cream body text and shopping actions, a slightly warmer hero heading, pale muted copy and quiet journey rules keep the first view readable through changing photographic frames. Its aliases are rebound inside the journey, leaving the surrounding shop and reading surfaces ivory.

Legacy ink/carbon/warm-white/muted/liquid-gold tokens remain unchanged for retained dark surfaces. The Element landing shares the demo's white laboratory world: white field, slate text and actions, cool pale surfaces and quiet rules. Its diagram strokes, selection, caret, scrollbar and focus states follow the slate laboratory palette. The downloadable scent card uses white with slate type, graph and QR. Element gold belongs to the supplied original logo and the physical perfume drop.

The demo's inherited `--gold` alias resolves to the lab slate role, and `--warm` resolves to lab body ink. These aliases let shared controls follow the scoped palette. The descriptive lab tokens in the frontmatter remain the design record.

**The Scoped Palette Rule.** Use the store-prefixed tokens only on ordinary shopping surfaces. The storefront rebinds inherited ink/carbon/warm/muted/gold/rule aliases locally; do not replace the root legacy tokens or Element's laboratory palette.

**The Rare Gold Rule.** On the homepage journey, reserve gold for the droplet/signature and small action/focus details. The surrounding ivory shop uses bronze. On Element surfaces, reserve gold for the supplied original logo and the physical drop; controls and focus remain slate.

**The Element Lab Rule.** Share the white and slate laboratory world across the retained Element landing and demo. Keep their controls, focus states and diagrams in that palette; the ordinary storefront variant does not replace Element's original artwork or rules.

## Typography

Use self-hosted Bodoni Moda for the ordinary-storefront wordmark and headings, including the three-line journey headline. Shopping navigation, actions, fields and scent-stage labels use the plain body stack, retaining readable Chinese fallbacks. The old decorative time/place/you axis is removed; those words now carry the opening headline. The retained YAT tagline stays within the signature scene. Element's original gold lettering is supplied artwork and must remain that artwork.

The store-prefixed frontmatter records the actual desktop/general heading, hero, journey headline/control, section, card, body, navigation and disclosure roles. Body measure is at most 65 characters. The hero uses its frontmatter role above 760px, with an eight-character measure and preserved line breaks; on phones its size is `clamp(3.1rem,13.5vw,4rem)`. Journey chapter headings use their scoped role, changing to `clamp(2.5rem,10vw,3.5rem)` on phones. Journey captions have a 32-character maximum measure, .95rem/1.65 type and preserved line breaks, changing to .9rem on phones; the opening introduction is .9rem throughout. The journey action is .875rem, changing to .85rem on phones. Mobile product identity and catalogue headings remain 3.2rem, catalogue card titles 1.8rem, and navigation .84rem. Scent-finder results use their smaller responsive card hierarchy, becoming photographic rows below 430px. Product notes and scent-profile headings are 1.8rem; tier labels use .9rem body type, tier copy .95rem/1.55 and the adjacent draft qualification .8rem/1.6. Money uses tabular numerals; home gift price stays a restrained 1.1rem at every width. The order-status heading uses `clamp(2.5rem,4vw,4rem)` on desktop; checkout uses the general display role. Both use the ordinary page-heading override of 3rem on mobile.

The retained cinematic hero is `clamp(3.4rem, 5.35vw, 5.65rem)` on desktop and its section headings use `clamp(3rem, 5vw, 5.7rem)`; those sizes do not govern the shop.

The demo keeps Bodoni for its headings. Its main heading uses the `lab-headline` role, changing to `clamp(2.1rem, 8.7vw, 2.65rem)` below 680px. Body and typed replies use the body stack at 1rem with a 1.65 line height; action text uses the `lab-control` role. Demo labels use sentence case and close tracking so instructions read as working text. No font or vector reconstruction substitutes for the original Element lettering.

**The Readable Frame Rule.** Keep text clear against every video frame and still image. Never place essential words inside generated media.

**The Short Caption Rule.** On the homepage, let the drop and real photographs lead with brief headings and captions; retain readable price, package, founder facts and working shopping controls.

## Layout

The ordinary-storefront header is sticky and opaque, 82px high on desktop and 76px below 760px. The home journey stays directly beneath it, with stage and scroll spacers sized to `100svh` minus the current header height. Native scrolling moves through five brief copy panels and the YAT finish. A full-width shopping rail sits inside the stage gutters with a one-pixel top rule, facts at left and actions at right; on phones it stacks those groups. The direct Shop link opens the catalogue, and Skip story bypasses the journey to the home scent finder. Reduced motion removes the spacers and later scenes, leaving one complete static first viewport. The store-gutter gives fluid side padding; above 1500px it becomes `max(4.75rem,calc((100vw - 1380px)/2))`. Below the journey, the scent finder pairs a family compass and Fresh–Warm preference with three ranked product matches; it stacks controls and results below 760px and turns its three result tiles into rows below 430px. Gift and About use paired copy/photography and stack below 760px; About retains an evening/in-hand photo pair. Catalogue uses three equal columns; related-product groups retain `1fr .86fr 1fr` with the middle image offset downward by `clamp(2rem,5vw,4.5rem)`. Both become a conventional two-column grid below 760px and one column below 370px, with no mobile offset. Checkout places totals in a 360px supporting column, reduced to 310px below 1000px and stacked below 760px; fields become one column below 1000px. The Cart refinement uses a restrained 280–340px summary column and stacks below 960px.

Desktop products pair the 4:5 gallery with identity and purchase controls. Mobile puts identity, size, price and package first, limits the image to `min(220px,26svh)` with contain fitting, then exposes quantity/Add to cart. The first-view purchase hierarchy is a surface brief commitment; it is not a rule for every Element layout. The original cinematic `HomeExperience` remains inactive; `/` mounts `StoreHome` with the restored `DropletJourney` and ivory shopping sections.

The demo uses a rail, a readable working column and a supporting bench on large screens. The bench disappears below 1100px; below 800px the working column stands alone, with a maximum width of 620px. Phones use 1.15rem side padding and the 76px header offset. The active vial stays to the left of its response at every width: a 64px specimen column on desktop and a 44px column with a 140px-tall vial on phones. Previous answers remain in the same working column. The exact Element page recipes are recorded in `.impeccable/briefs/element-journey.md` and `.impeccable/briefs/element-demo.md`.

## Elevation & Depth

Ordinary shopping uses flat surfaces and no card shadows. Photographic lighting supplies depth; secondary paper, thin borders and space distinguish totals, fields and sections. The homepage journey reuses filmed highlights, dark tonal layers, feathered photographic edges and restrained gradient shading on the signature drop. Its charcoal shading is confined to the stage. The demo keeps two small functional exceptions: a diffuse language-disclosure shadow and a short primary-action hover shadow. Neither creates a stack of raised panels.

## Shapes

Ordinary-shopping actions, fields and summaries have square edges and one-pixel rules. Filters use a plain text underline rather than pills. Its catalogue images have a 4:5 portrait frame. The filmed pipette/droplet and unified SVG YAT mark remain the homepage signature forms. The circular scent compass supports choosing a family; the three-tier scent profile supports reading Opening, Heart and Dry-down. These functional diagrams do not change the square shopping-control language. Retained film perforations/contact sheets remain historical collection forms. Do not add rounded shopping cards or pill controls without a concrete need.

Within the demo, controls use 4px corners and working panels use 6px corners. The timed rest indicator is circular so its countdown reads as a clock. The exported scent card uses 16px corners as a portable result artifact. These scoped shapes do not change the collection frame language.

## Components

### Ordinary Shopping Actions and Fields

Filled actions use store charcoal on ivory, a one-pixel charcoal border, body text, a 56px minimum height and the frontmatter padding. Hover uses bronze; secondary actions start transparent with a quiet rule and fill charcoal on hover. Disabled actions use secondary paper and muted text. Fields have a 48px minimum height, square corners, secondary-paper background and a quiet rule; checkout errors use the error colour and readable corrective copy. Keyboard focus is a two-pixel bronze outline with a five-pixel offset; product-image links use a six-pixel offset.

Checkout code verification and voucher controls inherit the scoped shopping palette. The voucher and native product-quantity select use the light reading field, charcoal text and gold/bronze focus, rather than reversing the inherited ink/warm aliases. Product quantity remains a native select with an SVG chevron and a three-pixel focus offset. Cart quantity uses a minus/input/plus stepper with 48px targets, a quiet enclosing rule and focus contained within the control; removal remains a separate text action.

Action/filter colour and border feedback is 140ms; inherited navigation/language feedback remains 180ms. Inline SVG arrows travel four pixels on hover using the house ease; no hover travel remains under reduced motion. The journey's primary action has a transparent field, pale-gold one-pixel outline, cream body text and a 52px minimum target; hover fills with cream and turns the text charcoal. Its spacing and type use the scoped frontmatter roles. The former 420ms photo reveal is inactive. See `MOTION.md` for the restored film's native-scroll lifecycle and intent.

### Catalogue, Summary and Scent Journey

Product tiles keep the photograph, Bodoni name, subtitle and ordinary link together, with a hairline ending each tile. Shared format, unisex positioning and price appear once beside the scent-finder results rather than as repeated card tags. Filters have a 44px minimum target and bronze underline/pressed state. The visual family compass exposes accessible pressed buttons; its Fresh–Warm range has readable value text, and changed matches are announced without taking focus. Summaries align tabular item/subtotal/delivery/voucher/total values against readable labels; checkout uses secondary paper, while Cart's refined summary is a flat ruled column. The scent profile pairs a three-tier diagram with real HTML Opening/Heart/Dry-down labels and copy, followed by visibly adjacent draft-inference qualification pending maker confirmation. The diagram expresses proposed scent progression, not a measured result or wear-time claim.

### Retained Legacy Actions

Actions have square corners, a 56px minimum height, a fine border, and serif text. The primary action uses gold emphasis. Hover fills with warm white and turns text dark. Focus uses a visible gold outline.

Demo actions use body text, 4px corners and slate emphasis. The primary is at least 54px high, with white text; the secondary is at least 47px high, with an outlined white surface. Disabled actions retain a readable explanation of the missing completion requirement. Focus is a 2px slate outline with a 4px offset. Brief press and unlock feedback never postpones the completion rule.

### Navigation

The ordinary header places the dropper/wordmark, Shop, Our story, language and Cart in that order. Cart combines a drawn SVG cart icon, text and a live quantity count; “Bag” is not the customer-facing label. Mobile hides the text wordmark and Our story link, retaining Shop, language and Cart in one row. Element has no ordinary-storefront entry. The retained Element header uses a compact CSS display crop of the supplied original E and ELEMENT lettering, retaining its gold pixels; Element navigation is available only within its own routes. All navigation touch targets are at least 44px. The language disclosure uses full language names and a check for the current choice; its mobile trigger is abbreviated. It supports Tab, Escape, outside-click dismissal and remembers the choice across pages.

### Retained Collection Frames

Contact links are placed in context rather than in a new form or modal: Element
inquiries in its collection, press in About, general inquiries in both footers,
and care/order questions on Shop. Labels follow the selected language; addresses
remain unchanged. Links open the visitor's email app and do not imply ordering
or the Element service is available yet.

Element leads the collection section in a full-width feature with image and copy beside one another. Hours and Afterimage sit below, each occupying one column. Mobile stacks the three collections so each is discoverable without a horizontal swipe. Images may carry film treatment, but text remains HTML with useful localized alt text.

### Homepage Signature Media

The current home uses the established 48-frame portrait WebP sequence in a scroll-controlled canvas, so the falling drop stays in view without seeking a video on iOS. Full-width Hong Kong atmosphere surrounds the portrait plate. Larger real photographs carry the brief chapters: “Ready to give.” introduces the actual blue flower gift box; “Meet Natasha.” retains the owner-confirmed HKUST Biotechnology student and YAT.LIFESTYLE founder facts on two lines; “Close to you.” shows the perfume in hand before the YAT signature finish. On phones, the contained founder portrait uses 66% stage width while the gift and everyday images use the full width. The existing `storyMotion` and `dropTipGeometry` helpers retain the original timing, drop silhouette, tapered-neck repair and film-to-vector handoff. A passive native-scroll listener schedules canvas work through requestAnimationFrame; it does not intercept scrolling. The original cinematic composition, including its old collection promotions, stays inactive.

The filmed droplet hands off to a gold-gradient vector drop, which settles inside the A of a unified SVG wordmark. Letters appear after the drop begins settling; the name and tagline follow. The supplied logo image remains reference only. This is a provisional identity treatment, not final brand approval. Persistent HTML keeps HK$228, the 10 mL perfume/flower gift-box inclusion and Shop fragrances visible from the opening through the logo finish. Reduced motion uses the complete still-poster opening, omits all frame preload and collapses the story instead of requiring discrete chapter scrolling. Stable viewport units prevent mobile browser toolbar changes from stretching the story.

The opening backlight is static: its ambient animation is disabled and there is no Pause/Play control. Visitor-controlled scroll remains the only signature motion. Hidden tabs cancel pending canvas work and offscreen draws exit; reduced motion keeps the static opening and omits frame preload. No new raster, motion dependency or generated asset was added for the restoration.

The retained cinematic About section uses the existing generated workspace still with an explicit localized illustration caption. It must not imply the founder's actual laboratory. The current ordinary home uses the official evening and in-hand photographs together in About; the owner has identified the evening subject as founder Natasha, an HKUST Biotechnology student. The three-bottle photograph accompanies the actual gift-box photograph in Gift. Source files retain supplied framing and colour. Cinematic scene CSS uses saturation .8 and brightness .9, with Natasha's portrait lifted to brightness 1.2. The left shade eases from .82 to .1 opacity as her photograph appears, preserving the opening and other scene shading. The gift box and Natasha portrait use contain fitting to retain their full image in the scene. AI scent still lifes remain catalogue/product interpretations of accords, described by localized alt text and adjacent provenance files; the customer flow has no separate AI-caption paragraph. The real package remains the delivery reference. “Where science meets scent.” remains the house tagline.

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
- **Do** scope the ordinary-storefront palette and body action text; preserve Element's artwork and separate laboratory rules.
- **Do** preserve the golden droplet's scroll-to-signature identity, immediate shopping actions and complete static reduced-motion opening.

### Don't:

- **Don't** imply that unlaunched fragrances can be ordered.
- **Don't** invent laboratory methods, scent accuracy, or personalization outcomes.
- **Don't** use generated text or imagery as a substitute for readable page content.
