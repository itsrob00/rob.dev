import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// The Résumé fingerprint: the sha256 of every file /resume is built from, so the committed PDF can
// never silently drift from the page. Chromium's PDF bytes change on every render (timestamps), so
// the inputs are hashed, never a fresh PDF. The input set is derived from the page's imports, so the
// build check, the commit hook and the tests can't disagree about it. Plain Node runs this file
// (prebuild on Vercel has no tsx), so it imports only node: builtins, never repo modules.

/** Repo-relative POSIX path (or "recipe") → sha256 hex, in path order. Equal on Windows and Linux. */
export type Fingerprint = ReadonlyMap<string, string>;

export type ResumePdfCheck =
  { stale: false } | { stale: true; message: string };

/**
 * How `npm run resume:pdf` prints /resume. It's hashed too, so changing a print option makes the PDF
 * stale. A4 and the margins come from `@page` in app/globals.css (an input), the one place they're spelled.
 */
export const RENDER_RECIPE = {
  media: "print",
  colorScheme: "light",
  pdf: { preferCSSPageSize: true, printBackground: true, tagged: true },
} as const;

/** The fingerprint of the Résumé's inputs (not of the PDF). */
export function fingerprintResume(root: string): Fingerprint {
  const entries = resumeInputs(root).map(
    (input) => [input.path, sha256(read(root, input))] as const,
  );
  entries.push(["recipe", sha256(Buffer.from(JSON.stringify(RENDER_RECIPE)))]);
  return sorted(entries);
}

/**
 * Compares the lock with the current inputs and the committed PDF. With `touched` (the commit hook's
 * staged files, absolute or repo-relative), it passes without comparing unless one of them is an
 * input, the PDF or the lock. A missing lock is stale.
 */
export function checkResumePdf(
  root: string,
  touched?: readonly string[],
): ResumePdfCheck {
  const inputs = fingerprintResume(root);
  if (touched) {
    const relevant = touched
      .map((file) => toRepoPath(root, file))
      .some(
        (file) =>
          inputs.has(file) || file === RESUME_PDF || file === RESUME_LOCK,
      );
    if (!relevant) return { stale: false };
  }
  const pdfFile = path.join(root, RESUME_PDF);
  const pdf = fs.existsSync(pdfFile) ? fs.readFileSync(pdfFile) : undefined;
  const changes = diff(readLock(root), withPdf(inputs, pdf));
  if (changes.length === 0) return { stale: false };
  return {
    stale: true,
    message: [
      "The Résumé PDF is out of date.",
      ...changes.map(({ kind, file }) => `  ${kind.padEnd(8)} ${file}`),
      `Run \`npm run resume:pdf\`, then commit ${RESUME_PDF} and ${RESUME_LOCK}.`,
    ].join("\n"),
  };
}

/**
 * The only writer of the PDF and the lock. The lock goes last, so a crash in between leaves a pair
 * the check calls stale. `inputs` is the fingerprint taken before the build the PDF was printed from.
 */
export function saveResumePdf(
  root: string,
  inputs: Fingerprint,
  pdf: Uint8Array,
): void {
  fs.mkdirSync(path.dirname(path.join(root, RESUME_PDF)), { recursive: true });
  fs.writeFileSync(path.join(root, RESUME_PDF), pdf);
  const lines = [...withPdf(inputs, pdf)].map(
    ([file, hash]) => `${hash}  ${file}`,
  );
  fs.writeFileSync(
    path.join(root, RESUME_LOCK),
    [...LOCK_HEADER, ...lines, ""].join("\n"),
  );
}

// ---- internals ----------------------------------------------------------------------------

/** Repo-relative. The lock sits beside the page it certifies, outside public/ so it isn't served. */
const RESUME_PDF = "public/Rob-Resume.pdf";
const RESUME_LOCK = "app/resume/resume-pdf.lock";

const LOCK_HEADER = [
  "# Written by `npm run resume:pdf`. The build fails when a line stops matching: run it again.",
  "# sha256 of each Résumé input (text with LF endings; Project MDX: frontmatter only), then of the PDF.",
];

type Change = { kind: "changed" | "new" | "removed"; file: string };

function withPdf(
  inputs: Fingerprint,
  pdf: Uint8Array | undefined,
): Fingerprint {
  const entries = [...inputs];
  if (pdf) entries.push([RESUME_PDF, sha256(Buffer.from(pdf))]);
  return sorted(entries);
}

/** Changes from the lock to the current state, in path order. */
function diff(expected: Fingerprint, actual: Fingerprint): Change[] {
  const changes: Change[] = [];
  for (const file of new Set([...expected.keys(), ...actual.keys()])) {
    const before = expected.get(file);
    const after = actual.get(file);
    if (before === after) continue;
    changes.push({
      kind: !before ? "new" : !after ? "removed" : "changed",
      file,
    });
  }
  return changes.sort((a, b) => compare(a.file, b.file));
}

