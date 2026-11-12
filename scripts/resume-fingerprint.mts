import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// The Résumé fingerprint: the sha256 of every file a Language version's Résumé is built from, so its
// committed PDF can never silently drift from the page. Chromium's PDF bytes change on every render (timestamps), so
// the inputs are hashed, never a fresh PDF. The input set is derived from the page's imports, so the
// build check, the commit hook and the tests can't disagree about it. Plain Node runs this file
// (prebuild on Vercel has no tsx), so it imports only node: builtins, never repo modules.

/** Repo-relative POSIX path (or "recipe") → sha256 hex, in path order. Equal on Windows and Linux. */
export type Fingerprint = ReadonlyMap<string, string>;

export type ResumePdfCheck =
  { stale: false } | { stale: true; message: string };

export type ResumePdfEntry = {
  language: string;
  route: string;
  path: string;
  pdf: string;
  lock: string;
};

/** Repo-relative. The lock sits beside the page it certifies, outside public/ so it isn't served. */
export function resumePdfEntries(root: string): ResumePdfEntry[] {
  return listedLanguageVersions(root)
    .filter((version) => version.published)
    .map(({ code, pdfSuffix }) => ({
      language: code,
      route: ROUTE,
      path: `/${ROUTE.split("/")
        .slice(1)
        .map((segment) => (segment === "[lang]" ? code : segment))
        .join("/")}`,
      pdf: `public/Roberto-Prats-${pdfSuffix}.pdf`,
      lock: `${ROUTE}/resume-pdf.${code}.lock`,
    }));
}

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
export function fingerprintResume(
  root: string,
  entry: ResumePdfEntry,
): Fingerprint {
  const entries = resumeInputs(root, entry).map(
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
  entry: ResumePdfEntry,
  touched?: readonly string[],
): ResumePdfCheck {
  const inputs = fingerprintResume(root, entry);
  if (touched) {
    const relevant = touched
      .map((file) => toRepoPath(root, file))
      .some(
        (file) => inputs.has(file) || file === entry.pdf || file === entry.lock,
      );
    if (!relevant) return { stale: false };
  }
  const pdfFile = path.join(root, entry.pdf);
  const pdf = fs.existsSync(pdfFile) ? fs.readFileSync(pdfFile) : undefined;
  const changes = diff(readLock(root, entry), withPdf(entry, inputs, pdf));
  if (changes.length === 0) return { stale: false };
  return {
    stale: true,
    message: [
      `The Résumé PDF ${entry.pdf} is out of date.`,
      ...changes.map(({ kind, file }) => `  ${kind.padEnd(8)} ${file}`),
      `Run \`npm run resume:pdf\`, then commit ${entry.pdf} and ${entry.lock}.`,
    ].join("\n"),
  };
}

export function checkResumePdfs(
  root: string,
  touched?: readonly string[],
): ResumePdfCheck {
  const messages = resumePdfEntries(root).flatMap((entry) => {
    const check = checkResumePdf(root, entry, touched);
    return check.stale ? [check.message] : [];
  });
  if (messages.length === 0) return { stale: false };
  return { stale: true, message: messages.join("\n\n") };
}

/**
 * The only writer of the PDF and the lock. The lock goes last, so a crash in between leaves a pair
 * the check calls stale. `inputs` is the fingerprint taken before the build the PDF was printed from.
 */
export function saveResumePdf(
  root: string,
  entry: ResumePdfEntry,
  inputs: Fingerprint,
  pdf: Uint8Array,
): void {
  fs.mkdirSync(path.dirname(path.join(root, entry.pdf)), { recursive: true });
  fs.writeFileSync(path.join(root, entry.pdf), pdf);
  const lines = [...withPdf(entry, inputs, pdf)].map(
    ([file, hash]) => `${hash}  ${file}`,
  );
  fs.writeFileSync(
    path.join(root, entry.lock),
    [...LOCK_HEADER, ...lines, ""].join("\n"),
  );
}

// ---- internals ----------------------------------------------------------------------------

const LOCK_HEADER = [
  "# Written by `npm run resume:pdf`. The build fails when a line stops matching: run it again.",
  "# sha256 of each Résumé input (text with LF endings; Project MDX: frontmatter only), then of the PDF.",
];

type Change = { kind: "changed" | "new" | "removed"; file: string };

function withPdf(
  entry: ResumePdfEntry,
  inputs: Fingerprint,
  pdf: Uint8Array | undefined,
): Fingerprint {
  const entries = [...inputs];
  if (pdf) entries.push([entry.pdf, sha256(Buffer.from(pdf))]);
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
function readLock(root: string, entry: ResumePdfEntry): Fingerprint {
  const file = path.join(root, entry.lock);
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
const ROUTE = "app/[lang]/resume";

const LANGUAGE_LIST = "lib/language-versions.ts";

type ListedLanguageVersion = {
  code: string;
  pdfSuffix: string;
  published: boolean;
};

function listedLanguageVersions(root: string): ListedLanguageVersion[] {
  const text = fs.readFileSync(path.join(root, LANGUAGE_LIST), "utf8");
  const versions = [...text.matchAll(/\{[^{}]*\}/g)].flatMap(([object]) => {
    const code = /\bcode:\s*["']([^"']+)["']/.exec(object)?.[1];
    if (!code) return [];
    const pdfSuffix = /\bpdfSuffix:\s*["']([^"']+)["']/.exec(object)?.[1];
    const published = /\bpublished:\s*(true|false)\b/.exec(object)?.[1];
    if (!pdfSuffix || !published) {
      throw new Error(
        `${LANGUAGE_LIST}: "${code}" needs a literal pdfSuffix and published for the Résumé PDFs.`,
      );
    }
    return [{ code, pdfSuffix, published: published === "true" }];
  });
  if (versions.length === 0) {
    throw new Error(
      `${LANGUAGE_LIST} lists no Language version the Résumé PDFs can read.`,
    );
  }
  return versions;
}

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

function resumeInputs(root: string, entry: ResumePdfEntry): Input[] {
  const others = new Set(
    listedLanguageVersions(root)
      .map((version) => version.code)
      .filter((code) => code !== entry.language),
  );
  const ofAnotherLanguage = (file: string) =>
    file.split("/").some((segment) => others.has(segment)) ||
    others.has(path.posix.basename(file).split(".")[0]);
  const seen = new Set<string>();
  const queue = routeEntries(root, entry.route);
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (seen.has(file) || ofAnotherLanguage(file)) continue;
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
    for (const name of fs.readdirSync(path.join(root, dir), {
      encoding: "utf8",
      recursive: true,
    })) {
      const file = `${dir}/${name.split(path.sep).join("/")}`;
      if (file.endsWith(extension) && !ofAnotherLanguage(file))
        inputs.push({ path: file, frontmatterOnly: true });
    }
  }
  return inputs;
}

function routeEntries(root: string, route: string): string[] {
  const segments = route.split("/");
  const entries: string[] = [];
  for (let depth = 1; depth <= segments.length; depth++) {
    const dir = segments.slice(0, depth).join("/");
    entries.push(`${dir}/layout.tsx`, `${dir}/template.tsx`);
  }
  entries.push(`${route}/page.tsx`);
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
  const check = checkResumePdfs(process.cwd());
  if (check.stale) {
    console.error(check.message);
    process.exitCode = 1;
  } else {
    console.log("Résumé PDFs are up to date.");
  }
}
