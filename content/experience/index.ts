import type { DateRange } from "@/lib/date-range";
import type { LanguageCode } from "@/lib/language-versions";
import { en } from "./en";
import { it } from "./it";

/** One piece of client work inside an Experience. Home shows it in short; the Résumé adds tech and bullets. */
export type Engagement = DateRange & {
  name: string;
  /** Rob's role on it. */
  role: string;
  /** Who it was for, and through whom: "Sisal, via Reply". */
  client: string;
  /** Résumé only. */
  tech: readonly [string, ...string[]];
  /** One line, no subject: what the system is. */
  description: string;
  /** Résumé only, Résumé style, no subject. */
  bullets: readonly [string, ...string[]];
};

/** Rob's time at one employer: the row, and the Engagements inside it. */
export type Experience = DateRange & {
  employer: string;
  /** Rob's title at the employer. */
  role: string;
  /** Newest first. */
  engagements: readonly [Engagement, ...Engagement[]];
};

/** Newest first: the order the home page and the Résumé show. */
export const experience: Readonly<Record<LanguageCode, readonly Experience[]>> =
  {
    en,
    it,
  };
