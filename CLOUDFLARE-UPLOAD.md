# Correct the GitHub upload

The failed Cloudflare build happened because the project folders were flattened into the repository root. The root `package.json` contained SQL instead of JSON, so the dependency installer stopped before the build began.

## Recommended: GitHub Desktop

1. Install and open GitHub Desktop.
2. Clone `XHunter5803/ARS-GunNer`.
3. Extract the corrected ZIP into a separate folder.
4. Copy the **contents** of the extracted folder into the cloned repository folder. Allow folder merging and file replacement.
5. In GitHub Desktop, confirm paths such as `app/page.tsx`, `db/schema.ts`, `drizzle/0000_green_brother_voodoo.sql`, `lib/social-publishing.ts`, and `worker/index.ts` are shown.
6. Commit with the message `Restore project structure for Cloudflare` and push to `main`.

Do not copy `.env`, `.dev.vars`, Telegram tokens, or Cloudflare API tokens.

## Cloudflare rebuild

Cloudflare should rebuild automatically after the push. Its build settings should remain:

```text
Build command: npm run build
Deploy command: npx wrangler deploy
Root directory: /
```

During installation, the log should now detect `package-lock.json` and install the npm project. It should no longer show `CREATE TABLE` while parsing `package.json`.
