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
---

# Design System: YAT.lifestyle

## Overview

**Creative North Star: "Afterimage Hong Kong"**

The site feels like a quiet fragrance film viewed through laboratory glass. Carbon black holds the frame, warm white carries the story, and gold marks a few deliberate points of attention. Hong Kong appears through specific light, transit, water, and memory.

Motion follows the drop and the visitor's scroll. It never hides navigation or the meaning of a collection. The dropper remains the signature form while the final brand logo is unresolved.

**Key Characteristics:** restrained gold, optical glass, film grain, hairline rules, generous type, specific Hong Kong imagery.

## Colors

Liquid gold is the sole accent. Ink and carbon provide the main field; warm white carries primary copy, muted gray supports it, and paper creates one light section for a change in pace.

**The Rare Gold Rule.** Reserve gold for the wordmark, key actions, section indices, focus, and small optical details. Large gold fields belong only to deliberate chapter changes.

## Typography

Use Bodoni Moda for the wordmark, headings, navigation, and prominent calls to action. Use the body stack for paragraphs and controls; its Chinese fallbacks must remain readable in both scripts. Short uppercase labels use wide tracking.

The hero display size is `clamp(3.4rem, 5.35vw, 5.65rem)` on desktop. Section headings use `clamp(3rem, 5vw, 5.7rem)`. Body copy stays near 64 characters per line or less.

**The Readable Frame Rule.** Keep text clear against every video frame and still image. Never place essential words inside generated media.

## Layout

The fixed header is 82px high on desktop and 96px on small screens. Main content uses horizontal padding of `clamp(1.25rem, 4.5vw, 4.75rem)`. Desktop compositions pair a readable text field with a larger media field. Below 1000px, navigation becomes a native disclosure. Below 680px, content stacks and collection previews scroll horizontally.

The first viewport gives visitors a headline, a plain description, direct collection and story links, launch status, and the pipette. The story can be bypassed through the navigation and anchors.

## Elevation & Depth

The interface uses no card shadows. Depth comes from dark tonal layers, glass highlights, a soft film texture, and photographic or video media. Borders are thin and quiet.

## Shapes

Most interface edges are square. Fine rules, film perforations, contact sheets, and registration marks create precision. The pipette and droplet supply the main curves. Do not add rounded cards or pill controls without a concrete need.

## Components

### Actions

Actions have square corners, a 56px minimum height, a fine border, and serif text. The primary action uses gold emphasis. Hover fills with warm white and turns text dark. Focus uses a visible gold outline.

### Navigation

The fixed header holds the wordmark, section links, language buttons, and launch status. Mobile uses a native `details` menu. All touch targets are at least 44px. English, Traditional Chinese, and Simplified Chinese receive equal treatment.

### Collection Frames

Three contact sheet frames pair a local image with a collection name, short description, and status. Images may carry film treatment, but text remains HTML with useful localized alt text.

### Signature Media

The hero layers a Higgsfield film and an authored pipette canvas behind readable copy. Scroll moves the pipette and story stage. Reduced motion uses a still poster and a fixed canvas frame, without a running animation loop.

## Do's and Don'ts

### Do:

- **Do** use specific Hong Kong sensory details and real product facts.
- **Do** keep launch and purchase availability clear.
- **Do** preserve keyboard focus, reduced motion, and full language coverage.

### Don't:

- **Don't** imply that unlaunched fragrances can be ordered.
- **Don't** invent laboratory methods, scent accuracy, or personalization outcomes.
- **Don't** use generated text or imagery as a substitute for readable page content.
