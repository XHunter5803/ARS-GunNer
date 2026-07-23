# ARS GunNer Newsroom

Editorial intelligence dashboard for discovering football news, comparing sources, creating evidence-aware perspective articles, and scheduling reviewed social posts.

## Version 0.8.0 capabilities

- Transfer-market-inspired responsive News Inbox using the original ARS GunNer brand: a real-news ticker in a two-column card grid, URL cover images, source-status labels, a top navigation bar, and a right rail for verified reports and daily Reporter/outlet suggestions
- Favorites and source management backed by Cloudflare D1
- Semantic topic research across recent RSS reports using meaning, people, events, decisions, and consequences instead of exact-word matching
- AI Research Briefs that preserve source links, separate facts from claims, record conflicts, and feed an original Article Pattern draft
- Daily reporter and news-outlet suggestions derived from the last 14 days of D1 coverage, with one-click saving to Favorites
- Live Dashboard feed from RSS reports stored in D1; select exactly 1 real report, click `ยืนยันและสร้าง Draft`, and let AI search semantically related D1 reports before the populated Article Editor opens
- RSS/Atom cover-image extraction from Media RSS, enclosures, or article HTML, with a safe source-initial fallback when an image is missing or broken
- Single-source Draft fallback with a deliberately low readiness score, persistent error details, and one-click retry; publication remains blocked until the evidence gate passes
- Structured Research Brief output using a JSON-capable Workers AI model, with a source ID and clickable URL for every evidence point
- Server-side evidence enforcement: `confirmed` requires an official source or two independent origins; unsupported confirmations are downgraded to `reported`, and conflicts require two cited sources
- Visible validation chain in Article Editor showing Discovery, Fact Check, Article Pattern, Language Cleaner, QA Gate, and final Human Editor approval
- Automatic one-time regeneration when the writer omits a required headline, 5–7 paragraph body, or closing question
- Compact 2026/27 Premier League team filters under the League tab, with horizontal scrolling on small screens
- RSS/Atom parsing, canonical-link deduplication, event clustering, and Cron ingestion
- Source ranking, confirmed-fact/report-claim separation, contradiction reporting, and readiness scoring
- Thai, English, and bilingual Article Pattern generation with revision history and approval gates
- Deterministic Telegram previews with the 4,096-character Bot API limit
- Idempotent publication jobs, scheduling, cancellation, delivery attempts, and a three-attempt retry ceiling
- External provider delivery is disabled by default and requires explicit configuration

## Editorial flow

```text
Enter topic → Semantic rank recent reports → Extract sourced main points
→ Separate facts, claims, and conflicts → Select main and supporting sources
→ Write an original perspective article → Validate language/readiness → Save revision
→ Preview → Approve → Schedule → Dispatch
```

Only approved articles with a readiness score of at least 85 can enter the publishing queue. Queue processing is bounded, records every attempt, and never logs provider tokens.

## API routes

- `GET /api/v1/health`
- `GET|POST|DELETE /api/v1/favorites`
- `GET|POST|PATCH|DELETE /api/v1/sources`
- `POST /api/v1/rss/parse`
- `POST /api/v1/rss/ingest`
- `POST /api/v1/pipeline/analyze`
- `POST /api/v1/articles/validate`
- `POST /api/v1/articles/generate`
- `POST /api/v1/research/draft`
- `GET /api/v1/suggestions`
- `GET|POST|PATCH /api/v1/articles`
- `POST /api/v1/publishing/preview`
- `GET|POST|PATCH /api/v1/publishing/jobs`
- `POST /api/v1/publishing/dispatch`

## Local setup

Requirements: Node.js `>=22.13.0` on Linux.

```bash
npm run install:ci
cp .dev.vars.example .dev.vars
npm run dev
```

Useful checks:

```bash
npm run lint
npm test
npm run db:generate
```

`npm test` builds and validates the Cloudflare artifact before running route and rendering tests.

## Direct Cloudflare deployment

This package includes `wrangler.jsonc` connected to the production D1 database
`ars-gunner-newsroom`. Telegram delivery stays disabled during deployment.

Use Git or GitHub Desktop to upload this repository so nested folders remain intact. Do not select every file from every subfolder and upload them all into the repository root. The repository must keep paths such as `app/page.tsx`, `db/schema.ts`, `drizzle/0000_green_brother_voodoo.sql`, `lib/social-publishing.ts`, and `worker/index.ts`.

Cloudflare Workers Builds settings:

```text
Production branch: main
Build command: npm run build
Deploy command: npx wrangler deploy
Root directory: /
```

To deploy from a terminal instead:

```bash
npm ci
npx wrangler login
npm run db:migrate:remote
npm run deploy:cloudflare
```

After the first deployment, add `TELEGRAM_BOT_TOKEN` as a Secret and `TELEGRAM_CHAT_ID` as a text variable in the deployed Worker. Keep `SOCIAL_PUBLISHING_ENABLED=false` until the Worker URL, D1 migrations, access policy, and Telegram preview have been verified.

See [CLOUDFLARE-UPLOAD.md](./CLOUDFLARE-UPLOAD.md) for the safe repository replacement steps.

## Cloudflare bindings

The application expects these bindings in production:

- `DB`: Cloudflare D1 database
- `AI`: Workers AI binding
- `ASSETS` and `IMAGES`: Vinext/Cloudflare runtime bindings
- Cron Trigger: recommended every 15 minutes for RSS ingestion and due publication jobs

Apply the SQL migrations under `drizzle/` in order. Migration `0002` is compatible with publication jobs created before Phase 4; their deduplication key remains null while every new job receives a deterministic key.

## Secrets and provider delivery

Copy `.dev.vars.example` for the full variable list. Keep this safety switch off while setting up credentials:

```dotenv
SOCIAL_PUBLISHING_ENABLED=false
```

Provider variables:

- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- Manual Cron/API dispatch: `CRON_SECRET`

Version 0.8.0 accepts Telegram jobs only. Turn `SOCIAL_PUBLISHING_ENABLED=true` on only after verifying the target chat, preview output, queue schedule, access controls, and both Telegram values.

## Safety notes

- Article generation must use only the selected source material. It may add original transitions and clearly marked analysis, but never unsupported facts.
- A low readiness score blocks approval and scheduling.
- Provider responses are truncated before storage; secrets are never included in API responses.
- Publishing jobs use deterministic keys to prevent duplicate schedules.
- Failed delivery is retried at most three times and then marked failed for review.
