/** LinkedIn's proficiency scale, in sentence case, so the Résumé matches the profile. */
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
