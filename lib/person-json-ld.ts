import type { Profile } from "../content/profile";

/**
 * The schema.org Person block for the home page, as the text of a
 * <script type="application/ld+json">. "<" is escaped so no value can close the tag early.
 */
export function personJsonLd(
  profile: Pick<Profile, "name" | "role" | "site" | "linkedin" | "github">,
): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    url: profile.site,
    sameAs: [profile.linkedin, profile.github],
  }).replace(/</g, "\\u003c");
}
