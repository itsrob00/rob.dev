import type { Metadata } from "next";
import { profile } from "../content/profile";
import type { Project } from "./projects";

// What each page tells search engines and link previews. The root layout and the Résumé page import
// this file, so it's a Résumé fingerprint input: keep it to page metadata and card copy. Drawing the
// images lives in share-images.tsx, which the Résumé never imports, so restyling a card never makes
// the PDF stale. The fingerprint reads quoted local paths in this file as imports, so quote none here
// but real files.

/** A route on this site: "/" or a path with no trailing slash. */
type Path = "/" | `/${string}`;

/** Every generated sharing image. The renderer and the og:image tags both read it. */
export const SHARE_IMAGE = {
  width: 1200,
  height: 630,
  type: "image/png",
} as const;

/**
 * The routes that own an opengraph-image.tsx. The Résumé isn't one: it reuses home's card, and the
 * type stops a page pointing og:image at an image that's never built.
 */
type CardPath = "/" | Project["href"];

/** One sharing image: what it draws, and (through `path`) where its opengraph-image.tsx lives. */
export type ShareCard = {
  path: CardPath;
  /** The small line above the title, e.g. "Open source · 2026". */
  kicker?: string;
  title: string;
  text: string;
};

/**
 * The root layout's metadata: only the URL base and the titles. No description, canonical or
 * openGraph, because whatever the layout sets also lands on the 404 page, which must claim no URL.
 * (The 404 still picks up home's image through the file convention; it's noindex, so that's harmless.)
 */
export const rootMetadata: Metadata = {
  metadataBase: new URL(profile.site),
  title: {
    // Home's title (a template doesn't reach a page in the layout's own segment) and the 404's.
    default: `${profile.name} | ${profile.role}`,
    template: `%s | ${profile.name}`,
  },
};

/** Name and role. Home's image, which the Résumé reuses. */
export const homeCard: ShareCard = {
  path: "/",
  title: profile.name,
  text: profile.role,
};

/** A Project's title and summary, under its kicker. */
export function projectCard(project: Project): ShareCard {
  return {
    path: project.href,
    kicker: project.kicker,
    title: project.title,
    text: project.summary,
  };
}

/** The text equivalent of a card's image: what it draws, without the kicker. */
export function cardAlt(card: ShareCard): string {
  return `${card.title}: ${card.text}`;
}

/**
 * A page's metadata. It always sets the whole openGraph object: Next merges metadata shallowly, so a
 * page setting only part of it would drop the rest. Next fills og:title, og:description and every
 * twitter tag (a large-image card) from the page's title, its description and this image.
 */
export function pageMetadata(page: {
  /** The page's own route: its canonical URL and og:url. */
  path: Path;
  /** Omitted on home only, which takes the layout's default. The rest get the layout's template. */
  title?: string;
  /** Required: the layout sets none, so a page without one would have no description at all. */
  description: string;
  card: ShareCard;
}): Metadata {
  return {
    ...(page.title !== undefined && { title: page.title }),
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      siteName: profile.name,
      locale: "en_US",
      type: "website",
      url: page.path,
      images: [
        {
          url: shareImagePath(page.card.path),
          alt: cardAlt(page.card),
          width: SHARE_IMAGE.width,
          height: SHARE_IMAGE.height,
          type: SHARE_IMAGE.type,
        },
      ],
    },
  };
}

/**
 * Where the opengraph-image.tsx for `path` is exported. Spelled here rather than left to the file
 * convention because the convention's alt is one string per file, and each Project needs its own.
 * e2e/metadata.spec.ts fetches every og:image, so a wrong path fails CI.
 */
function shareImagePath(path: CardPath): string {
  return `${path === "/" ? "" : path}/opengraph-image`;
}
