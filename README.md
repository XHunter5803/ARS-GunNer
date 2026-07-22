# ARS GunNer Newsroom

Editorial intelligence dashboard for discovering football news, comparing sources, creating evidence-aware perspective articles, and scheduling reviewed social posts.

## Version 0.5 capabilities

- Argon-inspired responsive newsroom dashboard
- Favorites and source management backed by Cloudflare D1
- RSS/Atom parsing, canonical-link deduplication, event clustering, and Cron ingestion
- Source ranking, confirmed-fact/report-claim separation, contradiction reporting, and readiness scoring
- Thai, English, and bilingual Article Pattern generation with revision history and approval gates
- Deterministic Telegram previews with the 4,096-character Bot API limit
- Idempotent publication jobs, scheduling, cancellation, delivery attempts, and a three-attempt retry ceiling
- External provider delivery is disabled by default and requires explicit configuration

## Editorial flow

```text
Discover → Clean → Deduplicate → Cluster → Fact-check → Select main source
→ Draft perspective article → Validate language/readiness → Save revision
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

### Option A: Cloudflare Workers Builds with GitHub

1. Extract the ZIP and upload the extracted files—not the ZIP itself—to the root of the GitHub repository.
2. In Cloudflare, open **Workers & Pages**, choose **Create application**, then import the GitHub repository.
3. Use production branch `main`, build command `npm run build`, and deploy command `npx wrangler deploy`.
4. Deploy once, then open the resulting Worker and confirm its D1 binding is named `DB` and its AI binding is named `AI`.
5. Apply the D1 migrations before using the dashboard.

Cloudflare Workers Builds runs the build command first and the Wrangler deploy command second. Future pushes to `main` can redeploy automatically.

### Option B: deploy from a terminal

Requirements: Node.js 22 and a Cloudflare account.

```bash
npm ci
npx wrangler login
npm run db:migrate:remote
npm run deploy:cloudflare
```

The migration command applies every unapplied SQL file in `drizzle/` to the configured remote D1 database. Review the database name in Wrangler's confirmation prompt before accepting it.

### Production variables and secrets

In the deployed Worker, open **Settings → Variables and Secrets** and add:

- Secret `TELEGRAM_BOT_TOKEN`
- Text variable `TELEGRAM_CHAT_ID`
- Secret `CRON_SECRET`
- Text variable `SOCIAL_PUBLISHING_ENABLED=false`

Never commit `.dev.vars`, `.env`, bot tokens, or Cloudflare API tokens. The repository ignores local secret files. Keep publishing disabled until the Worker URL, D1 migrations, authentication/access policy, and Telegram preview have been verified.

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

Version 0.5 accepts Telegram jobs only. Turn `SOCIAL_PUBLISHING_ENABLED=true` on only after verifying the target chat, preview output, queue schedule, access controls, and both Telegram values.

## Safety notes

- Article generation must use only supplied source material.
- A low readiness score blocks approval and scheduling.
- Provider responses are truncated before storage; secrets are never included in API responses.
- Publishing jobs use deterministic keys to prevent duplicate schedules.
- Failed delivery is retried at most three times and then marked failed for review.
