import type { ResumeRecord } from ".";

export const en = {
  profileParagraph:
    "Front-end developer working in React and TypeScript since 2023 on enterprise systems for the Italian public sector and Sisal. Currently working as Front-end Tech Lead on PCO, I set the technical direction for a team of 3 developers, work closely with back-end, analysts and the client, and am the sole owner of front-end quality with a suite of 1,000+ tests at 85%+ coverage. Pairing my experience and discipline with a tailor-made AI-agent workflow (available on my GitHub) allows me to ship quickly without lowering the quality bar.",
  remote: "Remote (CET)",
  skills: [
    {
      label: "Front-end",
      items: [
        "React",
        "TypeScript",
        "JavaScript",
        "Redux Toolkit",
        "Tailwind CSS",
        "Vite",
        "Headless UI",
        "Bootstrap",
      ],
    },
    {
      label: "Leadership",
      items: [
        "Front-end architecture",
        "Technical leadership",
        "Code review",
        "Release sign-off",
        "Client-facing proposals",
      ],
    },
    {
      label: "Quality",
      items: [
        "Unit testing",
        "Test strategy",
        "Jest",
        "Vitest",
        "React Testing Library",
        "Front-end QA",
      ],
    },
    {
      label: "AI-assisted development",
      items: ["Claude Code with a custom multi-agent workflow"],
    },
    {
      label: "Also used",
      items: [
        "Node.js (Express)",
        "Java (Spring)",
        "REST APIs",
        "MySQL",
        "MongoDB",
        "Git",
        "Figma",
        "Linux",
      ],
    },
  ],
  languages: [
    { name: "Italian", proficiency: "native" },
    { name: "English", proficiency: "native" },
  ],
  education: [
    {
      title: "CS50x: Introduction to Computer Science",
      institution: "Harvard University (edX)",
      dates: { kind: "in-progress" },
    },
    {
      title: "Full-stack development programme",
      institution: "Exolab",
      dates: { kind: "months", start: "2022-09", end: "2023-04" },
      detail:
        "Java, Spring, MySQL and React course, followed by pair programming with a senior front-end engineer",
    },
    {
      title: "Technical diploma, Transport and Logistics",
      institution: "Istituto Tecnico Nautico “G. Caboto”, Gaeta",
      dates: { kind: "completed", year: 2019 },
    },
  ],
  gdprLine:
    "I authorise the processing of my personal data under EU Regulation 2016/679 (GDPR) and Italian Legislative Decree 196/2003.",
} satisfies ResumeRecord;
