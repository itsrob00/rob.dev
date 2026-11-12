import type { LanguageCode } from "@/lib/language-versions";
import { en } from "./en";
import { it } from "./it";

export type Profile = {
  name: string;
  email: `${string}@${string}.${string}`;
  linkedin: `https://www.linkedin.com/in/${string}`;
  github: `https://github.com/${string}`;
  /** The canonical origin, no trailing slash. */
  site: `https://${string}`;
};

export type ProfileCopy = {
  role: string;
  location: string;
  /** One line under the role. Doubles as the home meta description. */
  blurb: string;
  /** The About section: two paragraphs of plain text. */
  about: readonly [string, string];
};

export const profile = {
  name: "Rob",
  email: "roberto.prats00@gmail.com",
  linkedin: "https://www.linkedin.com/in/robertoprats",
  github: "https://github.com/itsrob00",
  site: "https://itsrob.dev",
} satisfies Profile;

export const profileCopy: Readonly<Record<LanguageCode, ProfileCopy>> = {
  en,
  it,
};
