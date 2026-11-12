import type { ReactNode } from "react";
import type { LanguageCode } from "../language-versions";
import type { ProjectKind } from "../projects";
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

export type Dictionary = {
  sections: { about: string; work: string; experience: string };
  sectionNav: string;
  languageMenu: string;
  stack: string;
  builtWith: string;
  email: string;
  resume: string;
  back: string;
  privacy: string;
  privacyText: (email: ReactNode) => ReactNode;
  inGaeta: string;
  themeSwitch: Record<Theme, string>;
  dates: {
    months: Months;
    ongoing: string;
    inProgress: string;
  };
  project: {
    kinds: Record<ProjectKind, string>;
    role: string;
    when: string;
    repository: string;
    live: string;
    repoPreview: (name: string) => string;
  };
  resumePage: {
    description: (who: {
      name: string;
      role: string;
      location: string;
    }) => string;
    download: string;
    native: string;
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
    text: (homeLink: (words: string) => ReactNode) => ReactNode;
  };
};

export const dictionary: Readonly<Record<LanguageCode, Dictionary>> = {
  en,
  it,
};
