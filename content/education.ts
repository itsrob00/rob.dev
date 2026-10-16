import type { YearSpan } from "@/lib/date-range";

export type Education = {
  qualification: string;
  field: string;
  institution: string;
  /** Town only: the Résumé never shows an address. */
  place: string;
  /** Years only: the source has no months, so none are invented. */
  years: YearSpan;
};

/** Newest first: the order the Résumé shows. */
export const education = [
  {
    qualification: "Technical diploma",
    field: "Transport and Logistics",
    institution: "Istituto Tecnico Nautico “G. Caboto”",
    place: "Gaeta",
    years: { start: 2014, end: 2019 },
  },
] as const satisfies readonly Education[];
