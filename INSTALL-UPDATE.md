# ARS GunNer v0.8.4 — Draft Completion Guarantee

1. Close the running development server.
2. Extract this ZIP.
3. Copy every extracted file and folder into the root of your existing `ARS-GunNer` repository.
4. Allow Windows to replace files with the same names. Keep the nested folder structure.
5. In GitHub Desktop, confirm the changed files, use summary `Guarantee complete Draft after AI JSON failure`, then commit and push to `main`.
6. Cloudflare Workers Builds should deploy automatically.

No new D1 migration is required for this update.

## Draft completion guarantee

The writer first uses the required JSON Schema. If the model returns malformed JSON, the second attempt switches to a plain-text marker protocol that does not depend on JSON support. If both the configured writer and the research model still return an unusable shape, the server constructs a complete 5–7 paragraph Article Pattern Draft from the verified Research Brief and attached sources.

The final fallback never invents new facts, is labeled `Grounded fallback · review required`, caps readiness below 85, and cannot be approved until a Human Editor reviews and revises it.

## Football-only filter

New RSS items are classified before insertion. Football transfers, clubs, leagues, international competitions, and women's football remain included. Cricket, rugby, American football, basketball, motorsport, tennis, golf, combat sports, other unrelated sports, betting content, and promotional ticket/package posts are rejected.

Existing non-football rows can remain in D1 for audit history, but they are hidden from the Dashboard and excluded from AI research and daily Reporter/outlet suggestions. This update does not delete existing database records.

## Multi-source RSS fix

Adding a Source now saves it and immediately attempts to import that RSS/Atom feed. A failed fetch no longer removes the Source from future sync rotation. The registry shows the last fetch time, a readable error, and a per-source retry button. Scheduled sync uses oldest-fetch-first rotation so Sources added later are not permanently hidden behind the first eight feeds.

## Draft recovery update

The Article Pattern writer now requests a strict JSON Schema from Workers AI. If the first response is malformed or incomplete, it automatically regenerates the complete Draft. The parser can extract a balanced JSON object when a model adds short text around it. If the configured writer still fails after its retry, the successful Research model is used once as a fallback. A Draft is accepted only when it still contains a headline, 5–7 non-empty paragraphs, and a closing question.

## Dashboard update

The News Inbox now follows a compact football-market newsroom layout while keeping the original ARS GunNer branding. Real D1/RSS reports appear in a responsive two-column **News Ticker** with URL cover images, source-status labels, timestamps, source weights, a **Top Verified News** rail, daily Reporter/outlet discovery, and the existing Premier League team filters.

Selecting a card still selects exactly one real source. The fixed **ยืนยันและสร้าง Draft** action then runs the existing semantic research, evidence checking, Article Pattern generation, language cleaning, readiness validation, and Human Editor approval workflow.

## Automatic workflow

Select exactly 1 real news item on Dashboard → click **ยืนยันและสร้าง Draft** → semantic ranking of recent D1/RSS reports → sourced Research Brief → facts, claims, and conflicts → original perspective article opens automatically in Article Editor → readiness validation → revision/review/approval. If only the selected source is available, the system still creates a low-readiness Draft and blocks publication until evidence is sufficient.

After deployment, click **Sync RSS** once. Existing feed rows are refreshed so newly detected image URLs can appear as covers; no D1 migration is required.

Research uses `@cf/meta/llama-3.1-8b-instruct-fast` for schema-controlled JSON. Every evidence point carries source IDs, unsupported `confirmed` labels are downgraded on the server, and the Article Editor provides direct source links for verification.

The Article Editor now shows each automated checker and the final Human Editor gate. If the writer omits required article fields, the system retries once and then returns the exact missing fields. The League tab includes compact filters for all 20 official 2026/27 Premier League clubs.

The AI may add original transitions and clearly marked analysis supported by the gathered evidence. It must not copy article sentences or invent facts, quotes, numbers, dates, people, or sources.

Daily reporter and news-outlet suggestions are calculated from the latest 14 days of D1 coverage. Use **Keep in Favorites** to save a suggestion to the existing Favorites list.
