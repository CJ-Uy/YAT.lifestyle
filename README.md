# YAT.lifestyle

Read only perfume brand site for Hong Kong. The App Router project uses React and
TypeScript through vinext, which builds to the Cloudflare Worker
`yat-lifestyle-prod` in the CJ-Uy account. The live site is
[yat-lifestyle-prod.cj-uy.workers.dev](https://yat-lifestyle-prod.cj-uy.workers.dev).

The site currently introduces Hours, Afterimage, and Element in English,
Traditional Chinese, and Simplified Chinese. Ordering is not available.
When ordering opens, delivery will initially be limited to Hong Kong addresses.

The Worker uses D1 (`yat-lifestyle-prod-db`) for optional newsletter signups.
R2 (`yat-lifestyle-prod-assets`) is also bound. Shopping remains unavailable.

## Newsletter and privacy

`/shop` collects email addresses with separate, unchecked marketing consent and
privacy acknowledgement. `/privacy` contains the collection statement and starter
privacy policy in all three languages. Records include language, consent wording,
policy version, timestamp, source and `unverified` status. Addresses are normalized
and unique; duplicates do not overwrite consent or reactivate withdrawn signups.
There is no public list/export endpoint. No email is sent by this feature.

Apply the additive migration before running or deploying the signup:

```powershell
npx wrangler d1 migrations apply yat-lifestyle-prod-db --local
npx wrangler d1 migrations apply yat-lifestyle-prod-db --remote
```

`POST /api/newsletter` requires a same-origin JSON request, a valid address,
supported language, both consent flags and the current policy version. It bounds
the request to 4 KB, uses parameterized SQL, and returns the same success response
for new/duplicate addresses. It never logs submitted addresses. A honeypot and a
Cloudflare rate limiter (10 attempts per minute per IP per location, namespace
92624001) reduce simple abuse. This is not bot-proof or a global quota; shared IPs
may be temporarily limited. Add Turnstile if abuse becomes material.

Owner checklist before collecting real signups:

- Activate and monitor `hello@yatlifestyle.com` for privacy and opt-out requests.
- Review `/privacy` against your actual legal identity, providers, retention and
  practices. It is a starter policy, not a guarantee of legal compliance.
- Restrict Cloudflare account/database access to authorised people. Do not paste
  subscriber lists into chat, logs, source control or public files.

Before sending any campaigns, connect a mailing provider, verify address ownership
(double opt-in is recommended), support an unsubscribe link in every message,
review stale signups and update the policy for that provider. Never treat the
current `unverified` rows as a verified mailing list.

Privacy requests are handled manually by the owner through the monitored inbox.
For opt-out, verify the requester's address, set that row's status to
`unsubscribed`, and minimise other fields no longer needed. Keep the address only
where needed to honour suppression. For deletion, remove the exact verified row
and any copies held by mail providers, subject to justified legal retention.
Never export a list merely to process one person's request. Review retained data
before every campaign. Changes to consent require a new version in
`lib/newsletter.ts`; preserve historical wording in Git and existing rows.

## Contact email setup

The site publishes these `mailto:` links at the owner's request. Publishing a
link does not create an inbox or confirm email delivery. Configure these addresses
with your email provider, either as inboxes or aliases to a monitored inbox:

| Address | Placement |
| --- | --- |
| hello@yatlifestyle.com | Home and Shop footers, general inquiries |
| care@yatlifestyle.com | Shop, customer care |
| orders@yatlifestyle.com | Shop, order and delivery questions (orders are not open yet) |
| element@yatlifestyle.com | Element collection, personalization inquiries |
| press@yatlifestyle.com | About, media and collaborations |

Before relying on them, send a message from an external account to each address,
confirm receipt, and confirm you can reply using the same brand address. This
change does not configure DNS, forwarding, mailboxes, or automated sending.

## Development scripts

- `npm run dev` starts the vinext dev server.
- `npm run build` builds the Cloudflare Worker output.
- `npm run start` starts the built Worker locally with Wrangler.
- `npm run deploy` deploys the Cloudflare Worker.
- `npm test` runs offline Seedance, scroll-motion and newsletter checks.
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
