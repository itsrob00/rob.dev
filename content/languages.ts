/** LinkedIn's proficiency scale, so a typo or an invented level fails the type check. Sentence case, as in the site's copy. */
export type Proficiency =
  | "Elementary"
  | "Limited working"
  | "Professional working"
  | "Full professional"
  | "Native or bilingual";

export type Language = { name: string; proficiency: Proficiency };

/** The Résumé's Languages section, in this order. */
export const languages = [
  { name: "English", proficiency: "Native or bilingual" },
  { name: "Italian", proficiency: "Native or bilingual" },
] as const satisfies readonly Language[];
