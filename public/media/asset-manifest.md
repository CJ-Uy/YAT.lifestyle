# Approved home composition asset manifest

## Ready now

- `element-daylight-lab-original.png` and `element-daylight-lab.webp`: Element's new daylight laboratory still life, generated with the built-in OpenAI image tool on 2026-09-25, 1024 x 1536. Warm ivory bench, amber liquid and restrained glassware align with Hours and Afterimage. Quality-86 WebP derivative; full prompt in `element-daylight-lab.json`. A conceptual illustration, not the actual founder's laboratory.

- `hours-clock-tower-original.png` and `hours-clock-tower.webp`: generated architectural study of the Tsim Sha Tsui Clock Tower for Hours, replacing the harbour image in the collection and scroll chapter. Landmark reference: https://www.discoverhongkong.com/eng/place-to-go/travel.guide-clock-tower.html. Conceptual unobstructed view, not documentation of current maintenance conditions.
- `afterimage-morning-tea-original.png` and `afterimage-morning-tea.webp`: generated Hong Kong windowsill, tea and morning light for Afterimage, as requested by the user. Both new assets use built-in OpenAI generation, 1024 x 1536, with quality-86 WebP derivatives and full prompts in adjacent JSON files. No Higgsfield credits used.

- `hong-kong-beginning-original.png` and `hong-kong-beginning.webp`: About-exclusive Hong Kong workspace at dusk, generated with the built-in OpenAI image tool on 2026-09-25. A conceptual illustration, not the founder's real premises. The quality-86 WebP retains the original composition; full prompt and provenance are in `hong-kong-beginning.json`.

- `shop-first-edition-original.png` and `shop-first-edition.webp`: Shop-exclusive smoked-glass perfume concept, generated with Higgsfield SOUL Cinema on 2026-09-25, 1152×2048. The WebP is an optimized quality-86 derivative, with no retouching. Full prompt, settings and request ID are in `shop-first-edition.json`. It is labelled as a generated concept, not final packaging; the existing laboratory photograph remains on the homepage.

- `hong-kong-harbour-afterimage.mp4`: Higgsfield Seedance 2.0 hero plate, 5 seconds, 720p, 16:9, silent.
- `hong-kong-harbour-afterimage-poster.jpg`: reduced-motion poster extracted from the approved hero plate.
- `hong-kong-drop-mobile.mp4`: Higgsfield Seedance 2.0 portrait pipette and falling drop, 5 seconds, 720p, 9:16, silent.
- `hong-kong-drop-mobile-poster.jpg`: reduced-motion poster from the portrait film.
- `drop-sequence/frame-000.webp` through `frame-047.webp`: 48 scroll-controlled frames derived from the first four seconds of `hong-kong-drop-mobile.mp4` at 12 fps, native 720×1280, WebP quality 90. A mild luminance-only unsharp filter restores edge definition without AI upscaling. No additional API request was made for these frames. Rebuild with `ffmpeg -i public/media/hong-kong-drop-mobile.mp4 -vf "fps=12,unsharp=5:5:0.35:3:3:0" -frames:v 48 -start_number 0 -c:v libwebp -quality 90 -compression_level 6 public/media/drop-sequence/frame-%03d.webp` (add `-y` to replace existing derivatives). The source MP4 is preserved.
- `yat-logo-reference.jpg`: user-supplied logo reference. The page builds the dark lockup as SVG, with a gold-gradient vector drop handed off from the filmed drop. The reference image is not rendered.
- `hours-dawn.png`: synthetic Hong Kong harbour at first light, retained as the landing background only.
- `afterimage-tram.png`: synthetic vintage tram interior, retained with its WebP for possible future use; no longer displayed in Afterimage.
- `element-lab.png`: original dark pipette and sample-tube still life, preserved but no longer displayed.
- `hours-dawn.webp`, `afterimage-tram.webp`, `element-lab.webp`: preserved optimized derivatives of the corresponding PNG originals. The harbour remains the landing background; the tram and dark laboratory images are saved but unused. About has its own workspace illustration.

The original generated images have adjacent JSON sidecars and embedded prompt metadata. The derived scroll frames inherit the portrait film's provenance.

## Produce later as image-native media

- Hours frames: Hong Kong dawn and public-transit moments.
- Afterimage frames: harbour, ferry, tea steam, forest rain, and place-memory details.
- Element frames: pipette, test tubes, and real laboratory glass without unsupported scientific claims.
- Origin frames: founder-safe laboratory work and Hong Kong source material once authentic photography is available.
- Subtle 35mm grain and edge light-leak textures, bounded away from body copy.

## Build without generated imagery

- Opening light: a soft champagne-gold backlight pulses behind only the drop. A small CSS radial gradient sits below the filmed canvas, with no tracing lines or pipette-wide overlay. Animation pauses offscreen, when the tab is hidden, or with the pause control. Reduced motion disables it. It fades out before the first scroll-frame change. No new video or API request.

- CSS: contact-sheet rails, hairline rules, focus states, and projection masks.
- Semantic HTML: navigation, locale controls, collection chapters, labels, copy, calls to action, availability, and footer.

The approved comp is reference-only and must not be cropped into production assets.
