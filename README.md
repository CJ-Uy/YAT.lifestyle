# YAT.lifestyle

Read only perfume brand site for Hong Kong. The App Router project uses React and
TypeScript through vinext, which builds to the Cloudflare Worker
`yat-lifestyle-prod` in the CJ-Uy account. The live site is
[yat-lifestyle-prod.cj-uy.workers.dev](https://yat-lifestyle-prod.cj-uy.workers.dev).

The site currently introduces Hours, Afterimage, and Element in English,
Traditional Chinese, and Simplified Chinese. Ordering is not available.
When ordering opens, delivery will initially be limited to Hong Kong addresses.

The Worker has D1 (`yat-lifestyle-prod-db`) and R2
(`yat-lifestyle-prod-assets`) bindings ready for later features. The current
read only page stores no visitor data and needs no migrations.

## Scripts

- `npm run dev` starts the vinext dev server.
- `npm run build` builds the Cloudflare Worker output.
- `npm run start` starts the built Worker locally with Wrangler.
- `npm run deploy` deploys the Cloudflare Worker.
- `npm test` runs the offline Seedance and scroll-motion checks.
- `npm run higgsfield:video -- "prompt"` generates a design video with Seedance 2.0.

## Higgsfield Seedance 2.0

Set `HF_CREDENTIALS` in `.env.local` to your `key-id:key-secret`. Enter it only
in that local file; never paste it into chat or commit it.

Generate with the documented defaults (5 seconds, 720p, 16:9, audio):

```powershell
npm run higgsfield:video -- "A cinematic tracking shot along a sunlit coastal road"
```

Optional flags are `--duration=4..15`, `--resolution=480p|720p|1080p|4k`,
`--aspect-ratio=16:9|4:3|1:1|3:4|9:16|21:9`, `--no-audio`, and `--force`.
Completed request metadata is stored in ignored `.higgsfield/requests/`; an
identical prompt and settings reuse the completed request unless `--force` is set.
The request ID is saved before polling, so rerunning the same command can resume
an interrupted request. `--force` sends a new billable request.

The scroll scene uses 48 small WebP frames derived from a silent Higgsfield
Seedance 2.0 video in `public/media/`. Scroll controls the falling drop and its
handoff to a gold-gradient vector drop inside an SVG YAT mark, not the reference
image. Chapters use alternating photographic compositions on desktop and
portrait layouts on phones. Reduced motion uses a still poster and discrete
chapter changes. Optimized WebP stills and generation records are in the same
directory. The About photograph is explicitly labeled as a generated illustration.
Site visitors never
call the Higgsfield API; credentials are only used by the local generation script.

Design context lives in `PRODUCT.md`, `DESIGN.md`, and `.impeccable/`.
