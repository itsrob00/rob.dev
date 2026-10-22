import { createJiti } from "jiti";
import type { RepoSnapshot, RepoTarget } from "../lib/repo-previews.ts";

const IMAGE_HOSTS = new Set([
  "opengraph.githubassets.com",
  "repository-images.githubusercontent.com",
]);

export async function snapshotRepos(
  targets: readonly RepoTarget[],
  fetchFn: typeof fetch,
): Promise<RepoSnapshot[]> {
  const snapshots: RepoSnapshot[] = [];
  for (const { href, slugs } of targets) {
    const who = `${slugs.join(", ")} (${href})`;
    const page = await request(fetchFn, href, who);
    const tags = readMetaTags(await page.text());
    const image = tags.get("og:image");
    const canonical = tags.get("og:url");
    if (!image || !canonical) {
      throw new Error(
        `${who}: GitHub's page has no og:image or og:url. Nothing was written.`,
      );
    }
    const imageUrl = new URL(image, href);
    if (imageUrl.protocol !== "https:" || !IMAGE_HOSTS.has(imageUrl.host)) {
      throw new Error(
        `${who}: GitHub's og:image is on ${imageUrl.host}, not a host GitHub serves previews from. Nothing was written.`,
      );
    }
    const bytes = await request(fetchFn, imageUrl.href, who);
    snapshots.push({
      href,
      canonical,
      image: new Uint8Array(await bytes.arrayBuffer()),
    });
  }
  return snapshots;
}

async function request(
  fetchFn: typeof fetch,
  url: string,
  who: string,
): Promise<Response> {
  const { host } = new URL(url);
  let response: Response;
  try {
    response = await fetchFn(url, {
      headers: { "User-Agent": "itsrob.dev repo-previews" },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error);
    throw new Error(
      `${who}: couldn't reach ${host} (${cause}). Nothing was written.`,
    );
  }
  if (response.status === 429) {
    const minutes = minutesUntil(response.headers.get("Retry-After"));
    const wait = minutes
      ? `Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`
      : "Try again later.";
    throw new Error(
      `${who}: ${host} answered 429 (too many requests). ${wait} Nothing was written.`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `${who}: ${host} answered ${response.status}. Nothing was written.`,
    );
  }
  return response;
}

function minutesUntil(retryAfter: string | null): number | undefined {
  if (!retryAfter) return undefined;
  const seconds = /^\d+$/.test(retryAfter.trim())
    ? Number(retryAfter)
    : (Date.parse(retryAfter) - Date.now()) / 1000;
  if (!Number.isFinite(seconds)) return undefined;
  return Math.max(1, Math.ceil(seconds / 60));
}

function readMetaTags(html: string): ReadonlyMap<string, string> {
  const tags = new Map<string, string>();
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attributes = new Map<string, string>();
    for (const match of tag.matchAll(
      /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
    )) {
      attributes.set(
        match[1].toLowerCase(),
        decodeEntities(match[2] ?? match[3] ?? match[4]),
      );
    }
    const key = attributes.get("property") ?? attributes.get("name");
    const content = attributes.get("content");
    if (key && content !== undefined && !tags.has(key)) tags.set(key, content);
  }
  return tags;
}

function decodeEntities(text: string): string {
  return text.replace(
    /&(?:#(\d+)|#x([0-9a-f]+)|(amp|quot|apos|lt|gt));/gi,
    (entity, decimal: string, hex: string, named: string) => {
      const code = decimal ? Number(decimal) : hex ? parseInt(hex, 16) : -1;
      if (code >= 0) {
        return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
      }
      const names: Record<string, string> = {
        amp: "&",
        quot: '"',
        apos: "'",
        lt: "<",
        gt: ">",
      };
      return names[named.toLowerCase()] ?? entity;
    },
  );
}

if (import.meta.main) {
  const site = createJiti(import.meta.url);
  const { getProjects } =
    await site.import<typeof import("../lib/projects.ts")>(
      "../lib/projects.ts",
    );
  const { repoTargets, saveRepoPreviews } = await site.import<
    typeof import("../lib/repo-previews.ts")
  >("../lib/repo-previews.ts");
  try {
    const targets = repoTargets(getProjects());
    const report = saveRepoPreviews(await snapshotRepos(targets, fetch));
    for (const file of report.written) console.log(`Wrote ${file}`);
    for (const file of report.removed) {
      console.log(`Removed ${file} (no Project links it)`);
    }
    console.log(
      report.written.length + report.removed.length === 0
        ? "Nothing changed: GitHub's previews match the snapshot."
        : "Commit content/repo-previews.json and public/repo-previews/.",
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
