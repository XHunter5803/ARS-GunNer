# ARS-GunNer Web Development Agent

## Mission

Build and maintain ARS-GunNer: a fast, trustworthy, mobile-first Arsenal news platform that collects relevant stories, verifies claims with reliable sources, creates concise Thai and English articles, and can distribute published stories through Telegram.

## Priorities

1. Accurate reporting with transparent source links.
2. Thai and English content only.
3. Responsive and accessible web design.
4. Simple administration and dependable automation.
5. Free-tier-friendly infrastructure and good performance.
6. Secure handling of user data and integration secrets.

## Preferred stack

- React, TypeScript, and Vite
- Tailwind CSS and reusable design tokens
- lucide-react icons
- Firebase Authentication, Cloud Firestore, and Firebase Hosting
- Firebase Functions for secrets, scheduled jobs, and protected integrations
- Zod for validation
- Vitest and React Testing Library
- ESLint and Prettier

Do not introduce a different framework or paid service without explaining the reason and trade-offs first.

## Product flow

Keyword search -> retrieve candidate stories -> compare reliable sources -> assign a verification status -> create a cited summary -> editor review -> publish to the website -> optionally send to Telegram.

Never present an unverified claim as confirmed. Preserve the source URL, publisher, author when available, publication time, retrieval time, and verification notes.

## Article rules

- Support Thai and English output only.
- Show sources on every factual article.
- Clearly distinguish confirmed facts, reports, rumors, opinions, and agent inference.
- Never invent quotations, names, dates, results, transfers, or links.
- Use a named quotation only when the speaker and wording are supported by a source.
- Prefer paraphrasing and use only short quotations when necessary.
- Use this structure when appropriate: previous context, latest development, concise summary, verification status, and sources.
- Avoid misleading or sensational headlines.

## Verification statuses

Support `unverified`, `single_source`, `corroborated`, `official`, `disputed`, `false`, and `opinion`.

Record who changed a verification status, when it changed, supporting sources, and an optional note.

## Initial features

- Public homepage with latest stories and verification badges
- Search and filters for keyword, category, language, source, date, and status
- Article pages with citations and related stories
- Admin sign-in and editorial dashboard
- Candidate-story review queue
- Thai and English article editor
- Source manager and verification notes
- Telegram delivery status and retry controls
- Settings for keywords, trusted sources, prompt patterns, and automation
- Clear-data actions with explicit confirmation

## Roles and security

- Admin: configuration, user management, clearing data, publishing, and integrations
- Editor: review, edit, translate, verify, and publish
- Viewer: public read access only

Use least-privilege Firestore rules. Hidden buttons are not authorization. Keep bot tokens, service credentials, and secret API keys off the client and out of the repository. Include only placeholders in `.env.example`.

## Design direction

Create an original premium sports-news identity without copying another website.

- Editorial, energetic, confident, and clean
- Deep navy or charcoal base with Arsenal-inspired red accents
- Warm off-white surfaces and restrained gold for verified highlights
- Inter with Noto Sans Thai or Anuphan
- Consistent 8-point spacing and reusable components
- Minimal motion with `prefers-reduced-motion` support
- Avoid excessive gradients, glass effects, shadows, and decorative animation
- Design loading, empty, error, offline, and permission-denied states
- Support 360 px mobile width and common desktop sizes
- Minimum touch target: 44 by 44 CSS pixels
- Visible keyboard focus and sufficient color contrast

## Architecture

- Organize code by feature.
- Keep UI components focused and reusable.
- Put Firebase access behind typed service modules.
- Use shared TypeScript models for users, sources, candidate stories, articles, verification records, and delivery jobs.
- Validate external and Firestore data.
- Store dates as Firestore timestamps.
- Use pagination and indexed queries rather than loading complete collections.
- Keep all secrets server-side.

## Telegram integration

- Keep the bot token server-side.
- Publish through a protected server function.
- Record delivery status, message ID, attempts, last error, and timestamps.
- Make delivery idempotent to prevent duplicate posts.
- Allow safe retries from the dashboard.
- Never expose secrets in logs or client-side errors.

## Working method

Before changing code, read this file, inspect relevant files and the current data model, restate the requested outcome and assumptions, and preserve existing behavior unless the request changes it.

During implementation, make the smallest coherent change, keep desktop and mobile consistent, add validation and permission checks, avoid unrelated rewrites, and update documentation.

Before finishing, run linting, type checking, tests, and a production build when available. Test mobile and desktop layouts, check failure states, confirm that no secrets were added, and summarize remaining limitations.

## Communication

Explanations for the project owner may be in Thai. Code, identifiers, commit messages, and technical documentation should normally be in English.
