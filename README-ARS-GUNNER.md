# ARS GunNer Newsroom — Phase 3

Responsive newsroom dashboard for RSS discovery, fact checking, perspective articles, approval, scheduling, and social publishing workflows.

## What is included

- Argon-inspired responsive dashboard with desktop sidebar and mobile navigation
- Dashboard, Discovery, Favorites, Sources, Fact Check, Articles, Publishing, Schedule, and Settings workspaces
- Search, feed filters, navigation, notification, demo sync, and action feedback
- Clear `Demo data` labels for all sample news and metrics
- Cloudflare-compatible Worker build with `/api/v1/health`
- D1 schema for favorites, sources, feed items, event clusters, fact checks, articles, revisions, publication jobs, delivery attempts, and audit events
- Generated Drizzle migration under `drizzle/`
- Automated HTML and API health tests
- D1-backed Favorites and Source Registry APIs with validation
- News pipeline API for text cleaning, canonical URL deduplication, Main Source selection, independent-source checks, and Viral Score
- Perspective article validation API with language, structure, residue, and Readiness Score gates
- Interactive Favorites, Sources, Fact Check, and Article Editor workspaces
- RSS 2.0 and Atom parser with XML size limits, HTML cleanup, canonical URLs, and feed item deduplication
- Real RSS ingestion endpoint plus a Cron-ready Worker `scheduled()` handler
- Optional Workers AI Article Pattern endpoint with prompt-injection boundaries and deterministic source metadata
- Persistent article creation, revision history, review, approval, and readiness-gated state transitions

## Run in VS Code

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open the local address printed by Vite.

## Verify

```bash
npm run lint
npm test
```

## Current safety boundary

Phase 3 can fetch live RSS feeds from the HTTPS Source Registry and can call Workers AI after the `AI` binding is configured. Social publishing to Facebook, X, or Telegram remains disabled. No secret should be committed to GitHub or exposed in browser code.

The ingestion endpoint requires either Sites-authenticated request headers or a matching `CRON_SECRET`. A scheduled Worker run calls the ingestion service directly and does not need this HTTP secret.

## API

`GET /api/v1/health` returns a structured service status and request ID.

- `GET|POST|PATCH|DELETE /api/v1/favorites`
- `GET|POST|PATCH /api/v1/sources`
- `POST /api/v1/pipeline/analyze`
- `POST /api/v1/articles/validate`
- `GET|POST|PATCH /api/v1/articles`
- `POST /api/v1/articles/generate`
- `POST /api/v1/rss/parse`
- `POST /api/v1/rss/ingest`

## Database

The logical D1 binding is `DB`. Schema lives in `db/schema.ts`; generated SQL lives in `drizzle/`. Sites/Cloudflare provides the real database binding during deployment.

## Cloudflare Phase 3 bindings

- D1 binding: `DB`
- Workers AI binding: `AI`
- Optional model setting: `WORKERS_AI_MODEL` (defaults to `@cf/zai-org/glm-4.7-flash`)
- HTTP Cron protection: secret environment variable `CRON_SECRET`

See `cloudflare-phase3.example.jsonc` for the AI and Cron shape. Do not copy placeholder database IDs into production.
