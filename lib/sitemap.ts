import type { MetadataRoute } from "next";
import { profile } from "../content/profile";
import {
  alternatesFor,
  pathIn,
  publishedLanguageVersions,
  type SitePath,
} from "./language-versions";
import type { Project } from "./projects";

// Absolute URLs for the files Next's metadataBase doesn't reach: the sitemap, robots and JSON-LD.
// Kept apart from site-metadata.ts, a Résumé fingerprint input, so a sitemap change never makes the
// PDF stale.

/**
 * The origin plus `path`, with no trailing slash on home: what Next renders for a canonical "/".
 */
export function absoluteUrl(path: SitePath): string {
  return path === "/" ? profile.site : `${profile.site}${path}`;
}

/** Every page in each published Language version: home, the Résumé, then each Project in the order given. */
export function sitemapEntries(
  projects: readonly Pick<Project, "href">[],
): MetadataRoute.Sitemap {
  const paths: SitePath[] = ["/", "/resume", ...projects.map((p) => p.href)];
  return publishedLanguageVersions().flatMap(({ code }) =>
    paths.map((path) => ({
      url: absoluteUrl(pathIn(code, path)),
      alternates: {
        languages: Object.fromEntries(
          Object.entries(alternatesFor(path)).map(([language, href]) => [
            language,
            absoluteUrl(href),
          ]),
        ),
      },
    })),
  );
}
