# Storefront motion

Interactive motion for the owner-requested droplet homepage and readable ivory shop. The homepage reuses the original film, renderer geometry and `storyMotion` / `dropTipGeometry` helpers in `app/droplet-journey.tsx`; `app/storefront.css` scopes its warm-charcoal stage beneath the ivory header. Action timing is authored here, not a measured brand standard.

| Brand quality | Verb | Useful moment | Static equivalent |
| --- | --- | --- | --- |
| Laboratory curiosity and Hong Kong memory | Follow, settle | The golden drop follows native scroll through current scent stories and resolves into the YAT signature | Complete still-poster opening with headline, price, package inclusion and shopping actions |
| Familiar shopping | Guide | Short arrow response on actionable links and buttons | Same labelled action and fixed hit area |

The retained 48 WebP frames come from the portrait Higgsfield film. A passive native-scroll listener schedules canvas drawing through requestAnimationFrame; scrolling is never intercepted. The original timeline drives frame selection, overlapping copy/photo fades and the filmed-drop handoff to a gold-gradient vector drop inside the A of the YAT mark. Letters, name and tagline follow its settling. The original taper repair caches only the affected neck textures. After the opening and story introduction, the first photograph shows the actual blue flower gift box, the second introduces Natasha as the HKUST Biotechnology student who started YAT.LIFESTYLE, and the third shows the perfume in hand for everyday use before the YAT finale. Old coming-soon and Element promotion stay inactive.

Natasha's portrait retains contain fitting with a scoped brightness of 1.2. Its existing photo-opacity signal eases the left shade from .82 to .1, making the portrait readable as it appears; this adds no new timing or scroll geometry. Other photographs retain saturation .8 and brightness .9, with the opening/other-scene shade unchanged.

The stage and its five scroll spacers use `100svh` minus the sticky store header (82px desktop, 76px at 760px and below). The opening is the three-line “Time. Place. You.” with a short perfume/Hong Kong introduction; gift, founder and everyday chapters use brief captions and larger real photographs. The decorative word axis is removed. The original timeline, canvas drawing and film-to-signature handoff are unchanged; no additional animation competes with the drop.

HK$228, 10 mL/flower gift-box inclusion and Shop fragrances remain visible in a full-width hairline shopping rail, with an outlined gold action and native link controls. The rail stacks on phones. Shop opens `/shop`; Skip story bypasses the journey to the home collection. The former 420ms in-hand photo clipping reveal is no longer active.

The retained opening backlight pulses over 3.8 seconds with `ease-in-out`, only while the initial drop is visible, and fades before the first frame change. The 44px Pause/Resume ambient-motion control remains mounted throughout the moving journey with its accessible label and pressed state; pausing ambient light leaves user-driven scroll available. Drawing exits offscreen, hidden tabs cancel pending animation frames and disable idling, and effect cleanup removes listeners and frame callbacks.

Action feedback uses 140 ms colour changes and a 4 px arrow translation inside a stable control. Native CSS retargets rapid hover changes. Filters and bag totals update immediately, without choreographed delays or simulated loading.

Arrow travel uses `cubic-bezier(.16,1,.3,1)`. Reduced motion uses the still poster with a complete readable opening; the long journey spacers, later scenes, signature finale, ambient light and pause control are removed. No image frames are preloaded in that mode. Shopping transitions and arrow travel are removed, while filters, totals and actions stay available immediately. The static stage remains one viewport beneath the header.

The scope is the ordinary storefront. The original `HomeExperience` remains an inactive historical reference, and Element keeps its own established motion. No new raster, dependency, payment or production-resource change is part of this restoration.
