import type { Profile } from "../content/profile";
import { formatDateRange, type DateRange } from "./date-range";

type Link = { href: string; rel?: "me"; print: string };

/**
 * One item of the Résumé's contact list. A `link` is one <a> with a short label for screen and the
 * full address for print, so the PDF keeps one link annotation per link. A `print-link` is printed only.
 */
export type ContactItem =
  | { kind: "text"; text: string }
  | (Link & { kind: "link"; screen: string })
  | (Link & { kind: "print-link" });

export function contactItems(
  profile: Pick<Profile, "location" | "email" | "site" | "linkedin" | "github">,
  remote: string,
): readonly ContactItem[] {
  return [
    { kind: "text", text: profile.location },
    { kind: "text", text: remote },
    {
      kind: "link",
      href: `mailto:${profile.email}`,
      screen: "Email",
      print: profile.email,
    },
    { kind: "print-link", href: profile.site, print: displayUrl(profile.site) },
    {
      kind: "link",
      href: profile.linkedin,
      rel: "me",
      screen: "LinkedIn",
      print: displayUrl(profile.linkedin),
    },
    {
      kind: "link",
      href: profile.github,
      rel: "me",
      screen: "GitHub",
      print: displayUrl(profile.github),
    },
  ];
}

/** "https://www.linkedin.com/in/robertoprats" → "linkedin.com/in/robertoprats". The href keeps the full URL. */
export function displayUrl(href: string): string {
  return href.replace(/^https:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/** An Education entry's dates: one of three shapes, so an entry can't be both in progress and completed. */
export type EducationDates =
  | { kind: "in-progress" }
  | ({ kind: "months" } & Required<DateRange>)
  | { kind: "completed"; year: number };

/** "In progress" | "Sep 2022 – Apr 2023" | "2019". A reversed month range throws, failing the build. */
export function formatEducationDates(dates: EducationDates): string {
  switch (dates.kind) {
    case "in-progress":
      return "In progress";
    case "months":
      return formatDateRange(dates, "month");
    case "completed":
      return String(dates.year);
  }
}
