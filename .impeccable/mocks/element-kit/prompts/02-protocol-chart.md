Create a single protocol chart for the YAT.lifestyle Element at-home perfume test kit. Text accuracy matters, so build it as a hand-authored SVG (not with the image generation model). Save `.impeccable/mocks/element-kit/protocol-chart.svg` and, if any local tool can rasterize it (for example `npx playwright` screenshot, or another installed renderer), also `.impeccable/mocks/element-kit/protocol-chart.png` at 2400px wide. Create the folder if needed. Do not modify any other file in the repo and do not install global packages.

## Style
- Brand: read `DESIGN.md`. Ink background #080806, warm white text #f1eadc, muted #aaa499, liquid gold #d8a443 used only for the time axis, step numbers and highlights. Square edges, hairline rules (1px), no shadows, no rounded cards.
- Fonts: headings "Bodoni Moda", Georgia, serif; body "Trebuchet MS", sans-serif. Keep body text at least 14px at 1600px width.
- Landscape, viewBox 1600 x 1000 (extend height if needed so nothing is cramped). Leave generous margins.

## Content
Title: "Element Test Kit: the 31 minute protocol". Subtitle: "Clean skin first, faint scents next, perfume last. Survey questions fill the waiting time."

A horizontal time axis from 0:00 to 0:31 plus a separate block on the right for "+2h / +6h". Each step is a column or band placed at its start time, showing: step name, what the customer does (very short), and "Tells us" (very short). Group steps into four colored-by-hairline phases labelled: 1 Setup, 2 Clean-skin readings, 3 Smell tests, 4 On-skin and follow-up.

Steps:
1. 0:00 Setup - Still room, no fragrance, room temp. Tells us: how far to trust each result.
2. 0:03 Oil blot - Blot forehead and forearm, photo on lid. Tells us: oily or dry skin, how it may hold scent.
3. 0:06 Skin pH + control - Water ampoule, control strip plus 2 skin strips, photo. Tells us: skin acidity, read against the control.
4. 0:10 Evaporation start - Drop on hand and blotter, photo t=0. Tells us: how fast liquid leaves your skin.
5. 0:11 Sensitivity ladder - Coded vials, weakest to strongest. Tells us: how sensitive your nose is.
6. 0:17 Note panel - 6 blind strips, rate liking and strength. Tells us: notes to add, boost or avoid.
7. 0:20 Evaporation photo t=10.
8. 0:23 Base scents - Smell A to D, wear top 2. Tells us: the base we will tune.
9. 0:26 Lifestyle survey - Adaptive questions. Tells us: where and how you wear scent.
10. 0:29 Distance test - 10 / 30 / 60 cm. Tells us: close or carrying.
11. 0:30 Finish - Evaporation photo t=20, first pick.
12. 0:31 pH finale (optional) - Lemon drop turns the strip.
13. +2h / +6h Follow-up - Re-smell forearms. Tells us: longevity through the day, final pick.

Also mark small "RESET" pause markers (a thin gold tick labelled RESET) before steps 6 and 8, and a running band along the bottom from 0:10 to 0:30 labelled "Evaporation running in the background (photos at t=0, 10, 20)".

Footer line in muted text: "Draft concept. Evidence and wording: see Element Test Kit doc v2."

Check the SVG renders without overlapping text. When done, list saved file paths.
