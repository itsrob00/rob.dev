import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Project } from "./projects";

export type RepoPreview = {
  href: string;
  name: string;
  image: `/repo-previews/${string}`;
};

export function getRepoPreview(
  project: Pick<Project, "slug" | "links">,
): RepoPreview | undefined {
  const href = project.links.repo;
  if (href === undefined) return undefined;
  if (!githubRepo(href)) {
    throw new Error(`${project.slug}: ${href} ${NOT_GITHUB}`);
  }
  const entry = readManifest().get(href);
  if (!entry) {
    throw new Error(`${project.slug}: no Repo preview for ${href}. ${FIX}`);
  }
  if (!fs.existsSync(path.join(process.cwd(), "public", entry.image))) {
    throw new Error(
      `${project.slug}: the Repo preview for ${href} needs public${entry.image}, which is missing. ${FIX}`,
    );
  }
  return { href, name: entry.name, image: entry.image };
}

export type RepoTarget = { href: string; slugs: string[] };

export function repoTargets(
  projects: readonly Pick<Project, "slug" | "links">[],
): RepoTarget[] {
  const links = projects.flatMap(({ slug, links: { repo } }) =>
    repo === undefined ? [] : [{ href: repo, slug }],
  );
  const targets = [...Map.groupBy(links, (link) => link.href)]
    .map(([href, users]) => ({ href, slugs: users.map((user) => user.slug) }))
    .sort(byHref);
  const problems = targets
    .filter((target) => !githubRepo(target.href))
    .map(
      (target) => `${target.slugs.join(", ")}: ${target.href} ${NOT_GITHUB}`,
    );
  if (problems.length > 0) throw new Error(problems.join("\n"));
  return targets;
}

export type RepoSnapshot = {
  href: string;
  canonical: string;
  image: Uint8Array;
};

export type SaveReport = { written: string[]; removed: string[] };

export function saveRepoPreviews(
  snapshots: readonly RepoSnapshot[],
): SaveReport {
  const root = process.cwd();
  const problems: string[] = [];
  const planned: (Entry & { href: string; bytes: Uint8Array })[] = [];
  for (const snapshot of snapshots) {
    const linked = githubRepo(snapshot.href);
    const served = githubRepo(snapshot.canonical);
    const format = sniffImage(snapshot.image);
    if (!linked) problems.push(`${snapshot.href} ${NOT_GITHUB}`);
    else if (!served) {
      problems.push(
        `${snapshot.href}: GitHub's page names no repo (${snapshot.canonical}).`,
      );
    } else if (
      `${linked.owner}/${linked.repo}`.toLowerCase() !==
      `${served.owner}/${served.repo}`.toLowerCase()
    ) {
      problems.push(
        `${snapshot.href}: GitHub now serves this repo as https://github.com/${served.owner}/${served.repo}. Update links.repo, then run again.`,
      );
    }
    if (!format) {
      problems.push(
        `${snapshot.href}: GitHub's image isn't a PNG, JPEG or GIF.`,
      );
    } else if (snapshot.image.length > MAX_IMAGE_BYTES) {
      problems.push(`${snapshot.href}: GitHub's image is over 2 MB.`);
    }
    if (planned.some((p) => p.href === snapshot.href)) {
      problems.push(`${snapshot.href} is listed twice.`);
    }
    if (!served || !format) continue;
    const name = `${served.owner}/${served.repo}`;
    const image: Entry["image"] = `/repo-previews/${name.toLowerCase()}.${format}`;
    planned.push({ href: snapshot.href, name, image, bytes: snapshot.image });
  }
  if (problems.length > 0) {
    throw new Error(`${problems.join("\n")}\nNothing was written.`);
  }

  const files = new Map<string, string | Uint8Array>(
    planned.map(({ image, bytes }) => [`public${image}`, bytes]),
  );
  const manifest = Object.fromEntries(
    planned
      .sort(byHref)
      .map(({ href, name, image }) => [href, { name, image }]),
  );
  files.set(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  const written = [...files]
    .filter(([file, data]) => writeIfChanged(path.join(root, file), data))
    .map(([file]) => file);
  return { written, removed: prune(root, new Set(files.keys())) };
}

function byHref(a: { href: string }, b: { href: string }): number {
  return a.href < b.href ? -1 : a.href > b.href ? 1 : 0;
}

function prune(root: string, keep: ReadonlySet<string>): string[] {
  const dir = path.join(root, IMAGES);
  if (!fs.existsSync(dir)) return [];
  const removed: string[] = [];
  for (const entry of fs.readdirSync(dir, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile()) continue;
    const file = path
      .relative(root, path.join(entry.parentPath, entry.name))
      .replaceAll("\\", "/");
    const generated = IMAGE_PATH.test(file.slice("public".length));
    if (keep.has(file) || !(generated || file.endsWith(".tmp"))) continue;
    fs.rmSync(path.join(root, file));
    if (generated) removed.push(file);
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const folder = path.join(dir, entry.name);
    if (entry.isDirectory() && fs.readdirSync(folder).length === 0) {
      fs.rmdirSync(folder);
    }
  }
  return removed.sort();
}

const MANIFEST = "content/repo-previews.json";
const IMAGES = "public/repo-previews";
const FIX = `Run \`npm run repo-previews\`, then commit ${MANIFEST} and ${IMAGES}/.`;
const NOT_GITHUB =
  "isn't a GitHub repo (https://github.com/<owner>/<repo>). Only GitHub repos get a Repo preview.";

const FORMATS = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpg: [0xff, 0xd8, 0xff],
  gif: [0x47, 0x49, 0x46, 0x38],
} as const;

