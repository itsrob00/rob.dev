import { defineConfig } from "lint-staged/config";
import { checkResumePdf } from "./scripts/resume-fingerprint.mts";

// .husky/pre-commit runs these one glob at a time, in this order (--concurrent false), with every
// unstaged change hidden (--hide-unstaged), so the last task sees exactly what will be committed.
export default defineConfig({
  "*.{ts,tsx,mjs,mts}": ["eslint --fix", "prettier --write"],
  "*.{json,md,mdx,yml,yaml,css}": "prettier --write",
  // Last, so it hashes what the formatters left. It checks only when a Résumé input is staged.
  "*": {
    title: "Résumé PDF fingerprint",
    task: (files, { log }) => {
      const check = checkResumePdf(process.cwd(), files);
      if (!check.stale) return;
      log(check.message);
      throw new Error("The Résumé PDF is out of date.");
    },
  },
});
