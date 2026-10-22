import type { DateRange } from "@/lib/date-range";

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
export const experience = [
  {
    employer: "Exolab S.r.l., Rome",
    role: "Front-end Software Engineer",
    start: "2023-01",
    engagements: [
      {
        name: "PCO",
        role: "Front-end Tech Lead",
        client: "Sogei",
        start: "2026-01",
        tech: [
          "React",
          "Redux Toolkit",
          "TypeScript",
          "Tailwind",
          "Vite",
          "Jest",
          "Vitest",
        ],
        description:
          "Time and activity reporting platform for national and regional public facilities, taken over from IBM and in active development.",
        bullets: [
          "Sole owner of front-end QA: introduced unit testing to the project, grew the suite from zero to 1,000+ tests at 85%+ coverage and sign off every front-end release.",
          "Lead a team of 3 front-end developers on architecture and UX, alongside 4 back-end developers and 2 analysts, and present proposals directly to our clients.",
          "Build features with devflow, my customised Claude Code workflow built on Matt Pocock's skills and pstack, still in development and open source on GitHub.",
        ],
      },
      {
        name: "VLT Admin Console Component Library",
        role: "Front-end Consultant",
        client: "Sisal, via Reply",
        start: "2025-10",
        end: "2025-12",
        tech: [
          "React",
          "Redux Toolkit",
          "TypeScript",
          "Tailwind",
          "Headless UI",
          "Vite",
        ],
        description:
          "Component library for Sisal's new VLT admin console, built in the 3 months saved by delivering Athena early.",
        bullets: [
          "Designed and built it alone, from UI/UX direction through implementation, with Claude Design and Claude Code.",
          "Sisal is now using the library to build the console that replaces the old Visual Basic application.",
        ],
      },
      {
        name: "Athena",
        role: "Front-end Consultant",
        client: "Sisal, via Reply",
        start: "2025-01",
        end: "2025-10",
        tech: ["React", "Redux Toolkit", "TypeScript", "Tailwind", "Vite"],
        description:
          "Game shell hosting Sisal's online games, with player top-ups, withdrawals and history.",
        bullets: [
          "Shipped the full migration from React 15 class components to React 19, and from Webpack to Vite, 3 months ahead of the December deadline, using AI chat assistants to speed up the work.",
          "Wrote most of the code in a team of 2 developers, ported internal libraries to modern React, and documented the result for handover.",
        ],
      },
      {
        name: "GestCert and EMCS",
        role: "Front-end Developer",
        client: "Sogei, for ADM",
        start: "2023-04",
        end: "2024-12",
        tech: ["React", "Redux Toolkit", "Bootstrap"],
        description:
          "Production systems of the Italian Customs and Monopolies Agency: GestCert issues the digital certificates operators' systems use to authenticate with ADM servers; EMCS tracks excise goods under duty suspension in real time.",
        bullets: [
          "Delivered front-end features for both systems in a 9–12 person team on the client's release cycle, and helped colleagues through complex tasks.",
        ],
      },
    ],
  },
] as const satisfies readonly Experience[];
