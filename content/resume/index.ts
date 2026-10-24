import type { LanguageCode } from "@/lib/language-versions";
import type { EducationDates } from "@/lib/resume";
import { en } from "./en";
import { it } from "./it";

// What only the Résumé shows. A fact home shows any part of lives in the profile, experience or
// stack modules instead.

/** One line of the Skills section: "Label: item, item". */
export type SkillGroup = {
  label: string;
  items: readonly [string, ...string[]];
};

/** CEFR levels, plus "native" for a mother tongue. A typo or an invented level fails the type check. */
export type Proficiency = "native" | "C2" | "C1" | "B2" | "B1" | "A2" | "A1";

export type Language = { name: string; proficiency: Proficiency };

export type Education = {
  title: string;
  /** School and town, never an address. */
  institution: string;
  dates: EducationDates;
  detail?: string;
};

export type ResumeRecord = {
  /** Under the "Profile" heading. Not profile.blurb, which stays one line for home. */
  profileParagraph: string;
  /** After profile.location in the contact list. */
  remote: string;
  skills: readonly SkillGroup[];
  languages: readonly Language[];
  /** Newest first. */
  education: readonly Education[];
  /** At the foot of the Résumé. */
  gdprLine: string;
};

export const resume: Readonly<Record<LanguageCode, ResumeRecord>> = {
  en,
  it,
};
