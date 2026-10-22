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
          ],
        },
      ],
    },
  },
  {
    ignores: ["components/anchor.tsx", "components/section-nav.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='a']",
          message:
            "Write a link as <Anchor> from @/components/anchor (it opens other sites in a new tab), or <NavLink> for a page of this site.",
        },
        {
          selector:
            "JSXOpeningElement[name.name=/^(Link|NavLink)$/] > JSXAttribute[name.name='target']",
          message:
            "next/link skips client navigation when it has a target. Link to another site with <Anchor>.",
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
