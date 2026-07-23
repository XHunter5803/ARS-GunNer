# ARS GunNer v0.7.3 — Validation Chain + Premier League Teams

1. Close the running development server.
2. Extract this ZIP.
3. Copy every extracted file and folder into the root of your existing `ARS-GunNer` repository.
4. Allow Windows to replace files with the same names. Keep the nested folder structure.
5. In GitHub Desktop, confirm the changed files, use summary `Add semantic Draft and daily source suggestions`, then commit and push to `main`.
6. Cloudflare Workers Builds should deploy automatically.

No new D1 migration is required for this update.

## Automatic workflow

Select exactly 1 real news item on Dashboard → click **ยืนยันและสร้าง Draft** → semantic ranking of recent D1/RSS reports → sourced Research Brief → facts, claims, and conflicts → original perspective article opens automatically in Article Editor → readiness validation → revision/review/approval. If only the selected source is available, the system still creates a low-readiness Draft and blocks publication until evidence is sufficient.

After deployment, click **Sync RSS** once. Existing feed rows are refreshed so newly detected image URLs can appear as covers; no D1 migration is required.

Research uses `@cf/meta/llama-3.1-8b-instruct-fast` for schema-controlled JSON. Every evidence point carries source IDs, unsupported `confirmed` labels are downgraded on the server, and the Article Editor provides direct source links for verification.

The Article Editor now shows each automated checker and the final Human Editor gate. If the writer omits required article fields, the system retries once and then returns the exact missing fields. The League tab includes compact filters for all 20 official 2026/27 Premier League clubs.

The AI may add original transitions and clearly marked analysis supported by the gathered evidence. It must not copy article sentences or invent facts, quotes, numbers, dates, people, or sources.

Daily reporter and news-outlet suggestions are calculated from the latest 14 days of D1 coverage. Use **Keep in Favorites** to save a suggestion to the existing Favorites list.
