# ARS GunNer v0.6.2 — Live RSS Confirm-to-Draft

1. Close the running development server.
2. Extract this ZIP.
3. Copy every extracted file and folder into the root of your existing `ARS-GunNer` repository.
4. Allow Windows to replace files with the same names. Keep the nested folder structure.
5. In GitHub Desktop, confirm the changed files, use summary `Add semantic Draft and daily source suggestions`, then commit and push to `main`.
6. Cloudflare Workers Builds should deploy automatically.

No new D1 migration is required for this update.

## Automatic workflow

Select 1–3 related news items on Dashboard → click **ยืนยัน** → semantic ranking of recent D1/RSS reports → sourced Research Brief → facts, claims, and conflicts → original perspective article opens automatically in Article Editor → readiness validation → revision/review/approval.

The AI may add original transitions and clearly marked analysis supported by the gathered evidence. It must not copy article sentences or invent facts, quotes, numbers, dates, people, or sources.

Daily reporter and news-outlet suggestions are calculated from the latest 14 days of D1 coverage. Use **Keep in Favorites** to save a suggestion to the existing Favorites list.
