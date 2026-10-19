import { profile } from "../content/profile";
import type { Project } from "./projects";

// Absolute URLs for the files Next's metadataBase doesn't reach: the sitemap, robots and JSON-LD.
// Kept apart from site-metadata.ts, a Résumé fingerprint input, so a sitemap change never makes the
// PDF stale.

/**
 * The origin plus `path`, with no trailing slash on home: what Next renders for a canonical "/".
 */
export function absoluteUrl(path: "/" | `/${string}`): string {
  return path === "/" ? profile.site : `${profile.site}${path}`;
}

/** Every page on the site: home, the Résumé, then each Project in the order given. */
export function sitemapUrls(
  projects: readonly Pick<Project, "href">[],
): string[] {
  return ["/" as const, "/resume" as const, ...projects.map((p) => p.href)].map(
    absoluteUrl,
  );
}
