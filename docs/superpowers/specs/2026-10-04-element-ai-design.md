# Element AI: photo reading, adaptive survey, nose model, note graph tuning

Date: 4 October 2026. Status: draft for review. Companion to `2026-10-03-element-site-and-demo-design.md` (pages and flow). Everything runs on Cloudflare; model calls go through Workers AI and AI Gateway.

## What the AI must do (and what it must not claim)

Turn one person's kit results and answers into a tuned version of one of six base perfumes, with a plain reason for every change, for the perfumer to approve. It must never invent a measurement, never claim medical meaning, and never let a language model change the formula on its own: numbers come from measurement and rules; the language model explains and asks.

## Inputs

| Input | Source | Form |
| --- | --- | --- |
| Blot photos (T-zone, optional neck) | Lid zone 1 | JPEG, re-encoded on the phone (EXIF stripped) |
| pH photo (skin + control strips, wet) | Lid zone 2 | JPEG |
| Sensitivity ladder | 4 shuffled vials: blank, weak, medium, strong | per vial: smelled yes/no, strength 0-3 |
| Blind ratings of bases A-F | 6 shuffled bases, one per fragrance family | per base: liking 1-5, strength 1-5 |
| Base pick | top 2 worn, final pick after follow-up | base id |
| Adaptive survey | question bank + AI follow-ups, chips or voice | answers, tags |
| Conditions | setup checklist, room temperature, cold/smoker | flags |

Kit codes map letters and vial numbers to contents server-side, so the blind tests stay blind.

## Pipeline

```
photos ──► Photo reader (on the phone: OpenCV.js) ──► skin readings (oil, pH, confidence)
                     └─► Vision check (Workers AI) ──► placement/glare QA, plain-language note
ladder + A-F ratings ──► Nose model (trained on Keller 2016) ──► nose type, sensitivity, family likes
survey (+voice) ─────► Survey engine (bank + Workers AI LLM, Whisper, bge-m3/Vectorize) ──► lifestyle tags
                                   all of the above
                                          ▼
                         Note graph tuning (D1 graph + rules) ──► formula changes with reasons
                                          ▼
                     Explainer (Workers AI LLM, constrained) ──► result text in 3 languages
                     Label art (Workers AI image model) ──► share card image
```

### 1. Photo reader (on the phone, OpenCV.js)

- Decided 4 Oct: runs in the browser with OpenCV.js (OpenCV compiled to WebAssembly, ArUco module included), so there is no server cold start or network dependency on stage, and the photo never needs to leave the phone to be measured. The same algorithm is prototyped and tested in Python (`opencv-contrib-python-headless`, which already detected all 8 markers on real lid photos on 3 Oct) and ported line for line. The ~8 MB WASM file is preloaded during the welcome and setup screens and cached by the service worker. The straightened zone image and the readings are uploaded to R2/D1 afterwards for the vision check and the record.
- Steps per photo:
  1. Detect ArUco markers (DICT_4X4_50). Zone 1 needs IDs 0-3, zone 2 needs 4-7; missing markers return a specific retake message ("the sheet is covering a corner").
  2. Perspective-warp the zone to its millimetre layout from `public/kit/lid-board.json`.
  3. Colour-correct with the zone's printed white, grey and black patches (per-channel linear map).
  4. Blot: measure the sheet's dry border and its darkest regions inside the 80 x 50 mm guide; score oil 0-1 from how far it moves from dry towards the calibrated "fully clear over black" colour; report percent of area above thresholds. Blue scale steps give a 1-6 display value.
  5. pH: sample the three pads of each strip at the known pad positions; compare skin and control pads to the 12 printed chart rows in a perceptual colour space (CIELAB, ΔE); interpolate between the two nearest rows. Report skin pH, control pH and the difference, each with confidence from the ΔE gap.
  6. Quality flags: glare (clipped white patch), shadow (uneven patch brightness), blur, flash suspected.
- Produces readings JSON plus the straightened zone image (shown in the demo: "corners found, photo straightened").
- Readings are stored with method version so they can be recomputed later.

### 2. Vision check (Workers AI)

A vision model looks at the straightened zone and answers fixed questions in JSON: is a sheet/strip present, is it inside the guide, are pads wet, is there glare. It can block a bad photo but never sets the numbers. Candidates on Workers AI: `@cf/meta/llama-4-scout-17b-16e-instruct` (vision) or `@cf/mistralai/mistral-small-3.1-24b-instruct`; pick by a quick test on our real photos.

### 3. Survey engine

- **Question bank** (JSON, in the repo): about 40 questions grouped by topic (routine, climate exposure, activity, social settings, scent memories, dislikes), each with answer chips, tags per chip and text in English, Traditional and Simplified Chinese. Health, religion, sexuality and income are never asked.
- **Next question:** a Workers AI LLM receives the tags so far, the topics covered and the candidate questions, and returns JSON: the next question id and optionally one short follow-up it writes itself. Guardrails: banned topics list, 120-character limit, same language as the user, at most 3 AI-written follow-ups per session, 10-15 questions total. If the call fails, is slow (over 3 s) or breaks a rule, the engine picks the next uncovered topic from the bank. Candidate model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (supports JSON mode); `@cf/openai/gpt-oss-120b` as an alternative.
- **Voice answers:** Workers AI `@cf/openai/whisper-large-v3-turbo` transcribes; the text is embedded with `@cf/baai/bge-m3` (multilingual) and matched in Vectorize against tag descriptions; the top tags are shown back to the user to confirm.
- Every question is stored exactly as shown (AI follow-ups differ per person).

### 4. Nose model (trained, served on Cloudflare)

