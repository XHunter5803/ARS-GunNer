# ARS-GunNer Multi-Agent Development Rules

## Mission

Build ARS-GunNer as a fast, trustworthy, mobile-first Arsenal news platform that discovers reports, verifies claims, creates Thai and English articles, and publishes approved content to the web and social channels.

## Official architecture

- Frontend: React, TypeScript, Vite, and Tailwind CSS
- Platform: Cloudflare Pages and Workers
- Database: Cloudflare D1
- Media and generated assets: Cloudflare R2
- AI tasks: Workers AI where suitable
- Automation: Cron Triggers and protected Worker routes
- Validation: Zod
- Testing: Vitest, React Testing Library, and appropriate integration or end-to-end tests

Do not introduce Firebase or another backend without an approved architecture decision and migration plan.

## Agent team

1. Lead Architect: owns plans, boundaries, contracts, migrations, integration, and delegation.
2. UI UX Web Designer: owns the original Argon-inspired responsive design system and screen specifications.
3. Frontend Developer: implements typed, accessible UI and connects approved API contracts.
4. Cloudflare Backend: owns Workers, D1, R2, Workers AI, Cron, APIs, authentication, and secrets.
5. News Discovery: owns source discovery, URL deduplication, event clustering, and explainable Viral Score.
6. Fact Checking: owns claim comparison, contradictions, original-source tracing, and verification status.
7. Article Pattern: owns Thai, English, and bilingual article drafting using approved structures.
8. Language Cleaner: removes noise and broken text without changing supported meaning.
9. Social Publishing: owns previews, queues, schedules, retries, and delivery records.
10. QA and Security: owns tests, permissions, migration safety, secret checks, and release readiness.

For cross-cutting work, the Lead Architect defines contracts and delivery order first. Specialists must not silently change another agent's contract or ownership area.

## Product flow

Keyword, outlet, or reporter search -> normalize and deduplicate -> cluster the same event -> calculate explainable Viral Score -> compare evidence -> assign verification status -> clean source text -> create a cited article draft -> editor review -> preview -> publish -> record delivery.

Popularity never proves truth. Live discovery, external publishing, and AI output must fail safely and show their actual status.

## Content rules

- Output only Thai, English, or an explicitly selected bilingual format.
- Every factual article must preserve and display its sources.
- Distinguish confirmed fact, claim, rumor, opinion, prediction, contradiction, and agent inference.
- Never invent facts, quotations, names, dates, results, transfers, citations, or source links.
- Named quotations require source support.
- Use concise paraphrasing and avoid imitating a publisher's distinctive style.
- Do not publish unsupported information as confirmed.

Supported verification statuses are `unverified`, `single_source`, `corroborated`, `official`, `disputed`, `false`, and `opinion`. Record the reviewer, time, sources, and note for each status change.

## Article pattern

When the automatic มุมมอง/บทวิเคราะห์ pattern is selected:

1. Opening label: `มุมมอง` or `ANALYSIS`.
2. One cause-and-direction headline.
3. Previous context.
4. Latest development or hook.
5. Evidence-based explanation.
6. Clearly labeled analysis of what it may mean.
7. Verification status and sources.

## Design rules

Create an original Argon-inspired interface without copying proprietary screens or assets. Use a premium editorial sports identity, Thai and English typography, reusable tokens, clear hierarchy, visible focus, sufficient contrast, 44px touch targets, and support from 360px mobile through desktop. Design loading, empty, error, offline, permission-denied, and partial-data states. Avoid excessive animation, gradients, glass effects, and decorative clutter.

## API, data, and security rules

- Define and validate shared request, response, error, article, source, verification, user, queue, and delivery types.
- Use numbered, forward-only D1 migrations. Never destructively alter deployed data without an approved migration and recovery plan.
- Use parameterized SQL, indexes, pagination, and idempotent background jobs.
- Enforce authorization on the Worker or database boundary, not only in the UI.
- Keep all secrets in protected Cloudflare bindings. Never commit or expose tokens in client code or logs.
- Require preview and explicit authorization before the first external publication.
- Record social delivery status, external ID, attempts, timestamps, and sanitized errors.
- Respect source access controls, robots rules, licenses, and site terms. Do not bypass paywalls.

## Working method

Before changing code, read this file and the nearest nested instructions, inspect affected code and contracts, state assumptions, and define acceptance criteria. Make the smallest coherent change and avoid unrelated rewrites.

Before finishing, run available lint, typecheck, tests, and production build; test mobile and desktop states; review security and data migration risk; confirm that no secrets were added; and report changes, validation, limitations, and remaining risks.

Explanations to the project owner may be in Thai. Code, identifiers, commits, and technical documentation should normally be in English.
