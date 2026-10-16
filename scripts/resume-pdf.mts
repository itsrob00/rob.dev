import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import {
  checkResumePdf,
  fingerprintResume,
  RENDER_RECIPE,
  saveResumePdf,
} from "./resume-fingerprint.mts";

// `npm run resume:pdf [-- --force]`: builds the site, prints /resume with Playwright's Chromium and
// writes public/Rob-Resume.pdf plus its lock. Runs on Rob's machine only: Vercel's build image can't run
// Chromium, and the prebuild check only reads the lock. Needs `npx playwright install chromium` once.

const root = process.cwd();
const node = process.execPath;

// Every fingerprint key but the print recipe is a file.
const inputFiles = [...fingerprintResume(root).keys()].filter((key) =>
  fs.existsSync(path.join(root, key)),
);

// Vercel builds only what's committed, so a lock that hashes an untracked draft fails every deploy.
const untracked = execFileSync(
  "git",
  ["ls-files", "--others", "--exclude-standard", "--", ...inputFiles],
  { encoding: "utf8" },
).trim();
if (untracked) {
  console.error(
    `Commit or move these Résumé inputs before rendering:\n${untracked}`,
  );
  process.exit(1);
}

// Format the inputs first. Otherwise the commit hook's Prettier pass would rewrite one, the check
// would then fail the commit, and the next render would hash the unformatted file again.
execFileSync(
  node,
  [
    path.join(root, "node_modules/prettier/bin/prettier.cjs"),
    "--write",
    "--ignore-unknown",
    "--log-level=warn",
    ...inputFiles,
  ],
  { stdio: "inherit" },
);

// Chromium stamps every PDF with the time, so re-rendering unchanged inputs would only churn git.
if (!process.argv.includes("--force") && !checkResumePdf(root).stale) {
  console.log("Résumé PDF is up to date (pass -- --force to re-render).");
  process.exit(0);
}

// Hashed before the build, so the lock never claims newer inputs than the render saw.
const inputs = fingerprintResume(root);

// `next build`, not `npm run build`: its prebuild is the check this script is about to satisfy.
execFileSync(
  node,
  [path.join(root, "node_modules/next/dist/bin/next"), "build"],
  {
    stdio: "inherit",
  },
);

const pdf = await render(path.join(root, "out"));

if (!sameFingerprint(inputs, fingerprintResume(root))) {
  throw new Error(
    "A Résumé input changed while the PDF was rendering. Run `npm run resume:pdf` again.",
  );
}
saveResumePdf(root, inputs, pdf);
console.log(
  "Wrote public/Rob-Resume.pdf and app/resume/resume-pdf.lock. Commit both.",
);

/**
 * Prints out/resume.html. Requests are answered from out/ (clean URLs, as serve and Vercel do), so
 * there's no server, port or child process to clean up. A font or stylesheet that's missing fails the
 * render: a PDF in a fallback font must never be written.
 */
async function render(outDir: string): Promise<Uint8Array> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      colorScheme: RENDER_RECIPE.colorScheme,
    });
    const missing: string[] = [];
    await page.route("**/*", async (route) => {
      const request = route.request();
      const file = outFile(outDir, new URL(request.url()).pathname);
      if (file) return route.fulfill({ path: file });
      if (["font", "stylesheet"].includes(request.resourceType()))
        missing.push(request.url());
      return route.fulfill({ status: 404 });
    });

    await page.emulateMedia({
      media: RENDER_RECIPE.media,
      colorScheme: RENDER_RECIPE.colorScheme,
    });
    await page.goto("http://localhost/resume", { waitUntil: "networkidle" });
    // Playwright's page.pdf() doesn't wait for web fonts itself.
    await page.evaluate(() => document.fonts.ready);
    if (missing.length > 0)
      throw new Error(`The Résumé is missing:\n${missing.join("\n")}`);

    const links = await page.locator("article a[href]").count();
    const pdf = await page.pdf(RENDER_RECIPE.pdf);
    assertPrintable(pdf, links);
    return pdf;
  } finally {
    await browser.close();
  }
}

function outFile(outDir: string, pathname: string): string | undefined {
  const relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  for (const candidate of [
    relative,
    `${relative || "index"}.html`,
    path.join(relative, "index.html"),
  ]) {
    const file = path.join(outDir, candidate);
    if (fs.statSync(file, { throwIfNoEntry: false })?.isFile()) return file;
  }
  return undefined;
}

/**
 * The ticket's promises about the PDF, checked on the bytes before they're committed: one A4 page,
 * tagged, text selectable (fonts carry a ToUnicode map) and every link in the article clickable.
 */
function assertPrintable(pdf: Buffer, links: number): void {
  const text = pdf.toString("latin1");
  const problems: string[] = [];
  const pages = text.match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0;
  if (pages !== 1) problems.push(`${pages} pages, not 1`);
  const [, width, height] =
    text.match(/\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/) ?? [];
  if (Math.round(Number(width)) !== 595 || Math.round(Number(height)) !== 842) {
    problems.push(`page size ${width} × ${height} points, not A4 (595 × 842)`);
  }
  if (!text.includes("/StructTreeRoot")) problems.push("not tagged");
  if (!text.includes("/ToUnicode"))
    problems.push("text not selectable (no ToUnicode map)");
  const annotations = text.match(/\/Subtype\s*\/Link/g)?.length ?? 0;
  if (annotations !== links)
    problems.push(`${annotations} link annotations for ${links} links`);
  if (problems.length > 0) {
    throw new Error(
      `The rendered Résumé PDF isn't right:\n  ${problems.join("\n  ")}`,
    );
  }
}

function sameFingerprint(
  a: ReadonlyMap<string, string>,
  b: ReadonlyMap<string, string>,
): boolean {
  return (
    a.size === b.size && [...a].every(([file, hash]) => b.get(file) === hash)
  );
}