- **Data:** Keller & Vosshall 2016, BMC Neuroscience: 55 people rated 480 molecules at two concentrations for intensity, pleasantness, familiarity and 20 descriptors. CC BY 4.0 (Additional file 1; also on Pyrfume as `keller_2016`). Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC4977894
- **Mapping to our families:** each molecule is assigned to our six families by its mean descriptor ratings (flower → floral; wood → woody; musky → musk/amber; fruit + sour → citrus; grass → green; warm + sweet + spices → amber). Molecules that fit no family are dropped.
- **Features per person:** mean pleasantness per family, intensity at low vs high concentration (a sensitivity proxy), rate of rating weak stimuli as odourless.
- **Model:** k-means on standardised person vectors to find nose types (k chosen by silhouette, expected 4-6), each type named by its profile ("fresh-leaning, musk-quiet"). A ridge regression per family predicts liking of families the user did not rate strongly, from the ones they did.
- **Inference in the Worker:** the user's A-F ratings (each base is one family) and ladder result form the same vector; nearest centroid gives nose type; the ridge weights fill gaps. Model weights are a small JSON file bundled with the Worker (no runtime training).
- **Honest evaluation:** leave-one-person-out error of the family-liking prediction against a "predict the average" baseline, reported in the repo. If the model does not beat the baseline, the pitch says "nose types" only, not prediction.
- **Ladder scoring:** smelled the blank = false alarm, which lowers trust in all smell answers; missed the strong vial = possible blocked nose, which flags the result; otherwise sensitivity = weakest vial detected (high, medium, low).
- Training lives in `scripts/train-nose-model.py`; output `lib/element/nose-model.json`.

### 5. Note graph and tuning

- **Graph in D1:** nodes are notes (bergamot, yuzu, neroli, green tea, fig leaf, vetiver, sea salt, osmanthus, jasmine, cedar, sandalwood, vanilla, benzoin, tonka, musks and so on) with family, tier (top, heart, base) and typical longevity. Edges: note-to-note harmony (curated pairs plus co-occurrence counts) and trait-to-note effects.
- **Base formulas:** each of the six bases is a weighted note list by tier (sample recipes, marked as samples until the perfumer supplies real ones).
- **Trait effects (curated rules, perfumer-editable):** examples
  - dry skin (low oil) → raise base-tier weight, prefer longer-lasting notes
  - oily skin → keep heavy base notes lower
  - high sensitivity → lower overall concentration; low sensitivity → higher
  - post-gym, humid outdoor → fresher top notes (citrus, green, water)
  - air-conditioned office, close quarters → lower projection, skin-close musks
  - musk-quiet nose → do not rely on musks for longevity
  - scent memory tags (for example a hiking trail) → small accent from the matching family
  - pH is recorded and shown, but carries no formula effect (evidence too weak)
- **Tuning algorithm:** retrieve the subgraph around the chosen base's notes and the user's active traits (GraphRAG-style retrieval); sum the trait effects on each note; cap each change at ±20% and the total change at 30% so the result stays recognisably the base; add at most two accent notes connected to the base by harmony edges; renormalise; choose concentration (EDT/EDP) from sensitivity and skin.
- **Output:** list of changes `{note, from, to, reason_trait_ids}` plus concentration and projection target. Deterministic for the same inputs.

### 6. Explainer (Workers AI LLM, constrained)

Receives only the computed changes and the traits behind them, and writes one plain sentence per change plus a short summary, in the user's language. It cannot add, remove or resize changes; output is checked against the change list and replaced by template sentences if it mentions anything else. Ends with "A perfumer reviews every formula before mixing."

### 7. Profile, compare and label art

- **Profile vector:** family likes (6), sensitivity, projection preference, top lifestyle tags.
- **Compare:** cosine similarity of family likes and tag overlap gives a percentage, the strongest shared family and the biggest difference; one generated sentence ("You both love woody; Sam can't smell most musks").
- **Label art:** Workers AI image model (`@cf/black-forest-labs/flux-1-schnell`, or `flux-2-klein-4b` if faster) from a prompt built from the profile, in the brand palette, no text in the image. Used on the share card.

## Cloudflare setup

- Site Worker (`yat-lifestyle-prod`): add `ai` binding, AI Gateway id `yat-element` (logs, caching, cost per session for the Q&A dashboard), Vectorize index for tag descriptions, D1 tables (sessions, readings, answers, results, profiles, auth codes, note graph), R2 for photos and label art.
- Email Service for sign-in codes (sender domain verification on yatlifestyle.com).

## Timeouts and fallbacks (the demo must never dead-end)

| Step | Budget | Fallback |
| --- | --- | --- |
| Photo reader (on phone) | 6 s, or OpenCV.js not loaded | "Use sample photo" readings, marked as sample |
| Vision check | 4 s | skip the check, keep the numbers |
| Next question | 3 s | next bank question by topic |
| Voice | 6 s | show chips instead |
| Explainer | 6 s | template sentences |
| Label art | 10 s, async | brand pattern image |

## Privacy

Photos show the lid, not the person. Photos and skin readings are private, deleted after 90 days unless the user keeps them; profiles share only family likes, nose type and chosen tags. Consent recorded per session; 18+.

## Build order

1. Photo reader: Python prototype on our real photos, then OpenCV.js port with the same test photos.
2. Nose model training and evaluation; JSON weights.
3. Note graph seed data and tuning function, with unit tests.
4. Survey bank and engine with fallback; then AI follow-ups; then voice.
5. Explainer, compare, label art.
6. AI Gateway dashboard check before the pitch.

## Open questions

1. Resolved: sample recipes for now; the founder supplies real ones later.
2. Vision model: test Llama 4 Scout and Mistral Small 3.1 on our real photos and pick; ask for new photos if needed.
3. Resolved: photo reading runs on the phone (OpenCV.js); no Container.
