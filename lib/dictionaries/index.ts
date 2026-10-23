import type { ReactNode } from "react";
import type { LanguageCode } from "../language-versions";
import type { Theme } from "../theme";
import { en } from "./en";
import { it } from "./it";

type Months = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

/** Every interface string, for one Language version. Content (profile, Projects…) lives elsewhere. */
export type Dictionary = {
  /** The home sections' <h2> and nav labels, by section id. */
  sections: { about: string; stack: string; work: string; experience: string };
  /** aria-label of the section nav. */
  sectionNav: string;
  /** aria-label of the language menu. */
  language: string;
  /** aria-label of a Project's stack pills. */
  stack: string;
  email: string;
  /** The Résumé's link, page title and <title>. */
  resume: string;
  /** The link home at the top of every page but home. */
  back: string;
  /** The Privacy notice's label and the link to it. */
  privacy: string;
  /** The Privacy notice after its label, with Rob's email link in it. */
  privacyText: (email: ReactNode) => ReactNode;
  /** After the time: "14:05 CEST in Gaeta". */
  clock: string;
  /** The theme switch's label, by the theme it switches to. */
  themeSwitch: Record<Theme, string>;
  dates: {
    /** January first. */
    months: Months;
    /** The end of an ongoing range. */
    ongoing: string;
    /** An Education entry not yet finished. */
    inProgress: string;
  };
  project: {
    /** The label above a Project's title: "Open source · 2026". */
    kicker: (year: string) => string;
    role: string;
    when: string;
    repository: string;
    live: string;
    /** aria-label of the Repo preview. */
    repoPreview: (name: string) => string;
  };
  resumePage: {
    description: (who: {
      name: string;
      role: string;
      location: string;
    }) => string;
    download: string;
    /** aria-label of the contact list. */
    contact: string;
    headings: {
      profile: string;
      experience: string;
      projects: string;
      skills: string;
      languages: string;
      education: string;
    };
  };
  notFound: {
    title: string;
    /** `homeLink` draws its words as the link to that Language version's home page. */
    text: (homeLink: (words: string) => ReactNode) => ReactNode;
  };
};

const DICTIONARIES = { en, it } satisfies Record<LanguageCode, Dictionary>;

export function dictionary(code: LanguageCode): Dictionary {
  return DICTIONARIES[code];
}
