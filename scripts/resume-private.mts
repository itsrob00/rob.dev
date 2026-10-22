import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

// ADR 0001 as code: the details only the Résumé PDF shows. They come from .env.local and reach the
// page only through applyPrivateDetails, which scripts/resume-pdf.mts calls just before printing and
// the e2e print test calls with stand-in values. The page carries no placeholder: the places filled
// in are its own h1, its "Contact" list and its title.

/** Never hashed into the lock, never logged, never in a thrown message. */
export type PrivateDetails = {
  readonly fullName: string;
  readonly phone: string;
};

export const PRIVATE_ENV = {
  fullName: "RESUME_FULL_NAME",
  phone: "RESUME_PHONE",
} as const satisfies Record<keyof PrivateDetails, string>;

export function readPrivateDetails(
  env: Readonly<Record<string, string | undefined>>,
): PrivateDetails {
  const missing = Object.values(PRIVATE_ENV).filter(
    (name) => !env[name]?.trim(),
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.join(", ")}. Copy .env.example to .env.local and fill it in: only the Résumé PDF shows them.`,
    );
  }
  return {
    fullName: env[PRIVATE_ENV.fullName]!.trim(),
    phone: env[PRIVATE_ENV.phone]!.trim(),
  };
}

/** ("Résumé | Rob", name) → "Résumé | name": the page's own title, so "Résumé" is spelled once. */
export function pdfTitle(pageTitle: string, fullName: string): string {
  const cut = pageTitle.lastIndexOf(" | ");
  if (cut < 0) throw new Error(`No site name to replace in "${pageTitle}"`);
  return `${pageTitle.slice(0, cut)} | ${fullName}`;
}

/**
 * Writes the details into the loaded /resume page. Idempotent. Strict locators, so a page that stops
 * matching (no h1, two h1s, no "Contact" list) throws instead of printing a PDF without them.
 */
export async function applyPrivateDetails(
  page: Page,
  details: PrivateDetails,
): Promise<void> {
  await page
    .locator("article")
    .getByRole("heading", { level: 1 })
    .evaluate((h1, name) => {
      h1.textContent = name;
    }, details.fullName);
  await page
    .getByRole("list", { name: "Contact", exact: true })
    .evaluate((list, phone) => {
      list.querySelector("[data-pdf-only]")?.remove();
      const item = list.ownerDocument.createElement("li");
      item.dataset.pdfOnly = "";
      item.textContent = phone;
      const firstLink = [...list.children].find((child) =>
        child.querySelector("a"),
      );
      if (firstLink) firstLink.before(item);
      else list.append(item);
    }, details.phone);
  const title = pdfTitle(await page.title(), details.fullName);
  await page.evaluate((value) => {
    document.title = value;
  }, title);
}

/** The files, by name, whose contents carry either detail. The phone is also matched without spaces. */
export function filesContaining(
  files: Iterable<readonly [name: string, contents: string]>,
  details: PrivateDetails,
): string[] {
  const needles = [
    details.fullName,
    details.phone,
    details.phone.replace(/\s/g, ""),
  ];
  return [...files]
    .filter(([, contents]) =>
      needles.some((needle) => contents.includes(needle)),
    )
    .map(([name]) => name);
}

/**
 * Fails when a detail turns up in a tracked file or in the built site. `next build` loads .env.local,
 * so a page that read process.env would publish one. PDFs are skipped: the committed one is public by
 * design.
 */
export function assertUnpublished(
  root: string,
  outDir: string,
  details: PrivateDetails,
): void {
  const tracked = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean)
    .map((file) => path.join(root, file));
  const built = fs
    .readdirSync(outDir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));
  const leaks = filesContaining(
    [...tracked, ...built]
      .filter((file) => !file.endsWith(".pdf") && fs.existsSync(file))
      .map((file) => [
        path.relative(root, file),
        fs.readFileSync(file, "utf8"),
      ]),
    details,
  );
  if (leaks.length > 0) {
    throw new Error(
      `The Résumé's private details turned up in:\n  ${leaks.join("\n  ")}\nThey belong in the PDF only (ADR 0001).`,
    );
  }
}
