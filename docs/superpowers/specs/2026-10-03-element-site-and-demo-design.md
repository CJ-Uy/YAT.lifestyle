# Element page, demo walkthrough and home page changes (hackathon)

Date: 3 October 2026. Status: draft for review. AI internals (photo reading, trained model, note graph, survey engine) get their own spec; this one covers the pages, the flow and what each screen needs from the AI.

## Goal

Judges scan the QR on the lid or end card, land on `/element/demo` on their phone, and walk through the full Element journey in about 5 minutes: onboarding, staged lid photos, adaptive survey, smell steps, an AI "building your formula" moment, the tuned result and a share card. The home page leads with Element for the hackathon; Hours and Afterimage move after it as "regular lines".

Success: a judge with no kit can finish the demo on their own phone; every AI step visibly does something; nothing claims more than the research supports.

## Mobbin patterns used

| Pattern | Reference | Use |
| --- | --- | --- |
| Intro screen that frames the questions ("we'll use your answers to...") then one question per screen with a progress bar | [Life Reset](https://mobbin.com/flows/e91bc9a4-db92-449a-8de2-2d5e81381f6b), [Calm Sleep quiz](https://mobbin.com/flows/6057bb13-1765-48cc-8cfa-09b0ef8e7107) | Welcome and survey |
| Large tappable option cards with icon + one-line explanation | [Lovi questionnaire](https://mobbin.com/flows/4f825f5b-7b5f-4550-93e5-556c45531194) | Survey chips, base scent pick |
| "Cross-checking" analysis screen with per-category progress bars, then "Based on your answers..." reveal | [Noom plan setup](https://mobbin.com/flows/0f88ecd3-ceb0-43d1-af33-6feafe56928b) | The AI "building your formula" moment |
| Camera with corner-bracket frame and "place the object within the frame", then confirm / retake | [CapWords](https://mobbin.com/flows/64d167d2-7622-4104-838d-e0fdb471fe96) | Lid zone capture |
| Big countdown with "up next" step and pause | [Centr](https://mobbin.com/flows/4fe5de97-f60a-40ea-8ee0-235361769394), [Runna](https://mobbin.com/flows/38f02bdd-0587-4849-bee2-d2f52ca5750b) | 60 s pH timer, reset pauses |
| Result screen with a disclaimer line, then a branded share card | [Shop skincare results](https://mobbin.com/flows/d518d090-34c2-4b37-b1fe-dd9e395a965d) | Result and share card |
| Swipeable share cards on dark, "share link" so a friend can try | [pliability](https://mobbin.com/flows/40d0b26e-2894-4423-b799-e355bfd7153b) | Share card, "try this formula" link |
| Numbered "How it works" with an image per step | [Function](https://mobbin.com/sites/sections/7c72acdf-c8a3-425c-b7a6-2e0c487bb17c), [Superpower](https://mobbin.com/sites/sections/4f88b0b2-0b0a-4f83-abba-cc5971bd13b8) | `/element` landing |

Style stays ours (DESIGN.md: ink, warm white, rare gold, square edges, Bodoni headings), not these apps' colours.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home, reworked to lead with Element (below) |
| `/element` | Element landing page (desktop and mobile) |
| `/element/demo` | Guided walkthrough, mobile first, works on desktop |
| `/element/p/[id]` | Shared scent profile: compare with me, gift, try this formula |
| `/element/compare/[a]/[b]` | Compatibility result between two profiles |
| `/element/login` | Email + 6-digit code sign-in |
| `/element/me` | Your profile, privacy toggle, share QR |
| `/api/element/*` | Session, auth codes, photo upload, readings, survey next-question, result, compare |

## Home page changes (hackathon only)

1. Hero: Element logo and "Find your element. Smell like yourself." with "Try the demo" (to `/element/demo`) and "How it works" (to `/element`). Keep the drop film as the backdrop.
2. Scroll story: Element becomes the first and longest chapter (lab glass, pH strip colour change, lid photo). Hours and Afterimage shrink to one closing chapter, "Also from YAT.lifestyle".
3. New "Regular lines" section after the story: Hours and Afterimage as two smaller frames, marked as ideas in development.
4. Navigation: "Element" first, with a gold "Try the demo" action; Hours and Afterimage under "Regular lines".
5. Remove the Shop CTA from the hero for now; keep the page.

## `/element` landing sections

The landing page is as cinematic as the home page: a scroll-driven story in the same visual language (drop film, lab glass, gold rarely), not a plain marketing page. Candidate story: the drop falls into the kit lid, the lid board lights up zone by zone as the test is told, the note graph assembles, and the drop settles into the Element "E". Reduced motion gets still frames, as on home.

Below the story, a **Lab notes** area with three tabs, each also a deep-linkable page:

- `/element/ai`: how we built the AI. Pipeline diagram, photo reading (markers, warp, colour correction, with real before/after images), the nose model (dataset, method, honest evaluation numbers), note graph tuning rules, what the language model is and is not allowed to do, Cloudflare stack.
- `/element/science`: smell and emotion/memory, receptor genes, skin and longevity, pH (and why we record it but do not tune on it), why no coffee beans, the pause.
- `/element/research`: every claim with its verdict and linked source, generated from the reviewed research notes (`research_notes/claims-review.md`), plus market and pricing evidence. Each claim on the other pages links to its entry here.

Sections of the story:

1. Hero: logo, tagline, sub-line "Tested by you. Fine-tuned by AI.", Try the demo, price line.
2. Problem: "Ten sprays in, everything smells good."
3. Science: the two fixed lines plus relay, confidence and receptor genes, with sources in small print.
4. How it works, 3 steps: Test at home (30 min) / AI reads you / Your bottle, perfumer approved.
5. What's in the kit: flat-lay image and item list; lid board explained in one line.
6. The AI: note graph visual with what each input changes.
7. Honest science: coffee beans and the saline pause.
8. Pricing: Lab kit + tuned 50 ml bottle HK$988; Discovery kit HK$188.
9. FAQ: hard questions from the research doc, in plain words. "Not a medical device".
10. Closing CTA and QR.

## `/element/demo` flow

One task per screen, progress bar on top, back button, big bottom action. Every capture screen has "Use sample photo" so judges without a kit can continue; sample photos are real lid shots we take tonight.

| # | Screen | What happens | AI shown |
| --- | --- | --- | --- |
| 0 | Welcome | Logo, "A 30-minute lab, in your hands", what we'll measure, Start. Toggle: "I have a kit" / "Try with sample photos" (default for judges) | |
| 1 | You | First name, email optional in demo, 18+ and consent checkboxes. Kit code prefilled `DEMO` | |
| 2 | Set up | Checklist: still room, no perfume today, daylight no flash. RESET dish: pour the saline | |
| 3 | Blot | Instruction card (T-zone, 10 s, no rubbing), then camera with zone 1 frame, confirm/retake | Live reading chip: corners found, oil level on the 1-6 scale, see-through areas |
| 4 | pH | Instruction card (2 drops on forearm, dry strip in the drop), 60 s countdown, control strip, then camera zone 2 | pH estimate for skin vs control, with a confidence note |
| 5 | Survey | 8-12 adaptive questions, one per screen, tap chips, optional voice answer. Interleaved as "while you wait" during timers in kit mode | Each answer shows the tags it produced; follow-up questions appear |
| 6 | Smell | Sensitivity ladder (tap which vials smell), RESET pause screens with a short timer, blind strip ratings (sliders), pick 2 of bases A-D | Nose type from the trained model |
| 7 | Building your formula | Noom-style screen: progress bars for Skin, pH, Nose, Lifestyle, then "Based on your results, {name}..." | The whole pipeline, visibly |
| 8 | Your formula | Chosen base, note graph animation, formula bars shifting with one-line reasons ("Drier skin: more base notes so it lasts"), "A perfumer reviews every formula", CTA "Order HK$988" (disabled: coming soon) | Note graph tuning, explanations |
| 9 | Share | Branded card (Element logo, your elements, AI label art), Share link, "Friends can try your formula" | Generated label art |

Timeouts and failures: if any AI call fails or takes over 8 s, show the reading as "estimated" from the sample data and continue. The demo must never dead-end on stage.

Accessibility and language: buttons at least 44 px, reduced motion respected, English first for the hackathon (Chinese later; see open questions).

## Data the pages need

- D1: `element_sessions` (id, kit code, name, consents, mode demo/kit, created), `element_readings` (session, test, raw value JSON, photo key, derived value JSON, method version), `element_answers` (session, question text as shown, answer, tags, source bank/AI), `element_results` (session, base, adjustments JSON, explanation, share id).
- R2: photos at `element/{session}/{test}-{n}.jpg`, re-encoded client side to strip EXIF.
- Static: lid layout from `public/kit/lid-board.json`, sample photos, question bank JSON.

## Build order (critical path first)

1. `/element/demo` skeleton with all screens and sample data, no AI (so the video can be recorded early).
2. Session and storage API (D1, R2).
3. Photo reading for zone 1 and zone 2.
4. Survey engine (bank first, AI follow-ups second).
5. Trained nose model and note graph tuning, result screen.
6. Share card and `/element/p/[id]`.
7. `/element` landing.
8. Home page changes.
9. Add-ons: label art, voice answers.

## Decisions (3-4 October)

- **Domain and QR:** `https://yatlifestyle.com/element/demo` is live and is what the lid QR encodes. Every QR the app generates (share links, profile, compare) uses the same style as qr.cjuy.dev: rounded dark-gold modules, Element "E" in a white circle in the centre, error correction level H, verified with ZXing (OpenCV cannot read rounded modules).
- **Languages:** English, Traditional Chinese and Simplified Chinese, like the rest of the site.
- **Order and gift buttons:** active; both open the existing newsletter waitlist (`/shop` signup), with the source recorded.
- **Accounts:** email plus a 6-digit code (Cloudflare Email Service from yatlifestyle.com; sender domain needs SPF/DKIM setup). No passwords. `/element/demo` never asks for an account: the email screen shows "Continue with demo account".
- **Social, scoped to the scent profile (not a general perfume network):**
  - Profile page per user: their elements (nose type, lifestyle tags), tuned formula, perfumes they already love (any brand). Private by default; sharing creates an unlisted link and a branded QR. Skin, oil and pH readings are never public.
  - Compare with a friend: compatibility score and the main differences. In the demo, a ready-made founder profile is always available to compare with, and a judge can scan another judge's share QR to compare live.
  - Gift with their profile: buy a tuned bottle for a friend from their profile; for now the button opens the waitlist.
  - Pitched as next steps: follows, a feed, "people like you chose".
- **Six base scents, shown blind as A-F.** The letter-to-scent mapping is shuffled per kit (part of the kit's server-side code key). The real name and family are revealed only after the pick. Working set below, to be confirmed by the founder:

  | Base | Family | Main notes |
  | --- | --- | --- |
  | Hours · Dawn | Fresh, citrus | bergamot, yuzu, neroli, light musk |
  | Afterimage · Tea | Fresh, green | green tea, fig leaf, vetiver |
  | Afterimage · Harbour | Fresh, water | sea salt, ozonic notes, clean musk |
  | Hours · Noon | Floral | osmanthus, jasmine, peony |
  | Afterimage · Forest | Woody | cedar, cypress, sandalwood |
  | Hours · Night | Amber | vanilla, benzoin, tonka, soft musk |

  Rationale: covers all four families of the Michael Edwards fragrance wheel, weighted to fresh because light, fresh, floral and tea scents are reported as favoured in humid Hong Kong (industry blogs, not hard data). All six belong to Hours or Afterimage, so Element also sells the collection.
- **Sensitivity ladder: 4 vials, shuffled per kit.** Blank (carrier only, the same liquid the odorant is dissolved in), weak, medium, strong. Each answered "smell anything? how strong 0-3". The blank catches false alarms (suggestibility or guessing) and down-weights the other smell answers; the strong vial is a positive check that flags a blocked nose or skipped steps. Signal-detection framing. The test odorant must not appear in the six bases.
- **Demo smell steps:** judges pretend to smell and tap an answer; the AI reacts to whatever they choose.
- **Reset between smells:** the physical demo kit has no RESET or SPENT dish, so the app runs a timed pause (breathe, smell your inner elbow, about 30 seconds). Video Beat 3 line changes to "the app makes you pause and give your nose a minute".
- **Error pages:** custom YAT.lifestyle 404 and error pages in the brand style (copy to be written).
- **Lid board:** final layout is `public/kit/lid-board.pdf` (v12), generated by `scripts/make-lid-board.py`; slot positions in `public/kit/lid-board.json`.