const MAX_IMAGE_BYTES = 2_000_000;

const REPO_NAME = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;
const IMAGE_PATH = new RegExp(
  `^/repo-previews/[a-z0-9-]+/[a-z0-9._-]+\\.(${Object.keys(FORMATS).join("|")})$`,
);

type Entry = { name: string; image: `/repo-previews/${string}` };

const manifestSchema = z.record(
  z.string(),
  z.strictObject({
    name: z.string().regex(REPO_NAME),
    image: z.custom<Entry["image"]>(
      (value) => typeof value === "string" && IMAGE_PATH.test(value),
      "must be an image under /repo-previews/",
    ),
  }),
);

function readManifest(): ReadonlyMap<string, Entry> {
  const file = path.join(process.cwd(), MANIFEST);
  if (!fs.existsSync(file)) return new Map();
  let json: unknown;
  try {
    json = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${MANIFEST} isn't valid JSON (${reason}).\n${FIX}`);
  }
  const parsed = manifestSchema.safeParse(json);
  if (!parsed.success) {
    const problems = parsed.error.issues.map(
      (issue) => `  ${issue.path.join(".")}: ${issue.message}`,
    );
    throw new Error(`${MANIFEST} is invalid:\n${problems.join("\n")}\n${FIX}`);
  }
  return new Map(Object.entries(parsed.data));
}

function sniffImage(bytes: Uint8Array): keyof typeof FORMATS | undefined {
  return (Object.keys(FORMATS) as (keyof typeof FORMATS)[]).find((format) =>
    FORMATS[format].every((byte, i) => bytes[i] === byte),
  );
}

function writeIfChanged(file: string, data: string | Uint8Array): boolean {
  const next = typeof data === "string" ? Buffer.from(data) : data;
  if (
    fs.existsSync(file) &&
    Buffer.compare(fs.readFileSync(file), next) === 0
  ) {
    return false;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(`${file}.tmp`, next);
  fs.renameSync(`${file}.tmp`, file);
  return true;
}

function githubRepo(href: string): { owner: string; repo: string } | undefined {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }
  const match = /^\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)\/?$/.exec(url.pathname);
  if (
    url.protocol !== "https:" ||
    url.host !== "github.com" ||
    url.username ||
    url.search ||
    url.hash ||
    !match ||
    match[2] === "." ||
    match[2] === ".."
  ) {
    return undefined;
  }
  return { owner: match[1], repo: match[2] };
}
