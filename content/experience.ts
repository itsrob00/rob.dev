import type { DateRange } from "@/lib/date-range";

export type Experience = DateRange & {
  title: string;
  /** Employer, plus the client where there is one. */
  organization: string;
  /** Résumé style, no subject. The Résumé shows the same blurb. */
  blurb: string;
};

/** Newest first: the order the home page and the Résumé show. */
export const experience = [
  {
    title: "Front-end Engineer",
    organization: "Exolab Srl",
    start: "2026-01",
    blurb:
      "Lead the front end of PCO, a time and activity reporting platform for national and regional public facilities, built with Sogei after taking it over from IBM. Set the architecture for a team of 3 front-end developers, own front-end QA and sign off every front-end release. Introduced unit testing and grew the suite to 1,000+ tests at 85%+ coverage.",
  },
  {
    title: "Front-end Consultant",
    organization: "Exolab Srl, client Sisal via Reply",
    start: "2025-01",
    end: "2025-12",
    blurb:
      "Migrated Athena, the shell that hosts Sisal's online games, from React 15 to React 19 and from Webpack to Vite, shipping 3 months ahead of the deadline. Then designed and built, solo, the component library for Sisal's new VLT admin console, which is replacing the old Visual Basic application.",
  },
  {
    title: "Web Developer",
    organization: "Exolab Srl",
    start: "2023-01",
    end: "2024-12",
    blurb:
      "Built front-end features for GestCert and EMCS, two production systems of the Italian Customs and Monopolies Agency (ADM), for Sogei, in a 9–12 person team.",
  },
] as const satisfies readonly Experience[];
