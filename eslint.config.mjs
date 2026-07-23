import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy upload fragments kept for reference but not imported by the app.
    "chatgpt-auth.ts",
    "route.ts",
    "route (2).ts",
    "route (3).ts",
    "social-publishing.ts",
  ]),
]);

export default eslintConfig;
