import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Projects are read only through lib/projects.ts, which validates them.
    ignores: ["lib/projects.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/content/projects/*", "**/content/projects/*"],
              message: "Read Projects through @/lib/projects.",
            },
            {
              group: [
                "@/content/repo-previews.json",
                "**/content/repo-previews.json",
              ],
              message: "Read Repo previews through @/lib/repo-previews.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".scratch/**",
    "content-source/**",
    ".next/**",
    "out/**",
    "next-env.d.ts",
    "test-results/**",
    "playwright-report/**",
  ]),
]);