/** An empty fingerprint when there's no lock, so every input shows as new. */
function readLock(root: string): Fingerprint {
  const file = path.join(root, RESUME_LOCK);
  if (!fs.existsSync(file)) return new Map();
  const entries = fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [hash, ...rest] = line.split("  ");
      return [rest.join("  "), hash] as const;
    });
  return new Map(entries);
}

/** "C:\…\content\x.ts" or "content/x.ts" → "content/x.ts": the one place OS paths become repo paths. */
function toRepoPath(root: string, file: string): string {
  return path
    .relative(root, path.resolve(root, file))
    .split(path.sep)
    .join("/");
}

function sorted(entries: (readonly [string, string])[]): Fingerprint {
  return new Map(entries.sort(([a], [b]) => compare(a, b)));
}

/** Code-unit order, never locale order, so every machine sorts alike. */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** The route whose PDF this is. Its entries are every layout and template above it, then its page. */
const ROUTE = "app/resume";

/**
 * Folders the Résumé's code reads through fs, which no import reveals: FOLDER in lib/projects.ts
 * (itself an input, so editing it trips the check). The Résumé reads Project frontmatter only, so an
 * MDX body edit doesn't count. lib/projects.ts fails the build on any non-.mdx file in the folder.
 */
const RUNTIME_READS = [{ dir: "content/projects", extension: ".mdx" }] as const;

type Input = { path: string; frontmatterOnly: boolean };

/**
 * Quoted "./", "../" or "@/" string literals: imports, `import "./x.css"`, and asset paths such as
 * localFont's "./Satoshi-Regular.otf". Backtick templates aren't matched: lib/projects.ts builds an
 * MDX import from one, and the Résumé never loads a Project body.
 */
const LOCAL_SPECIFIER = /["']((?:\.\.?|@)\/[^"'\r\n]*)["']/g;

function resumeInputs(root: string): Input[] {
  const seen = new Set<string>();
  const queue = routeEntries(root);
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const bytes = fs.readFileSync(path.join(root, file));
    if (isBinary(bytes)) continue;
    for (const [, specifier] of bytes
      .toString("utf8")
      .matchAll(LOCAL_SPECIFIER)) {
      queue.push(resolveLocal(root, file, specifier));
    }
  }
  const inputs: Input[] = [...seen].map((file) => ({
    path: file,
    frontmatterOnly: false,
  }));
  for (const { dir, extension } of RUNTIME_READS) {
    for (const name of fs.readdirSync(path.join(root, dir))) {
      if (name.endsWith(extension))
        inputs.push({ path: `${dir}/${name}`, frontmatterOnly: true });
    }
  }
  return inputs;
}

function routeEntries(root: string): string[] {
  const segments = ROUTE.split("/");
  const entries: string[] = [];
  for (let depth = 1; depth <= segments.length; depth++) {
    const dir = segments.slice(0, depth).join("/");
    entries.push(`${dir}/layout.tsx`, `${dir}/template.tsx`);
  }
  entries.push(`${ROUTE}/page.tsx`);
  return entries.filter((file) => fs.existsSync(path.join(root, file)));
}

/** "@/x" is tsconfig's only alias. Tries what the bundler would: exact, .ts, .tsx, then an index file. */
function resolveLocal(
  root: string,
  fromFile: string,
  specifier: string,
): string {
  const base = specifier.startsWith("@/")
    ? specifier.slice(2)
    : path.posix.join(path.posix.dirname(fromFile), specifier);
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}/index.ts`,
    `${base}/index.tsx`,
  ]) {
    if (
      fs
        .statSync(path.join(root, candidate), { throwIfNoEntry: false })
        ?.isFile()
    ) {
      return candidate;
    }
  }
  throw new Error(
    `${fromFile} refers to "${specifier}", which is no file the Résumé fingerprint can find.`,
  );
}

/** Text with LF line endings, so a CRLF checkout on Windows hashes the same; binaries as raw bytes. */
function read(root: string, input: Input): Buffer {
  const bytes = fs.readFileSync(path.join(root, input.path));
  if (isBinary(bytes)) return bytes;
  const text = bytes.toString("utf8").replace(/\r\n?/g, "\n");
  return Buffer.from(
    input.frontmatterOnly ? (FRONTMATTER.exec(text)?.[0] ?? text) : text,
  );
}

/** The leading --- block, as gray-matter reads it in lib/projects.ts. */
const FRONTMATTER = /^---\n[\s\S]*?\n---(?:\n|$)/;

/** Git's own test for `text=auto`: a NUL byte in the first 8000 bytes. */
function isBinary(bytes: Buffer): boolean {
  return bytes.subarray(0, 8000).includes(0);
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// `npm run build`'s prebuild: fails the build (Vercel, CI, local) when the PDF is stale.
if (import.meta.main) {
  const check = checkResumePdf(process.cwd());
  if (check.stale) {
    console.error(check.message);
    process.exitCode = 1;
  } else {
    console.log("Résumé PDF is up to date.");
  }
}
